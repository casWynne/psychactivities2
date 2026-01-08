/* q-sort.js
   Refactor goals:
   - Stable drag/drop (use e.currentTarget, not e.target)
   - Move items (no duplicates) across banks <-> grid
   - Top-cell auto-drop to nearest empty box in that column
   - Delete (close button) always works
   - Export PNG (Download button + optional nav export)
   - Save/Load JSON (optional nav + sessionStorage bridge from landing page)
   - Optional desktop-only enforcement if #mobileBlock exists
*/

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
    }

    // ---------------------------------------------------------------------------
    // App State
    // ---------------------------------------------------------------------------
    const state = {
        version: 1,
        title: "",
        nextThoughtId: 1, // will be bumped based on existing or loaded thoughts
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
        const title = window.prompt("Title / topic for this Q-sort?");
        if (title && title.trim()) setTitle(title.trim());
    }

    // ---------------------------------------------------------------------------
    // Thought element creation
    // ---------------------------------------------------------------------------
    function createCloseButton(thoughtElement) {
        const closeButton = document.createElement("span");
        closeButton.classList.add("close-btn");
        closeButton.innerHTML = "✖";
        closeButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            thoughtElement.remove();
        });
        return closeButton;
    }

    function dragStart(e) {
        const item = e.currentTarget; // IMPORTANT: the element we attached listener to
        const thoughtContent = item.querySelector(".thought-content");
        const text = thoughtContent ? thoughtContent.textContent : "";

        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", text);
        e.dataTransfer.setData("data-class", item.className);
        e.dataTransfer.setData("source-id", item.id);
        e.dataTransfer.setData(
            "previous-parent-id",
            item.parentElement ? item.parentElement.id : ""
        );
    }

    function buildThoughtElement({ id, text, className }) {
        const el = document.createElement("div");
        el.className = className || "thought-item";
        el.id = id;
        el.draggable = true;

        el.appendChild(createCloseButton(el));

        const content = document.createElement("div");
        content.classList.add("thought-content");
        content.textContent = text || "";
        el.appendChild(content);

        el.addEventListener("dragstart", dragStart);
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

            const targetContainer = e.currentTarget; // IMPORTANT
            const text = e.dataTransfer.getData("text/plain");
            const className = e.dataTransfer.getData("data-class");
            const sourceId = e.dataTransfer.getData("source-id");

            removeOriginalIfExists(sourceId);

            const newItem = buildThoughtElement({
                id: sourceId,
                text,
                className,
            });

            targetContainer.appendChild(newItem);
        });
    }

    function wireGridCellDrop(cellEl) {
        if (!cellEl) return;

        cellEl.addEventListener("dragover", (e) => e.preventDefault());

        cellEl.addEventListener("drop", (e) => {
            e.preventDefault();

            const cell = e.currentTarget; // IMPORTANT
            const text = e.dataTransfer.getData("text/plain");
            const className = e.dataTransfer.getData("data-class");
            const sourceId = e.dataTransfer.getData("source-id");

            removeOriginalIfExists(sourceId);

            // Top-cell behaviour: drop into nearest empty in that column
            if (cell.classList.contains("top-cell")) {
                const column = cell.getAttribute("data-column");
                const nearest = findNearestEmptyBox(column);
                if (!nearest) return;

                const newItem = buildThoughtElement({ id: sourceId, text, className });
                nearest.appendChild(newItem);
                return;
            }

            // Normal cell: only allow if empty
            if (cell.hasChildNodes()) return;

            const newItem = buildThoughtElement({ id: sourceId, text, className });
            cell.appendChild(newItem);
        });
    }

    // ---------------------------------------------------------------------------
    // Core UI actions
    // ---------------------------------------------------------------------------
    function addThoughtFromInput() {
        const thoughtText = $("thought-text")?.value ?? "";
        if (!thoughtText.trim()) return;

        const thoughtValue = getNewThoughtType(); // <-- NEW

        const id = `thought-${state.nextThoughtId++}`;
        const className = `thought-item ${thoughtValue}`;

        const thoughtEl = buildThoughtElement({
            id,
            text: thoughtText.trim(),
            className,
        });

        // Always add to the "Unsorted" tray
        $("neutral-thoughts-list")?.appendChild(thoughtEl);

        $("thought-text").value = "";
        $("thought-text")?.focus();
    }



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
            banks: { positive: [], neutral: [], negative: [] },
            grid: [],
            meta: {
                savedAt: new Date().toISOString(),
            },
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
                    text: content ? content.textContent : "",
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
                    text: content ? content.textContent : "",
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
        if (data.version !== 1) throw new Error("Unsupported save version");

        clearAllThoughts();
        setTitle(String(data.title || ""));

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
                    text: t.text || "",
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
                text: g.thought.text || "",
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

        if (printBtn) {
            printBtn.addEventListener("click", () => {
                document.body.classList.add("is-printing");
                window.print();
                // remove after printing (some browsers support afterprint reliably)
                window.addEventListener("afterprint", () => {
                    document.body.classList.remove("is-printing");
                }, { once: true });
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

        // Add thought button + Enter key
        on($("add-thought"), "click", addThoughtFromInput);
        on($("thought-text"), "keydown", (e) => {
            if (e.key === "Enter") addThoughtFromInput();
        });

        // Wire banks drop
        wireContainerDrop($("positive-thoughts-list"));
        wireContainerDrop($("neutral-thoughts-list"));
        wireContainerDrop($("negative-thoughts-list"));

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


        wireBottomBar();
        updateLocalUI();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
