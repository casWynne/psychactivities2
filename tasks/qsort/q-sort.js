(() => {
    "use strict";

    // ---------------------------------------------------------------------------
    // DOM helpers
    // ---------------------------------------------------------------------------
    const $ = (id) => document.getElementById(id);
    const on = (el, event, handler) => el && el.addEventListener(event, handler);

    const CONFIG = {
        // Default for the checkbox on page load
        enableThoughtTypesByDefault: false,

        // If false: when disabling thought types, keep existing cards as-is.
        // If true: normalize ALL existing cards to neutral styling when turning types off.
        normalizeExistingToNeutralWhenDisabled: false,
    };

    function hasLocalSave() {
        try { return !!localStorage.getItem("qsort_last"); }
        catch { return false; }
    }

    function updateLocalUI() {
        const status = $("localStatus");
        const clearBtn = $("btnClearLocal");
        const navLoadBtn = $("navLoadLocal");

        const hasSave = hasLocalSave();

        if (status) {
            status.textContent = hasSave
                ? "Local save available"
                : "No local save";
        }

        if (clearBtn) {
            clearBtn.disabled = !hasSave;
            clearBtn.textContent = hasSave ? "Clear local" : "Clear local (none)";
        }

        if (navLoadBtn) {
            navLoadBtn.disabled = !hasSave;
        }
    }

    const DEFAULT_LABELS = {
        left: "Negative",
        centre: "Neutral",
        right: "Positive",
    };

    const DEFAULT_LAYOUT_ID = "pyramid-7";

    const GRID_LAYOUTS = {
        "pyramid-7": {
            name: "Standard (7)",
            columns: 7,
            rows: [
                [1, 2, 3, 4, 5, 6, 7],
                [1, 2, 3, 4, 5, 6, 7],
                [0, 2, 3, 4, 5, 6, 0],
                [0, 0, 3, 4, 5, 0, 0],
                [0, 0, 0, 4, 0, 0, 0],
            ]
        },

        "flat-7": {
            name: "Flat (7×3)",
            columns: 7,
            rows: [
                [1, 2, 3, 4, 5, 6, 7],
                [1, 2, 3, 4, 5, 6, 7],
                [1, 2, 3, 4, 5, 6, 7],
            ]
        },

        "pyramid-5": {
            name: "Compact (5)",
            columns: 5,
            rows: [
                [1, 2, 3, 4, 5],
                [1, 2, 3, 4, 5],
                [0, 2, 3, 4, 0],
                [0, 0, 3, 0, 0],
            ]
        },

        "invert-pyramid-5": {
            name: "Inverted Compact (5)",
            columns: 5,
            rows: [
                [0, 0, 3, 0, 0],
                [0, 2, 3, 4, 0],
                [1, 2, 3, 4, 5],
                [1, 2, 3, 4, 5],
            ]
        }
    };

    let presetCache = [];
    let selectedPreset = null;


    function renderGrid(layoutId) {
        const layout = GRID_LAYOUTS[layoutId] || GRID_LAYOUTS[DEFAULT_LAYOUT_ID];
        state.layoutId = (layoutId in GRID_LAYOUTS) ? layoutId : DEFAULT_LAYOUT_ID;

        const root = $("q-sort-grid");
        if (!root) return;

        // wipe old grid content
        root.innerHTML = "";

        // --- Header / title ---
        const h = document.createElement("h3");
        h.id = "grid-subject-header";
        h.textContent = state.title.trim() || "Q-Sort Grid";
        root.appendChild(h);

        // --- Top value row (top-cells) ---
        // We need a value scale. For now we’ll map based on number of columns.
        // 7 columns => -3..3, 5 columns => -2..2
        const values = [];
        const half = Math.floor(layout.columns / 2);
        for (let i = -half; i <= half; i++) values.push(String(i));

        const topRow = document.createElement("div");
        topRow.className = "grid-row top-grid";

        values.forEach((val, idx) => {
            const col = idx + 1;

            const cell = document.createElement("div");
            cell.className = "grid-cell drop-zone top-cell";
            cell.dataset.column = String(col);
            cell.dataset.value = val;

            const labels = normaliseLabels(state.labels);

            if (col === 1) cell.innerHTML = `${escapeHtml(labels.left)}<br>${escapeHtml(val)}`;
            else if (col === half + 1) {
                // Centre cell: show label if provided, otherwise just the numeric value
                const centreLabel = (labels.centre || "").trim();
                if (centreLabel) cell.innerHTML = `${escapeHtml(centreLabel)}<br>${escapeHtml(val)}`;
                else cell.textContent = val;
            }
            else if (col === layout.columns) cell.innerHTML = `${escapeHtml(labels.right)}<br>${escapeHtml(val)}`;
            else cell.textContent = val;

            topRow.appendChild(cell);
        });

        root.appendChild(topRow);

        // --- Body rows ---
        layout.rows.forEach((row, rIdx) => {
            const rowEl = document.createElement("div");
            rowEl.className = "grid-row";

            row.forEach((col) => {
                if (!col) {
                    const blank = document.createElement("div");
                    blank.className = "grid-cell blank";
                    rowEl.appendChild(blank);
                    return;
                }

                const cell = document.createElement("div");
                cell.className = "grid-cell drop-zone";
                cell.dataset.column = String(col);
                cell.id = `row${rIdx + 1}-${col}`; // stable IDs for save/load
                rowEl.appendChild(cell);
            });

            root.appendChild(rowEl);
        });

        // wire drops for the newly created cells
        root.querySelectorAll(".drop-zone").forEach(wireGridCellDrop);
    }

    // ---------------------------------------------------------------------------
    // App State
    // ---------------------------------------------------------------------------
    const state = {
        version: 2,
        app: "q-sort-annotated",
        title: "",
        layoutId: DEFAULT_LAYOUT_ID,
        labels: { ...DEFAULT_LABELS },
        nextThoughtId: 1
    };

    const APP_INFO = {
        name: "Q-Sort Annotated",
        version: "2.0.0",
    };
    // ---------------------------------------------------------------------------
    // Desktop-only blocker (optional)
    // Add a <div id="mobileBlock"> overlay in HTML if you want this to show.
    // ---------------------------------------------------------------------------
    function enforceDesktop() {
        const block = $("mobileBlock");
        if (!block) return;

        const isSmall = window.matchMedia("(max-width: 900px)").matches;
        const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

        const shouldBlock = isSmall && isCoarsePointer;

        block.hidden = !shouldBlock;
        block.style.display = shouldBlock ? "grid" : "none"; // <- key line
        document.body.style.overflow = shouldBlock ? "hidden" : "";
    }

    function getColumnValueMap() {
        const map = {};
        document.querySelectorAll(".top-cell[data-column][data-value]").forEach((cell) => {
            map[String(cell.dataset.column)] = String(cell.dataset.value);
        });
        return map;
    }

    // ---------------------------------------------------------------------------
    // Title handling
    // ---------------------------------------------------------------------------
    function setTitle(title) {
        state.title = title || "";
        const header = $("grid-subject-header");
        if (header) header.textContent = state.title.trim() || "Q-Sort Grid";

        // Optional navbar title span
        const navTitle = $("navTitle");
        if (navTitle) navTitle.textContent = state.title ? `— ${state.title}` : "";
    }

    function promptForTitle() {
        const modal = document.getElementById("title-modal");
        const input = document.getElementById("title-input");
        const okBtn = document.getElementById("title-ok");
        if (!modal || !input || !okBtn) return;

        const labels = normaliseLabels(DEFAULT_LABELS);
        const leftEl = document.getElementById("label-left");
        const centreEl = document.getElementById("label-centre");
        const rightEl = document.getElementById("label-right");
        let selectedLayout = state.layoutId || DEFAULT_LAYOUT_ID;

        if (leftEl) leftEl.value = labels.left;
        if (centreEl) centreEl.value = labels.centre;
        if (rightEl) rightEl.value = labels.right;


        function setSelected(id) {
            selectedLayout = id;

            // re-render so aria-pressed updates cleanly
            renderLayoutPicker({
                selectedId: selectedLayout,
                onSelect: setSelected
            });
        }

        setSelected(selectedLayout);

        function submitTitle() {
            const title = input.value.trim();
            if (!title) return;

            setLabels({
                left: leftEl?.value ?? "",
                centre: centreEl?.value ?? "",
                right: rightEl?.value ?? "",
            });


            modal.classList.add("hidden");
            setTitle(title);

            state.layoutId = selectedLayout;
            clearAllThoughts();
            renderGrid(selectedLayout);
        }

        modal.classList.remove("hidden");
        input.value = "";
        input.focus();

        // Click submission
        okBtn.onclick = submitTitle;

        // Enter key submission
        input.onkeydown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                submitTitle();
            }
        };
    }

    function normaliseLabels(labels) {
        const L = labels && typeof labels === "object" ? labels : {};
        return {
            left: String(L.left ?? "Negative").trim() || "Negative",
            centre: String(L.centre ?? "Neutral").trim() || "Neutral",
            right: String(L.right ?? "Positive").trim() || "Positive",
        };
    }

    function setLabels(labels) {
        state.labels = normaliseLabels(labels);
        applyTopCellLabels(); // updates UI without rebuilding grid
    }

    function applyTopCellLabels() {
        const labels = normaliseLabels(state.labels);

        const topCells = document.querySelectorAll(".top-cell[data-column][data-value]");
        if (!topCells.length) return;

        // identify left / centre / right by column number
        const cols = Array.from(topCells).map(c => parseInt(c.dataset.column, 10)).filter(Number.isFinite);
        const maxCol = Math.max(...cols);
        const minCol = Math.min(...cols);
        const centreCol = Math.floor((maxCol + minCol) / 2);

        topCells.forEach((cell) => {
            const col = parseInt(cell.dataset.column, 10);
            const val = cell.dataset.value;

            if (col === minCol) cell.innerHTML = `${escapeHtml(labels.left)}<br>${escapeHtml(val)}`;
            else if (col === centreCol) {
                const centreLabel = (labels.centre || "").trim();
                if (centreLabel) cell.innerHTML = `${escapeHtml(centreLabel)}<br>${escapeHtml(val)}`;
                else cell.textContent = val;
            }
            else if (col === maxCol) cell.innerHTML = `${escapeHtml(labels.right)}<br>${escapeHtml(val)}`;
            else cell.textContent = val;
        });
    }

    function openLabelsModal() {
        const modal = $("labels-modal");
        const left = $("edit-label-left");
        const centre = $("edit-label-centre");
        const right = $("edit-label-right");
        if (!modal || !left || !centre || !right) return;

        const labels = normaliseLabels(state.labels);
        left.value = labels.left;
        centre.value = labels.centre;
        right.value = labels.right;

        modal.classList.remove("hidden");
        left.focus();
        left.select();
    }

    function closeLabelsModal() {
        const modal = $("labels-modal");
        if (!modal) return;
        modal.classList.add("hidden");
    }

    function wireLabelsModal() {
        const modal = $("labels-modal");
        const btnSave = $("labels-save");
        const btnCancel = $("labels-cancel");
        const left = $("edit-label-left");
        const centre = $("edit-label-centre");
        const right = $("edit-label-right");

        if (!modal || !btnSave || !btnCancel || !left || !centre || !right) return;

        on(btnCancel, "click", (e) => {
            e.preventDefault();
            closeLabelsModal();
        });

        on(btnSave, "click", (e) => {
            e.preventDefault();
            setLabels({
                left: left.value,
                centre: centre.value,
                right: right.value,
            });
            closeLabelsModal();
        });

        // click outside closes
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeLabelsModal();
        });

        // ESC closes
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !modal.classList.contains("hidden")) {
                closeLabelsModal();
            }
        });
    }


    function renderLayoutPicker({ selectedId, onSelect }) {
        const grid = document.getElementById("layoutGrid");
        if (!grid) return;

        grid.innerHTML = "";

        const entries = Object.entries(GRID_LAYOUTS);

        entries.forEach(([id, layout]) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "layout-option";
            btn.dataset.layout = id;
            btn.setAttribute("aria-pressed", id === selectedId ? "true" : "false");

            const name = document.createElement("div");
            name.className = "layout-name";
            name.textContent = layout.name;

            const thumb = buildLayoutThumb(layout);

            btn.appendChild(name);
            btn.appendChild(thumb);

            btn.addEventListener("click", (e) => {
                e.preventDefault();
                onSelect(id);
            });

            grid.appendChild(btn);
        });
    }

    function buildLayoutThumb(layout) {
        const wrap = document.createElement("div");
        wrap.className = "layout-thumb";

        // create 5 “thumbnail rows” max (keeps cards consistent)
        const rows = layout.rows.slice(0, 5);
        rows.forEach((row) => {
            const r = document.createElement("div");
            r.className = "trow";
            r.style.gridTemplateColumns = `repeat(${layout.columns}, 1fr)`;

            row.forEach((cell) => {
                const c = document.createElement("div");
                c.className = cell ? "tcell" : "tblank";
                r.appendChild(c);
            });

            wrap.appendChild(r);
        });

        return wrap;
    }

    // ---------------------------------------------------------------------------
    // Thought element creation
    // ---------------------------------------------------------------------------
    function createCloseButton(thoughtElement) {
        const closeButton = document.createElement("span");
        closeButton.classList.add("close-btn");
        closeButton.innerHTML = "↩"; // nicer “return” icon than X
        closeButton.title = "Return to tray";

        closeButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const tray = $("neutral-thoughts-list");
            if (!tray) {
                // fallback: if tray missing, just remove
                thoughtElement.remove();
                return;
            }

            // If it's already in tray, treat as delete (optional)
            const inTray = thoughtElement.parentElement && thoughtElement.parentElement.id === "neutral-thoughts-list";
            if (inTray) {
                thoughtElement.remove();
                return;
            }

            // ✅ Move back to tray
            tray.appendChild(thoughtElement);
        });

        return closeButton;
    }


    function dragStart(e) {
        isDragging = true;

        const item = e.currentTarget; // IMPORTANT: the element we attached listener to
        const thoughtContent = item.querySelector(".thought-content");
        const text = thoughtContent ? thoughtContent.textContent : "";

        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("data-title", item.dataset.title || "");
        e.dataTransfer.setData("data-notes", item.dataset.notes || "");
        e.dataTransfer.setData("data-class", item.className);
        e.dataTransfer.setData("source-id", item.id);
        e.dataTransfer.setData(
            "previous-parent-id",
            item.parentElement ? item.parentElement.id : ""
        );
    }

    function buildThoughtElement({ id, title, notes, className }) {
        const el = document.createElement("div");
        el.className = className || "thought-item";
        el.id = id;
        el.draggable = true;

        el.dataset.title = title || "";
        el.dataset.notes = notes || "";

        if (notes && notes.trim()) {
            el.classList.add("has-notes");
        }

        el.appendChild(createCloseButton(el));

        const content = document.createElement("div");
        content.classList.add("thought-content");
        content.textContent = title || "";
        el.appendChild(content);

        el.addEventListener("dragstart", dragStart);

        el.addEventListener("dragend", () => {
            // tiny timeout avoids “drop triggers click” weirdness in some browsers
            setTimeout(() => { isDragging = false; }, 0);
        });

        el.addEventListener("click", (e) => {
            // Don't open notes if this click was part of a drag or on the close button
            if (isDragging) return;
            if (e.target && e.target.classList && e.target.classList.contains("close-btn")) return;

            openNotesModal(el);
        });

        return el;
    }


    function ensureThoughtId(id) {
        // Expecting ids like "thought-12"
        const m = String(id || "").match(/^thought-(\d+)$/);
        if (!m) return;
        const n = parseInt(m[1], 10);
        if (Number.isFinite(n)) state.nextThoughtId = Math.max(state.nextThoughtId, n + 1);
    }

    function removeOriginalIfExists(sourceId) {
        if (!sourceId) return;
        const original = $(sourceId);
        if (original) original.remove();
    }

    // ---------------------------------------------------------------------------
    // Grid helpers
    // ---------------------------------------------------------------------------
    function findNearestEmptyBox(column) {
        const cells = document.querySelectorAll(`.drop-zone[data-column="${column}"]`);
        for (const cell of cells) {
            // skip top-cells as targets; we only want actual empty drop zones
            if (cell.classList.contains("top-cell")) continue;
            if (!cell.hasChildNodes()) return cell;
        }
        return null;
    }

    // ---------------------------------------------------------------------------
    // Drop wiring
    // ---------------------------------------------------------------------------
    function wireContainerDrop(containerEl) {
        if (!containerEl) return;

        containerEl.addEventListener("dragover", (e) => e.preventDefault());

        containerEl.addEventListener("drop", (e) => {
            e.preventDefault();

            const title = e.dataTransfer.getData("data-title") || "";
            const notes = e.dataTransfer.getData("data-notes") || "";
            const className = e.dataTransfer.getData("data-class") || "thought-item";
            const sourceId = e.dataTransfer.getData("source-id");

            removeOriginalIfExists(sourceId);

            const newItem = buildThoughtElement({
                id: sourceId,
                title,
                notes,
                className,
            });

            // ✅ Append to the container that received the drop (tray)
            containerEl.appendChild(newItem);
        });
    }


    function wireGridCellDrop(cellEl) {
        if (!cellEl) return;

        cellEl.addEventListener("dragover", (e) => e.preventDefault());

        cellEl.addEventListener("drop", (e) => {
            e.preventDefault();

            const cell = e.currentTarget;
            const title = e.dataTransfer.getData("data-title") || "";
            const notes = e.dataTransfer.getData("data-notes") || "";
            const className = e.dataTransfer.getData("data-class");
            const sourceId = e.dataTransfer.getData("source-id");

            removeOriginalIfExists(sourceId);

            // Top-cell behaviour: drop into nearest empty in that column
            if (cell.classList.contains("top-cell")) {
                const column = cell.getAttribute("data-column");
                const nearest = findNearestEmptyBox(column);
                if (!nearest) return;

                const newItem = buildThoughtElement({ id: sourceId, title, notes, className });
                nearest.appendChild(newItem);
                return;
            }

            // Normal cell: only allow if empty
            if (cell.hasChildNodes()) return;

            const newItem = buildThoughtElement({ id: sourceId, title, notes, className });
            cell.appendChild(newItem);
        });
    }

    function wireBinDrop(binEl) {
        if (!binEl) return;

        binEl.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        binEl.addEventListener("dragenter", () => {
            binEl.classList.add("is-over");
        });

        binEl.addEventListener("dragleave", () => {
            binEl.classList.remove("is-over");
        });

        binEl.addEventListener("drop", (e) => {
            e.preventDefault();
            binEl.classList.remove("is-over");

            const sourceId = e.dataTransfer.getData("source-id");
            if (!sourceId) return;

            // remove the dragged thought from wherever it currently is
            removeOriginalIfExists(sourceId);
        });
    }

    // ---------------------------------------------------------------------------
    // Thought modal (Add / Edit)
    // ---------------------------------------------------------------------------
    let modalMode = "add";      // "add" | "edit"
    let editingId = null;

    function openThoughtModal({ mode = "add", thoughtEl = null } = {}) {
        const modal = $("thought-modal");
        const titleInput = $("modal-thought-title");
        const notesInput = $("modal-thought-notes");
        const countEl = $("title-count");

        const heading = modal.querySelector("h3");
        if (heading) {
            heading.textContent = mode === "edit"
                ? "Edit thought"
                : "Add thought";
        }


        if (!modal || !titleInput || !notesInput) return;

        modalMode = mode;
        editingId = thoughtEl ? thoughtEl.id : null;

        // Prefill: edit uses existing dataset; add can use quick input as a starter
        const quickTitle = $("thought-text")?.value || "";
        const title = thoughtEl ? (thoughtEl.dataset.title || "") : quickTitle;
        const notes = thoughtEl ? (thoughtEl.dataset.notes || "") : "";

        titleInput.value = title;
        notesInput.value = notes;

        // Counter
        if (countEl) {
            countEl.textContent = `${titleInput.value.length} / ${titleInput.maxLength || 80}`;
        }

        modal.classList.remove("hidden");
        titleInput.focus();
        titleInput.select();
    }

    function closeThoughtModal() {
        const modal = $("thought-modal");
        if (!modal) return;
        modal.classList.add("hidden");
        editingId = null;
        modalMode = "add";
    }

    function wireThoughtModal() {
        const titleInput = $("modal-thought-title");
        const notesInput = $("modal-thought-notes");
        const saveBtn = $("modal-save");
        const cancelBtn = $("modal-cancel");
        const countEl = $("title-count");
        const modal = $("thought-modal");

        if (!modal) return;

        // Live char count for title
        if (titleInput && countEl) {
            const updateCount = () => {
                countEl.textContent = `${titleInput.value.length} / ${titleInput.maxLength || 80}`;
            };
            titleInput.addEventListener("input", updateCount);
            updateCount();
        }

        // Cancel
        on(cancelBtn, "click", (e) => {
            e.preventDefault();
            closeThoughtModal();
        });

        // Click outside modal-box closes (optional, feels nice)
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeThoughtModal();
        });

        // ESC closes
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !modal.classList.contains("hidden")) {
                closeThoughtModal();
            }
        });

        // Save (add or edit)
        on(saveBtn, "click", (e) => {
            e.preventDefault();

            const title = (titleInput?.value || "").trim();
            const notes = (notesInput?.value || "").trim();

            if (!title) return; // require a title

            if (modalMode === "edit" && editingId) {
                const el = $(editingId);
                if (el) {
                    el.dataset.title = title;
                    el.dataset.notes = notes;
                    const content = el.querySelector(".thought-content");
                    if (content) content.textContent = title;
                }

                if (notes.trim()) el.classList.add("has-notes");
                else el.classList.remove("has-notes");
                closeThoughtModal();
                return;
            }

            // Add mode
            const thoughtValue = getNewThoughtType();
            const id = `thought-${state.nextThoughtId++}`;
            const className = `thought-item ${thoughtValue}`;

            const thoughtEl = buildThoughtElement({ id, title, notes, className });
            $("neutral-thoughts-list")?.appendChild(thoughtEl);

            // Clear quick input after adding (optional)
            const quick = $("thought-text");
            if (quick) quick.value = "";

            closeThoughtModal();
        });
    }

    function wireTopRightMenu() {
        const btn = $("navMenuBtn");
        const menu = $("navMenu");

        if (!btn || !menu) return;

        const openMenu = () => {
            menu.classList.remove("hidden");
            btn.setAttribute("aria-expanded", "true");
        };

        const closeMenu = () => {
            menu.classList.add("hidden");
            btn.setAttribute("aria-expanded", "false");
        };

        on($("menuLabels"), "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            openLabelsModal();
        });



        const toggleMenu = () => {
            const isOpen = !menu.classList.contains("hidden");
            if (isOpen) closeMenu();
            else openMenu();
        };

        // Button toggles menu
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });

        // Click outside closes
        document.addEventListener("click", (e) => {
            if (!menu.classList.contains("hidden")) closeMenu();
        });

        // ESC closes
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeMenu();
        });

        // Menu actions trigger existing wired buttons
        const clickId = (fromId, targetId) => {
            const from = $(fromId);
            const target = $(targetId);
            if (!from || !target) return;
            from.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeMenu();
                target.click();
            });
        };

        clickId("menuSaveLocal", "btnSaveLocal");
        clickId("menuSaveJson", "btnExportJson");
        clickId("menuPrint", "btnPrintGrid");
        clickId("menuClearLocal", "btnClearLocal");

        // Also close menu when choosing Load Local (already wired in wireNav via #navLoadLocal)
        const loadLocalBtn = $("navLoadLocal");
        if (loadLocalBtn) {
            loadLocalBtn.addEventListener("click", () => closeMenu());
        }

        // Close after choosing a file for Load (JSON)
        const loadFile = $("navLoadFile");
        if (loadFile) {
            loadFile.addEventListener("change", () => closeMenu());
        }
    }


    // ---------------------------------------------------------------------------
    // Notes viewer modal (read-only) + jump-to-edit
    // ---------------------------------------------------------------------------
    let viewingThoughtId = null;
    let isDragging = false;

    function openNotesModal(thoughtEl) {
        const modal = $("notes-modal");
        const titleEl = $("notes-modal-title");
        const bodyEl = $("notes-modal-body");
        if (!modal || !titleEl || !bodyEl || !thoughtEl) return;

        viewingThoughtId = thoughtEl.id;

        const title = thoughtEl.dataset.title || "(untitled)";
        const notes = (thoughtEl.dataset.notes || "").trim();

        titleEl.textContent = title;
        bodyEl.textContent = notes ? notes : "No notes added.";

        modal.classList.remove("hidden");
    }

    function closeNotesModal() {
        const modal = $("notes-modal");
        if (!modal) return;
        modal.classList.add("hidden");
        viewingThoughtId = null;
    }

    function wireNotesModal() {
        const modal = $("notes-modal");
        const btnClose = $("notes-close");
        const btnEdit = $("notes-edit");

        if (!modal) return;

        on(btnClose, "click", (e) => {
            e.preventDefault();
            closeNotesModal();
        });

        // Clicking outside closes
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeNotesModal();
        });

        // ESC closes
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !modal.classList.contains("hidden")) {
                closeNotesModal();
            }
        });

        // Edit → opens existing Add/Edit modal in edit mode
        on(btnEdit, "click", (e) => {
            e.preventDefault();
            if (!viewingThoughtId) return;

            const el = $(viewingThoughtId);
            if (!el) return;

            closeNotesModal();
            openThoughtModal({ mode: "edit", thoughtEl: el });
        });
    }


    // ---------------------------------------------------------------------------
    // Core UI actions
    // ---------------------------------------------------------------------------
    // function addThoughtFromInput() {
    //     const thoughtText = $("thought-text")?.value ?? "";
    //     if (!thoughtText.trim()) return;

    //     const thoughtValue = getNewThoughtType(); // <-- NEW

    //     const id = `thought-${state.nextThoughtId++}`;
    //     const className = `thought-item ${thoughtValue}`;

    //     const thoughtEl = buildThoughtElement({
    //         id,
    //         text: thoughtText.trim(),
    //         className,
    //     });

    //     // Always add to the "Unsorted" tray
    //     $("neutral-thoughts-list")?.appendChild(thoughtEl);

    //     $("thought-text").value = "";
    //     $("thought-text")?.focus();
    // }

    function setSubjectFromInput() {
        const subjectText = $("subject-text")?.value ?? "";
        if (!subjectText.trim()) {
            alert("Please enter a subject.");
            return;
        }
        setTitle(subjectText.trim());
        $("subject-text").value = "";
    }

    function applyThoughtTypeUI() {
        const toggle = $("toggleThoughtTypes");
        const radioGroup = document.querySelector(".radio-group");
        const enabled = !!toggle?.checked;

        // Show/hide the 3-type options
        if (radioGroup) radioGroup.hidden = !enabled;

        // When enabling, default selection becomes neutral
        if (enabled) {
            const neutralRadio = document.querySelector('input[name="thought-value"][value="neutral"]');
            if (neutralRadio) neutralRadio.checked = true;
        }

        // Optional: normalize existing cards to neutral when turning OFF
        if (!enabled && CONFIG.normalizeExistingToNeutralWhenDisabled) {
            document.querySelectorAll(".thought-item").forEach((item) => {
                item.classList.remove("negative", "positive");
                item.classList.add("neutral");
            });
        }
    }

    function getNewThoughtType() {
        const toggle = $("toggleThoughtTypes");
        const enabled = !!toggle?.checked;

        // If types are OFF, everything is neutral
        if (!enabled) return "neutral";

        // If types are ON, read radio selection, defaulting to neutral
        const checked = document.querySelector('input[name="thought-value"]:checked');
        return checked?.value || "neutral";
    }

    // ---------------------------------------------------------------------------
    // Export PNG (html2canvas)
    // ---------------------------------------------------------------------------
    async function exportGridPNG() {
        const grid = $("q-sort-grid");
        if (!grid) {
            alert("Could not find the grid to export.");
            return;
        }
        if (!window.html2canvas) {
            alert("Export failed: html2canvas is not loaded.");
            return;
        }

        try {
            const canvas = await window.html2canvas(grid, {
                backgroundColor: "#ffffff",
                scale: 2,
                useCORS: true,
            });

            const link = document.createElement("a");
            const safeTitle = (state.title || "q-sort")
                .trim()
                .replace(/\s+/g, "_")
                .replace(/[^\w\-]/g, "");

            link.download = `${safeTitle || "q-sort"}_grid.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (err) {
            console.error(err);
            alert("Sorry — export failed. Check the console for details.");
        }
    }

    // ---------------------------------------------------------------------------
    // Save / Load JSON
    // ---------------------------------------------------------------------------
    function serializeToData() {
        const data = {
            version: state.version,
            title: state.title || "",
            layoutId: state.layoutId || DEFAULT_LAYOUT_ID,
            labels: normaliseLabels(state.labels),
            banks: { positive: [], neutral: [], negative: [] },
            grid: [],
            meta: { savedAt: new Date().toISOString() },
        };


        // Banks
        const bankMap = {
            positive: $("positive-thoughts-list"),
            neutral: $("neutral-thoughts-list"),
            negative: $("negative-thoughts-list"),
        };

        for (const [key, container] of Object.entries(bankMap)) {
            if (!container) continue;

            const items = container.querySelectorAll(".thought-item");
            items.forEach((item) => {
                const content = item.querySelector(".thought-content");
                data.banks[key].push({
                    id: item.id,
                    title: item.dataset.title,
                    notes: item.dataset.notes,
                    className: item.className,
                });
            });
        }

        // Grid: only the cells with IDs (your grid uses rowX-Y ids)
        const gridCells = document.querySelectorAll(".drop-zone[id]");
        gridCells.forEach((cell) => {
            const item = cell.querySelector(".thought-item");
            if (!item) return;

            const content = item.querySelector(".thought-content");
            data.grid.push({
                cellId: cell.id,
                thought: {
                    id: item.id,
                    title: item.dataset.title,
                    notes: item.dataset.notes,
                    className: item.className,
                },
            });
        });

        return data;
    }

    function downloadJSON(data) {
        const blob = new Blob(
            [JSON.stringify(data, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);

        const safeTitle = (data.title || state.title || "q-sort")
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^\w\-]/g, "");

        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeTitle}_qsort.json`;
        a.click();

        URL.revokeObjectURL(url);
    }


    function clearAllThoughts() {
        // Clear banks
        ["positive-thoughts-list", "neutral-thoughts-list", "negative-thoughts-list"].forEach((id) => {
            const el = $(id);
            if (!el) return;

            // Keep headings (h4) if present
            [...el.children].forEach((child) => {
                if (child.tagName && child.tagName.toLowerCase() === "h4") return;
                child.remove();
            });
        });

        // Clear grid cells with ids
        document.querySelectorAll(".drop-zone[id]").forEach((cell) => {
            cell.innerHTML = "";
        });
    }

    function loadFromData(data) {
        if (!data || typeof data !== "object") throw new Error("Invalid data");
        if (data.version !== 2) throw new Error("Unsupported save version");

        const layoutId = data.layoutId || DEFAULT_LAYOUT_ID;

        clearAllThoughts();      // clears existing thoughts
        renderGrid(layoutId);    // rebuilds grid
        setTitle(String(data.title || ""));
        state.layoutId = layoutId;
        setLabels(data.labels);


        // Load banks
        const bankMap = {
            positive: $("positive-thoughts-list"),
            neutral: $("neutral-thoughts-list"),
            negative: $("negative-thoughts-list"),
        };

        for (const [key, list] of Object.entries(data.banks || {})) {
            const container = bankMap[key];
            if (!container || !Array.isArray(list)) continue;

            list.forEach((t) => {
                if (!t || !t.id) return;
                ensureThoughtId(t.id);

                const el = buildThoughtElement({
                    id: t.id,
                    title: t.title || t.text || "",
                    notes: t.notes || "",
                    className: t.className || "thought-item",
                });
                container.appendChild(el);
            });
        }

        // Load grid placements
        (data.grid || []).forEach((g) => {
            if (!g || !g.cellId || !g.thought) return;
            const cell = $(g.cellId);
            if (!cell) return;

            ensureThoughtId(g.thought.id);

            // Only place if empty to avoid collisions
            if (cell.hasChildNodes()) return;

            const el = buildThoughtElement({
                id: g.thought.id,
                title: g.thought.title || g.thought.text || "",
                notes: g.thought.notes || "",
                className: g.thought.className || "thought-item",
            });
            cell.appendChild(el);
        });
    }

    // ---------------------------------------------------------------------------
    // Navbar wiring (optional: only runs if elements exist)
    // ---------------------------------------------------------------------------
    function wireNav() {
        on($("navNew"), "click", () => {
            clearAllThoughts();
            setTitle("");
            setLabels(DEFAULT_LABELS);
            promptForTitle();
        });

        // Nav Load (file input)
        on($("navLoadFile"), "change", async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                loadFromData(data);
            } catch (err) {
                console.error(err);
                alert("Could not load that file (invalid or unsupported).");
            } finally {
                e.target.value = "";
            }
        });

        on($("navSave"), "click", () => {
            try {
                const data = serializeToData();
                downloadJSON(data);
            } catch (err) {
                console.error(err);
                alert("Save failed.");
            }
        });

        on($("navExport"), "click", exportGridPNG);

        on($("navHelp"), "click", () => {
            alert(
                [
                    "How to use Q-sort:",
                    "1) Set a title/topic.",
                    "2) Add thoughts (positive/neutral/negative).",
                    "3) Drag thoughts into the grid to rank them.",
                    "4) Save as JSON to continue later, or export as PNG.",
                ].join("\n")
            );
        });

        on($("navLoadLocal"), "click", () => {
            if (!hasLocalSave()) {
                updateLocalUI();
                return;
            }

            try {
                const raw = localStorage.getItem("qsort_last");
                if (!raw) return;

                const data = JSON.parse(raw);
                loadFromData(data);
                alert("Loaded local Q-sort.");
            } catch (err) {
                console.error(err);
                alert("Could not load local data.");
            }
        });

    }

    function getThoughtValueLabel(thoughtEl) {
        const cell = thoughtEl.closest(".drop-zone");
        if (!cell) return "Unsorted";

        // If it's not a grid cell (tray), treat as unsorted
        if (!cell.id) return "Unsorted";

        const col = cell.dataset.column;
        if (!col) return "Unsorted";

        const colMap = getColumnValueMap();
        return colMap[col] ?? "Unsorted";
    }



    function collectThoughtsForPrint() {
        const all = Array.from(document.querySelectorAll(".thought-item"));

        const items = all.map((el) => {
            const title = (el.dataset.title || "").trim() || "(untitled)";
            const notes = (el.dataset.notes || "").trim();
            const value = getThoughtValueLabel(el);

            return {
                id: el.id,
                title,
                notes,
                hasNotes: !!notes,
                value,
            };
        });

        // Sort by grid value, unsorted last, then title
        const order = { "-3": 1, "-2": 2, "-1": 3, "0": 4, "1": 5, "2": 6, "3": 7, "Unsorted": 99 };
        items.sort((a, b) =>
            (order[a.value] - order[b.value]) ||
            a.title.localeCompare(b.title)
        );

        return items;
    }


    function buildPrintNotesSection() {
        const section = $("print-notes");
        const body = $("print-notes-body");
        if (!section || !body) return;

        const items = collectThoughtsForPrint();
        if (!items.length) {
            section.hidden = true;
            body.innerHTML = "";
            return;
        }

        // Group by position
        const groups = {};
        items.forEach((t) => {
            const key = t.value ?? "Unsorted";
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });

        // Order groups numerically, unsorted last
        const orderedKeys = Object.keys(groups).sort((a, b) => {
            if (a === "Unsorted") return 1;
            if (b === "Unsorted") return -1;
            return Number(a) - Number(b);
        });

        body.innerHTML = orderedKeys.map((key) => `
    <div class="print-note-group">
      <h4 class="print-note-group-title">
        ${key === "Unsorted" ? "Unsorted thoughts" : `Position ${key}`}
      </h4>

      ${groups[key].map(t => `
        <div class="print-note-item">
          <div class="print-note-title">${escapeHtml(t.title)}</div>
          ${t.hasNotes
                ? `<div class="print-note-text">${escapeHtml(t.notes)}</div>`
                : `<div class="print-note-empty"><em>No notes</em></div>`
            }
        </div>
      `).join("")}
    </div>
  `).join("");

        section.hidden = false;
    }



    function clearPrintNotesSection() {
        const section = $("print-notes");
        const body = $("print-notes-body");
        if (!section || !body) return;
        section.hidden = true;
        body.innerHTML = "";
    }

    // Simple HTML escaping to avoid notes breaking markup
    function escapeHtml(str) {
        return String(str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function wireBottomBar() {
        const saveBtn = $("btnSaveLocal");
        const exportBtn = $("btnExportJson");
        const printBtn = $("btnPrintGrid");
        const clearBtn = $("btnClearLocal");

        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                const data = serializeToData();
                localStorage.setItem("qsort_last", JSON.stringify(data));
                updateLocalUI();
                alert("Saved locally on this device/browser.");
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                const data = serializeToData();
                downloadJSON(data);
            });
        }

        let printCleanupTimer = null;

        function cleanupAfterPrint() {
            document.body.classList.remove("is-printing");
            clearPrintNotesSection();

            if (printCleanupTimer) {
                clearTimeout(printCleanupTimer);
                printCleanupTimer = null;
            }
        }

        if (printBtn) {
            printBtn.addEventListener("click", () => {
                buildPrintNotesSection();

                document.body.classList.add("is-printing");

                // Fallback: some browsers don't fire afterprint reliably
                printCleanupTimer = setTimeout(cleanupAfterPrint, 1500);

                window.addEventListener(
                    "afterprint",
                    () => cleanupAfterPrint(),
                    { once: true }
                );

                window.print();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                if (!hasLocalSave()) {
                    updateLocalUI();
                    return;
                }

                const ok = confirm(
                    "This will permanently remove the locally saved Q-sort from this browser.\n\nThis cannot be undone."
                );
                if (!ok) return;

                try {
                    localStorage.removeItem("qsort_last");
                    updateLocalUI();
                    alert("Local Q-sort data cleared.");
                } catch {
                    alert("Could not clear local data in this browser.");
                }
            });
        }

    }


    async function fetchPresetManifest() {
        const res = await fetch("presets/presets.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`Preset manifest failed: ${res.status}`);
        return res.json();
    }

    async function loadPresetFile(filename) {
        const res = await fetch(`presets/${filename}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Preset failed: ${res.status}`);
        return res.json();
    }

    function renderPresetList(items) {
        const list = $("presetsList");
        if (!list) return;

        list.innerHTML = "";

        if (!items.length) {
            list.innerHTML = `<div class="muted" style="padding:12px;">No presets found.</div>`;
            return;
        }

        items.forEach((p) => {
            const row = document.createElement("div");
            row.className = "preset-row";
            row.tabIndex = 0;
            row.setAttribute("role", "option");
            row.setAttribute("aria-selected", selectedPreset?.id === p.id ? "true" : "false");

            const badge = p.layoutId
                ? `<span class="preset-badge">${escapeHtml(p.layoutId)}</span>`
                : "";

            row.innerHTML = `
      <div class="preset-row-title">
        <span>${escapeHtml(p.title || "Untitled preset")}</span>
        ${badge}
      </div>
      <p class="preset-row-desc">${escapeHtml(p.description || "")}</p>
    `;

            const select = () => {
                selectedPreset = p;
                renderPresetList(items);
                renderPresetDetail(p);
            };

            row.addEventListener("click", select);
            row.addEventListener("keydown", (e) => {
                if (e.key === "Enter") select();
            });

            list.appendChild(row);
        });
    }

    function renderPresetDetail(p) {
        const panel = $("presetDetail");
        if (!panel) return;

        const metaBits = [];
        if (p.layoutId) metaBits.push(`<span class="preset-badge">Layout: ${escapeHtml(p.layoutId)}</span>`);
        if (p.file) metaBits.push(`<span class="preset-badge">File: ${escapeHtml(p.file)}</span>`);

        panel.innerHTML = `
    <h4 class="preset-detail-title">${escapeHtml(p.title || "Untitled preset")}</h4>
    <p class="preset-detail-desc">${escapeHtml(p.description || "")}</p>
    <div class="preset-detail-meta">${metaBits.join("")}</div>

    <div class="preset-actions">
      <button class="btn primary" type="button" id="presetPreviewLoad">Load preset</button>
    </div>
  `;

        const loadBtn = $("presetPreviewLoad");
        if (loadBtn) {
            loadBtn.addEventListener("click", async () => {
                try {
                    const presetData = await loadPresetFile(p.file);
                    loadFromData(presetData);
                    closePresetsModal();
                } catch (err) {
                    console.error(err);
                    alert("Could not load that preset.");
                }
            });
        }
    }


    function openPresetsModal() {
        const modal = $("presets-modal");
        const detail = $("presetDetail");
        const search = $("presetSearch");

        if (!modal) return;

        modal.classList.remove("hidden");

        // Loading state
        const list = $("presetsList");
        if (list) list.innerHTML = `<div class="muted" style="padding:12px;">Loading presets…</div>`;
        if (detail) detail.innerHTML = `<div class="muted">Loading…</div>`;
        if (search) search.value = "";

        fetchPresetManifest()
            .then((data) => {
                presetCache = (data?.presets || []);

                selectedPreset = null;

                renderPresetList(presetCache);
                if (detail) detail.innerHTML = `<div class="muted">Select a preset to see details.</div>`;

                if (search) {
                    search.oninput = () => {
                        const q = search.value.trim().toLowerCase();
                        const filtered = presetCache.filter(p =>
                            (p.title || "").toLowerCase().includes(q) ||
                            (p.description || "").toLowerCase().includes(q)
                        );
                        renderPresetList(filtered);

                        // If selection is filtered out, clear detail panel
                        if (selectedPreset && !filtered.some(x => x.id === selectedPreset.id)) {
                            selectedPreset = null;
                            if (detail) detail.innerHTML = `<div class="muted">Select a preset to see details.</div>`;
                        }
                    };
                }
            })
            .catch((err) => {
                console.error(err);
                if (list) list.innerHTML = `<div class="muted" style="padding:12px;">Failed to load preset list.</div>`;
                if (detail) detail.innerHTML = "";
            });
    }


    function closePresetsModal() {
        const modal = $("presets-modal");
        if (!modal) return;
        modal.classList.add("hidden");
    }


    // ---------------------------------------------------------------------------
    // Landing-page bridge (optional)
    // If index.html sets sessionStorage qsort_mode + qsort_payload
    // ---------------------------------------------------------------------------
    function handleLandingBridge() {
        const mode = sessionStorage.getItem("qsort_mode");
        const payload = sessionStorage.getItem("qsort_payload");

        sessionStorage.removeItem("qsort_mode");
        sessionStorage.removeItem("qsort_payload");

        if (mode === "new") {
            setLabels(DEFAULT_LABELS);
            promptForTitle();
        } else if (mode === "load" && payload) {
            try {
                const data = JSON.parse(payload);
                loadFromData(data);
            } catch (err) {
                console.error(err);
                alert("That saved file wasn't valid JSON.");
            }
        }
    }

    // ---------------------------------------------------------------------------
    // Initial wiring
    // ---------------------------------------------------------------------------
    function init() {
        // desktop blocker (optional)
        enforceDesktop();
        window.addEventListener("resize", enforceDesktop);

        renderGrid(state.layoutId || DEFAULT_LAYOUT_ID);

        on($("add-thought"), "click", () => openThoughtModal());
        on($("thought-text"), "keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                openThoughtModal();
            }
        });



        // Wire banks drop
        wireContainerDrop($("positive-thoughts-list"));
        wireContainerDrop($("neutral-thoughts-list"));
        wireContainerDrop($("negative-thoughts-list"));
        wireBinDrop($("binZone"));

        on($("menuPresets"), "click", (e) => {
            e.preventDefault();
            openPresetsModal();
        });

        on($("presetsClose"), "click", (e) => {
            e.preventDefault();
            closePresetsModal();
        });

        // click outside closes (optional, matches your other modals)
        const presetsModal = $("presets-modal");
        if (presetsModal) {
            presetsModal.addEventListener("click", (e) => {
                if (e.target === presetsModal) closePresetsModal();
            });
        }

        // Wire grid cell drops
        document.querySelectorAll(".drop-zone").forEach(wireGridCellDrop);

        // Download button (existing UI)
        on($("download"), "click", exportGridPNG);

        // Navbar (optional)
        wireNav();

        // Landing bridge (optional)
        handleLandingBridge();

        // If there are already thought items in HTML (unlikely), make sure they can drag
        document.querySelectorAll(".thought-item").forEach((item) => {
            if (!item.id) return;
            ensureThoughtId(item.id);
            item.addEventListener("dragstart", dragStart);
        });

        // Initialize title display from header, if already set in HTML
        const existingTitle = $("grid-subject-header")?.textContent ?? "";
        if (existingTitle && existingTitle.trim() && existingTitle.trim() !== "Q-Sort Grid") {
            setTitle(existingTitle.trim());
        }

        // Thought types toggle (optional UI)
        const toggle = $("toggleThoughtTypes");
        if (toggle) {
            toggle.checked = !!CONFIG.enableThoughtTypesByDefault;
            toggle.addEventListener("change", applyThoughtTypeUI);
            applyThoughtTypeUI(); // set initial state + hide/show radios
        }

        const versionEl = document.getElementById("appVersion");
        if (versionEl) {
            versionEl.textContent = `${APP_INFO.name} · v${APP_INFO.version}`;
        }
        wireTopRightMenu();
        wireBottomBar();
        updateLocalUI();
        wireThoughtModal();
        wireNotesModal();
        wireLabelsModal();

    }

    document.addEventListener("DOMContentLoaded", init);
})();
