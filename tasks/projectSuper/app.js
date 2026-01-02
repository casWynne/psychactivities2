// app.js
document.addEventListener("DOMContentLoaded", () => {

    // === CONFIG ====================================================
    const showFilters = true;   // <-- toggle this to show/hide the filter bar
    const showKeywordLegend = true;    // show/hide the big keyword section
    const enableKeywordChipFilter = false; // allow clicking chips to filter
    // ===============================================================

    const profilesList = document.getElementById("profilesList");
    const searchInput = document.getElementById("searchInput");
    const keywordSelect = document.getElementById("keywordSelect");
    const searchWrapper = document.querySelector(".search-wrapper");
    const keywordWrapper = document.querySelector(".keyword-wrapper");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const clearKeywordBtn = document.getElementById("clearKeywordBtn");
    const keywordList = document.getElementById("keywordList");   // <-- add this
    const viewStaffBtn = document.getElementById("viewStaffBtn");
    const viewProjectsBtn = document.getElementById("viewProjectsBtn");
    const printBtn = document.getElementById("printBtn");
    const savedToggleBtn = document.getElementById("savedToggleBtn");
    const savedCountEl = document.getElementById("savedCount");
    const savedWrapper = document.getElementById("savedWrapper");
    const clearSavedBtn = document.getElementById("clearSavedBtn");

    const interestFormUrl = "https://forms.office.com/e/UT6nby4S1n";
    const toolbar = document.querySelector(".toolbar");
    const keywordLegendSection = document.querySelector(".keywords"); // <-- add this


    // Search toolbar visibility
    if (!showFilters && toolbar) {
        toolbar.style.display = "none";
        searchInput.disabled = true;
        keywordSelect.disabled = true;
    }
    // Keyword legend visibility
    if (!showKeywordLegend && keywordLegendSection) {
        keywordLegendSection.style.display = "none";
    }


    let allProfiles = [];
    let currentView = "staff"; // "staff" | "projects"
    let allStaff = [];
    let allProjects = [];
    let currentDisplayed = [];
    let showSavedOnly = false;

    const SAVED_KEY = "projectSuperSavedTopics";
    let manualTopicIds = new Set(loadSavedTopicIds());

    const SAVED_STAFF_KEY = "projectSuperSavedStaff";
    let manualStaffIds = new Set(loadSavedStaffIds());

    const EXCLUDED_TOPIC_KEY = "projectSuperExcludedTopics";
    let excludedTopicIds = new Set(loadExcludedTopicIds());


    // computed each time we need them
    let effectiveTopicIds = new Set();
    let effectiveStaffIds = new Set();


    // ---- Fetch JSON data ----------------------------------------------------
    fetch("data/staff-projects.json")
        .then((res) => {
            if (!res.ok) {
                throw new Error("Failed to load staff-projects.json");
            }
            return res.json();
        })
        .then((data) => {
            allStaff = (data.staff || []).sort((a, b) =>
                a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
            );
            allProjects = buildProjectProfilesFromStaff(allStaff);
            recomputeEffectiveSaves();

            // Build keywords based on whichever view is active initially
            const active = getActiveList();
            const allKeywords = getAllUniqueKeywords(active);

            buildKeywordDropdown(allKeywords);
            renderKeywordList(allKeywords);

            updateSearchClearVisibility();
            updateKeywordClearVisibility();

            setActiveToggle();
            renderProfiles(active);

            updateSavedCount();
            updateSavedToggleVisibility();
        })
        .catch((err) => {
            console.error(err);
            profilesList.innerHTML =
                '<div class="error-message">Sorry, the project list could not be loaded.</div>';
        });

    function loadExcludedTopicIds() {
        try {
            const raw = localStorage.getItem(EXCLUDED_TOPIC_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    function persistExcludedTopicIds() {
        localStorage.setItem(EXCLUDED_TOPIC_KEY, JSON.stringify(Array.from(excludedTopicIds)));
    }

    function loadSavedTopicIds() {
        try {
            const raw = localStorage.getItem(SAVED_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    function persistSavedTopicIds() {
        localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(manualTopicIds)));
    }

    function loadSavedStaffIds() {
        try {
            const raw = localStorage.getItem(SAVED_STAFF_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    function persistSavedStaffIds() {
        localStorage.setItem(SAVED_STAFF_KEY, JSON.stringify(Array.from(manualStaffIds)));
    }

    function persistSavedIds() {
        persistSavedTopicIds();
        persistSavedStaffIds();
        persistExcludedTopicIds();
    }


    function isTopicSaved(topicId) {
        return effectiveTopicIds.has(topicId);
    }

    function isStaffSaved(staffId) {
        return effectiveStaffIds.has(staffId);
    }

    function updateSavedCount() {
        if (!savedCountEl) return;
        recomputeEffectiveSaves();
        savedCountEl.textContent = String(
            currentView === "projects" ? effectiveTopicIds.size : effectiveStaffIds.size
        );
        updateSavedClearVisibility();
    }


    function updateSavedToggleVisibility() {
        // Saved only makes sense in Topics view. Hide it in Staff view.
        if (!savedToggleBtn) return;
        savedToggleBtn.style.display = "inline-flex";
    }

    function recomputeEffectiveSaves() {
        // 1) Topics from staff saves (minus exclusions)
        const topicsFromStaff = new Set();
        for (const staffId of manualStaffIds) {
            for (const p of allProjects) {
                if (p.supervisorId === staffId && !excludedTopicIds.has(p.id)) {
                    topicsFromStaff.add(p.id);
                }
            }
        }

        // 2) Effective topics = manual topics + staff-derived topics
        effectiveTopicIds = new Set([...manualTopicIds, ...topicsFromStaff]);

        // 3) Effective staff = manual staff + anyone who has at least one effective topic
        effectiveStaffIds = new Set(manualStaffIds);
        for (const p of allProjects) {
            if (effectiveTopicIds.has(p.id)) {
                effectiveStaffIds.add(p.supervisorId);
            }
        }

        // 4) Auto-clean: if a manual staff has *zero* effective topics left, unsave that staff
        // (this makes “unsave last topic => staff unhighlights” work)
        for (const staffId of Array.from(manualStaffIds)) {
            const hasAny = allProjects.some(
                (p) => p.supervisorId === staffId && effectiveTopicIds.has(p.id)
            );
            if (!hasAny) {
                manualStaffIds.delete(staffId);
                // remove now-useless exclusions for that staff
                allProjects.forEach((p) => {
                    if (p.supervisorId === staffId) excludedTopicIds.delete(p.id);
                });
            }
        }
    }


    function getActiveList() {
        return currentView === "staff" ? allStaff : allProjects;
    }

    function refreshView() {
        // clear filters whenever you switch view (avoids “why is nothing showing?” moments)
        if (searchInput) searchInput.value = "";
        if (keywordSelect) keywordSelect.value = "";

        updateSearchClearVisibility();
        updateKeywordClearVisibility();

        const active = getActiveList();
        const allKeywords = getAllUniqueKeywords(active);

        buildKeywordDropdown(allKeywords);
        renderKeywordList(allKeywords);

        applyFilters();
    }

    if (savedToggleBtn) {
        savedToggleBtn.addEventListener("click", () => {
            showSavedOnly = !showSavedOnly;

            savedToggleBtn.classList.toggle("is-active", showSavedOnly);
            savedToggleBtn.setAttribute("aria-pressed", showSavedOnly ? "true" : "false");

            applyFilters(); // re-run with saved-only applied
        });
    }

    // function ensureStaffFavouriteFromTopic(topicItem) {
    //     if (!topicItem || !topicItem.supervisorId) return;
    //     savedStaffIds.add(topicItem.supervisorId);
    // }


    function buildProjectProfilesFromStaff(staffList) {
        const projects = [];

        staffList.forEach((staff) => {
            const staffKeywords = staff.keywords || [];
            const staffAvatar = staff.avatar || "";
            const staffAvatarPosition = staff.avatarPosition || "50% 50%";

            (staff.topics || []).forEach((topic, idx) => {
                projects.push({
                    id: `${staff.id || staff.name}-topic-${idx + 1}`,

                    // project-facing fields
                    projectTitle: topic.title || "Untitled project",
                    projectDescription: topic.description || "",
                    ideas: topic.ideas || [],

                    // supervisor fields
                    supervisorId: staff.id || staff.name,   // ✅ ADD THIS
                    supervisorName: staff.name || "Unknown supervisor",
                    email: staff.email || "",
                    avatar: staffAvatar,
                    avatarPosition: staffAvatarPosition,

                    // keywords used for filtering + chips
                    keywords: staffKeywords,

                    _rawStaffName: staff.name || "",
                });

            });
        });

        return projects;
    }


    // ---- Rendering ----------------------------------------------------------

    function renderProfiles(items) {

        recomputeEffectiveSaves();

        currentDisplayed = items;
        profilesList.innerHTML = "";

        if (!items.length) {
            profilesList.innerHTML =
                '<div class="empty-message">No profiles match your search or filters.</div>';
            return;
        }

        items.forEach((item, index) => {
            const card = document.createElement("article");
            card.className = "profile-card";
            card.setAttribute("tabindex", "0");
            card.setAttribute("data-index", index);
            card.setAttribute("aria-expanded", "false");

            // Avatar (both views)
            const avatarSrc = item.avatar && item.avatar.trim() !== ""
                ? item.avatar
                : "images/default-avatar.jpg";

            const avatarPosition = item.avatarPosition || "50% 50%";

            const avatarInner = `
      <img
        src="${avatarSrc}"
        alt="Profile picture"
        style="
          width:100%;
          height:100%;
          object-fit:cover;
          object-position:${avatarPosition};
        "
        onerror="this.onerror=null; this.src='images/default-avatar.jpg';"
      />
    `;

            const keywordsHtml = (item.keywords || [])
                .map((kw) => `<span class="keyword-chip" aria-label="Keyword: ${kw}">${kw}</span>`)
                .join("");

            // Header name differs by view
            const headerName =
                currentView === "staff"
                    ? (item.name || "Unknown staff")
                    : (item.projectTitle || "Untitled project");

            const isSaved =
                currentView === "projects"
                    ? isTopicSaved(item.id)
                    : isStaffSaved(item.id);

            if (isSaved) card.classList.add("is-saved");
            // Details differs by view
            let detailsHtml = "";
            let emailForButton = "";

            if (currentView === "staff") {
                emailForButton = item.email || "";

                const topicsHtml = (item.topics || [])
                    .map((topic, i, arr) => {
                        const ideas = (topic.ideas || [])
                            .map((idea) => `<li>${idea}</li>`)
                            .join("");

                        return `
            <section class="profile-topic">
              <h3>${i + 1}. ${topic.title}</h3>
              <p>${topic.description}</p>
              ${ideas
                                ? `<p><strong>Within this topic, you could investigate:</strong></p>
                     <ul>${ideas}</ul>`
                                : ""
                            }
            </section>
            ${i < arr.length - 1 ? "<hr class='topic-divider'>" : ""}
          `;
                    })
                    .join("");

                detailsHtml = topicsHtml || "<p>No project details have been added yet.</p>";
            } else {
                // projects view
                emailForButton = item.email || "";

                const ideasList = (item.ideas || []).map((idea) => `<li class="idea-item">${idea}</li>`).join("");

                detailsHtml = `
  <div class="project-details">
    <p><strong>Supervisor:</strong> ${item.supervisorName || "Unknown"}</p>
    ${item.projectDescription ? `<p class="project-description">${item.projectDescription}</p>` : ""}
    ${ideasList
                        ? `<p><strong>Within this project, you could investigate:</strong></p>
         <ul class="idea-list">${ideasList}</ul>`
                        : ""
                    }
  </div>
`;

            }
            const saveBtnHtml = `
                <button
                    class="detail-btn detail-btn-save"
                    type="button"
                    data-save-id="${item.id}"
                    data-save-type="${currentView === "projects" ? "topic" : "staff"}"
                    aria-pressed="${isSaved ? "true" : "false"}"
                >
                    <span class="detail-btn-icon">${isSaved ? "⭐" : "☆"}</span>
                    ${isSaved ? "Saved" : "Save"}
                </button>
                `;

            card.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${avatarInner}</div>

        <div class="profile-main">
          <div class="profile-name">${headerName}</div>
          <div class="keyword-row">${keywordsHtml}</div>
        </div>
      </div>

      <div class="profile-details">
        ${detailsHtml}

        <div class="profile-detail-footer">
          <button
            class="detail-btn detail-btn-email"
            type="button"
            data-email="${emailForButton}"
          >
            <span class="detail-btn-icon">❓</span>
            Questions? Email me
          </button>

          <button class="detail-btn detail-btn-interest" type="button">
            <span class="detail-btn-icon">👍</span>
            Interested in this topic
          </button>

          ${saveBtnHtml}

        </div>
      </div>
    `;

            profilesList.appendChild(card);
        });
    }




    // ---- Filtering ----------------------------------------------------------
    // Collect all unique keywords across all profiles
    function getAllUniqueKeywords(profiles) {
        const allKeywords = new Set();

        profiles.forEach((profile) => {
            (profile.keywords || []).forEach((kw) => {
                if (kw && kw.trim() !== "") {
                    allKeywords.add(kw.trim());
                }
            });
        });

        return Array.from(allKeywords).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" })
        );
    }

    // Build the dropdown from a list of keywords
    function buildKeywordDropdown(keywords) {
        if (!keywordSelect) return;

        keywordSelect.innerHTML = '<option value="">All keywords</option>';

        keywords.forEach((kw) => {
            const opt = document.createElement("option");
            opt.value = kw;
            opt.textContent = kw;
            keywordSelect.appendChild(opt);
        });
    }

    // Build the keyword chip list at the top
    // Build the keyword chip list at the top
    function renderKeywordList(keywords) {
        // If the section is hidden in config, don't bother rendering
        if (!keywordList || !showKeywordLegend) return;

        keywordList.innerHTML = "";

        keywords.forEach((kw) => {
            // Always use the same element + classes for consistent styling
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "keyword-chip keyword-chip--global";
            chip.textContent = kw;

            // Only add click behaviour if filtering is enabled
            if (enableKeywordChipFilter) {
                chip.addEventListener("click", () => {
                    if (!keywordSelect) return;

                    keywordSelect.value = kw;
                    updateKeywordClearVisibility();
                    applyFilters();
                });
            }

            keywordList.appendChild(chip);
        });
    }

    function updateSavedClearVisibility() {
        if (!savedWrapper) return;

        recomputeEffectiveSaves();

        const count = currentView === "projects"
            ? effectiveTopicIds.size
            : effectiveStaffIds.size;

        if (count > 0) savedWrapper.classList.add("has-value");
        else savedWrapper.classList.remove("has-value");
    }


    function updateSearchClearVisibility() {
        if (!searchWrapper) return;
        if (!searchInput.value.trim()) {
            searchWrapper.classList.remove("has-value");
        } else {
            searchWrapper.classList.add("has-value");
        }
    }

    function updateKeywordClearVisibility() {
        if (!keywordWrapper) return;
        if (!keywordSelect.value.trim()) {
            keywordWrapper.classList.remove("has-value");
        } else {
            keywordWrapper.classList.add("has-value");
        }
    }

    function applyFilters() {

        recomputeEffectiveSaves();

        const term = searchInput.value.trim().toLowerCase();
        const selectedKeyword = keywordSelect.value.trim().toLowerCase();

        const active = getActiveList();

        const filtered = active.filter((item) => {
            const keywordText = (item.keywords || []).join(" ").toLowerCase();

            let allText = "";
            if (currentView === "staff") {
                const topicsText = (item.topics || [])
                    .map((t) => {
                        const ideasText = (t.ideas || []).join(" ");
                        return `${t.title} ${t.description} ${ideasText}`;
                    })
                    .join(" ");

                allText = [item.name, keywordText, topicsText].join(" ").toLowerCase();
            } else {
                // projects view
                allText = [
                    item.projectTitle,
                    item.projectDescription,
                    (item.ideas || []).join(" "),
                    item.supervisorName,
                    keywordText
                ]
                    .join(" ")
                    .toLowerCase();
            }

            const matchesSearch = !term || allText.includes(term);
            const matchesKeyword = !selectedKeyword || keywordText.includes(selectedKeyword);

            return matchesSearch && matchesKeyword;
        });
        let finalList = filtered;

        if (showSavedOnly) {
            finalList =
                currentView === "projects"
                    ? filtered.filter((item) => effectiveTopicIds.has(item.id))
                    : filtered.filter((item) => effectiveStaffIds.has(item.id));
        }



        renderProfiles(finalList);
    }


    searchInput.addEventListener("input", () => {
        updateSearchClearVisibility();
        applyFilters();
    });

    keywordSelect.addEventListener("change", () => {
        updateKeywordClearVisibility();
        applyFilters();
    });



    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", () => {
            searchInput.value = "";
            updateSearchClearVisibility();
            applyFilters();
            searchInput.focus();
        });
    }

    if (clearKeywordBtn) {
        clearKeywordBtn.addEventListener("click", () => {
            keywordSelect.value = "";
            updateKeywordClearVisibility();
            applyFilters();
            keywordSelect.focus();
        });
    }

    if (clearSavedBtn) {
        clearSavedBtn.addEventListener("click", () => {
            // Turn off "saved only" mode
            showSavedOnly = false;
            if (savedToggleBtn) {
                savedToggleBtn.classList.remove("is-active");
                savedToggleBtn.setAttribute("aria-pressed", "false");
            }

            // Clear saved state:
            // Option 1 (recommended): clear EVERYTHING (staff saves, topic saves, exclusions)
            manualStaffIds.clear();
            manualTopicIds.clear();
            excludedTopicIds?.clear?.(); // safe if you haven't added exclusions yet

            persistSavedIds();
            applyFilters();
            updateSavedCount(); // also updates clear visibility
        });
    }


    // ---- Expand / collapse handling ----------------------------------------

    // Use event delegation so re-rendering is safe
    profilesList.addEventListener("click", (event) => {
        const saveBtn = event.target.closest(".detail-btn-save");
        if (saveBtn) {
            event.stopPropagation();

            const id = saveBtn.dataset.saveId;
            const type = saveBtn.dataset.saveType; // "topic" | "staff"
            if (!id || !type) return;

            recomputeEffectiveSaves();

            // ---------- STAFF SAVE ----------
            if (type === "staff") {
                const staffId = id;

                if (manualStaffIds.has(staffId)) {
                    // Turning OFF staff: remove staff + remove all manual topic saves for them + clear exclusions
                    manualStaffIds.delete(staffId);

                    allProjects.forEach((p) => {
                        if (p.supervisorId === staffId) {
                            manualTopicIds.delete(p.id);
                            excludedTopicIds.delete(p.id);
                        }
                    });
                } else {
                    // Turning ON staff: save staff + clear exclusions so all topics show
                    manualStaffIds.add(staffId);

                    allProjects.forEach((p) => {
                        if (p.supervisorId === staffId) {
                            excludedTopicIds.delete(p.id);
                        }
                    });
                }

                persistSavedIds();
                applyFilters();
                updateSavedCount();
                return;
            }

            // ---------- TOPIC SAVE ----------
            const topicId = id;
            const topic = allProjects.find((p) => p.id === topicId);
            const staffId = topic?.supervisorId;

            // If this topic is currently highlighted (effective), clicking means "turn it off"
            const isEffective = effectiveTopicIds.has(topicId);

            if (isEffective) {
                // Turn OFF:
                // - remove manual save if it exists
                manualTopicIds.delete(topicId);

                // - if topic is highlighted due to staff save, exclude it
                if (staffId && manualStaffIds.has(staffId)) {
                    excludedTopicIds.add(topicId);
                }
            } else {
                // Turn ON:
                // - remove exclusion
                excludedTopicIds.delete(topicId);

                // - add manual save
                manualTopicIds.add(topicId);
            }

            persistSavedIds();
            applyFilters();
            updateSavedCount();
            return;
        }


        // Footer "Interested in this topic" button → redirect to form
        const interestBtn = event.target.closest(".detail-btn-interest");
        if (interestBtn) {
            event.stopPropagation();
            window.open(interestFormUrl, "_blank");
            // or: window.open(interestFormUrl, "_blank");
            return;
        }

        // Footer "Questions? Email me" button
        const footerEmailBtn = event.target.closest(".detail-btn-email");
        if (footerEmailBtn) {
            event.stopPropagation();
            const email = footerEmailBtn.dataset.email || "";
            if (email) {
                window.location.href =
                    `mailto:${email}?subject=I%20am%20interested%20in%20your%20research%20project`;
            }
            return;
        }

        // Anything else: toggle expand/collapse
        const card = event.target.closest(".profile-card");
        if (!card) return;

        toggleCard(card);
    });

    // Allow keyboard toggle (Enter/Space) when card is focused
    profilesList.addEventListener("keydown", (event) => {
        const card = event.target.closest(".profile-card");
        if (!card) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleCard(card);
        }
    });

    function toggleCard(card) {
        const isOpen = card.classList.contains("open");
        const details = card.querySelector(".profile-details");
        if (!details) return;

        if (isOpen) {
            card.classList.remove("open");
            card.setAttribute("aria-expanded", "false");
        } else {
            card.classList.add("open");
            card.setAttribute("aria-expanded", "true");
        }
    }

    function setActiveToggle() {
        if (!viewStaffBtn || !viewProjectsBtn) return;

        const staffActive = currentView === "staff";

        viewStaffBtn.classList.toggle("is-active", staffActive);
        viewProjectsBtn.classList.toggle("is-active", !staffActive);

        viewStaffBtn.setAttribute("aria-pressed", staffActive ? "true" : "false");
        viewProjectsBtn.setAttribute("aria-pressed", staffActive ? "false" : "true");

        document.body.classList.toggle("view-projects", !staffActive);
        document.body.classList.toggle("view-staff", staffActive);

        updateSavedToggleVisibility();
        updateSavedCount();
    }

    if (viewStaffBtn) {
        viewStaffBtn.addEventListener("click", () => {
            currentView = "staff";
            setActiveToggle();
            refreshView();
        });
    }

    if (viewProjectsBtn) {
        viewProjectsBtn.addEventListener("click", () => {
            currentView = "projects";
            setActiveToggle();
            refreshView();
        });
    }
    setActiveToggle()

    // ---- Print / Save as PDF --------------------------------------------------

    // ---- Print / Save as PDF (NO POPUPS) --------------------------------------

    let __prePrintState = null;

    if (printBtn) {
        printBtn.addEventListener("click", () => {
            printInPlace(currentDisplayed);
        });
    }

    function printInPlace(items) {
        // Save current page state so we can restore after printing
        __prePrintState = {
            title: document.title,
            scrollY: window.scrollY,
            bodyClass: document.body.className,
            bodyHtml: document.body.innerHTML,
        };

        const dateStr = new Date().toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

        const title =
            currentView === "staff"
                ? "Research Projects Directory — Staff"
                : "Research Projects Directory — Topics";

        const subtitle =
            currentView === "staff"
                ? "Staff profiles and their available dissertation topics"
                : "Dissertation topics (with supervising staff shown)";

        // Cards HTML
        const cards =
            currentView === "staff"
                ? buildStaffPrintCards(items)
                : buildTopicPrintCards(items);

        // Swap the entire body for a print-only layout
        document.title = title;
        document.body.className = "print-mode";
        document.body.innerHTML = `
    <main class="print-wrap">
      <header class="print-header">
        <h1>${escapeHtml(title)}</h1>
        <p class="print-meta">${escapeHtml(subtitle)} • Generated ${escapeHtml(
            dateStr
        )} • Showing ${items.length} result(s)</p>
      </header>

      <section class="print-grid">
        ${cards || `<div class="print-card"><p>No results to export (try clearing filters).</p></div>`}
      </section>
    </main>
  `;

        // Trigger print
        window.print();

        // Restore after print (best effort across browsers)
        // Some browsers fire afterprint reliably, some don't.
        // We'll do both: event + fallback timeout.
        restoreAfterPrint();
    }

    function restoreAfterPrint() {
        const restore = () => {
            if (!__prePrintState) return;

            document.body.innerHTML = __prePrintState.bodyHtml;
            document.body.className = __prePrintState.bodyClass;
            document.title = __prePrintState.title;

            // Re-run your app setup by forcing a reload (cleanest)
            // Because replacing bodyHTML removes all event listeners.
            // If you'd rather not reload, we can refactor to avoid replacing the whole body.
            window.scrollTo(0, __prePrintState.scrollY);

            __prePrintState = null;
            location.reload();
        };

        // Try afterprint first
        window.addEventListener(
            "afterprint",
            () => {
                restore();
            },
            { once: true }
        );

        // Fallback: restore after a short delay in case afterprint doesn't fire
        setTimeout(() => {
            restore();
        }, 800);
    }


    function openPrintWindow(html) {
        const w = window.open("", "_blank", "noopener,noreferrer");
        if (!w) {
            alert("Pop-up blocked. Please allow pop-ups for this site to print/save.");
            return;
        }
        w.document.open();
        w.document.write(html);
        w.document.close();

        // Give the new document a moment to paint before printing
        w.onload = () => {
            w.focus();
            w.print();
        };
    }

    function buildPrintableHtml(items) {
        const dateStr = new Date().toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

        const title =
            currentView === "staff"
                ? "Research Projects Directory — Staff"
                : "Research Projects Directory — Topics";

        const subtitle =
            currentView === "staff"
                ? "Staff profiles and their available dissertation topics"
                : "Dissertation topics (with supervising staff shown)";

        const cards =
            currentView === "staff"
                ? buildStaffPrintCards(items)
                : buildTopicPrintCards(items);

        // Inline CSS so the print page is self-contained
        return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { --text:#1a1a1a; --muted:#555; --border:#e6c9bd; --card:#ffffff; --bg:#fcfaf8; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 28px; font-family: system-ui, -apple-system, Segoe UI, sans-serif; background: var(--bg); color: var(--text); }
    header { margin-bottom: 18px; }
    h1 { margin: 0; font-size: 20px; }
    .meta { margin-top: 6px; color: var(--muted); font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
    .card h2 { margin: 0 0 6px 0; font-size: 16px; }
    .line { margin: 0 0 6px 0; color: var(--muted); font-size: 13px; }
    ul { margin: 6px 0 0 18px; padding: 0; }
    li { margin: 0 0 4px 0; }
    .keywords { margin-top: 8px; font-size: 12px; color: var(--muted); }
    .pill { display: inline-block; border: 1px solid var(--border); border-radius: 999px; padding: 2px 8px; margin: 2px 4px 0 0; }
    @media print {
      body { background: #fff; padding: 0; }
      .card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">${escapeHtml(subtitle)} • Generated ${escapeHtml(dateStr)} • Showing ${items.length} result(s)</div>
  </header>

  <main class="grid">
    ${cards || `<div class="card"><p class="line">No results to export (try clearing filters).</p></div>`}
  </main>
</body>
</html>`;
    }

    function buildStaffPrintCards(items) {
        return items
            .map((s) => {
                const keywords = (s.keywords || [])
                    .map((kw) => `<span class="print-pill">${escapeHtml(kw)}</span>`)
                    .join("");

                const topics = (s.topics || [])
                    .map((t, idx) => {
                        const ideas = (t.ideas || [])
                            .map((i) => `<li>${sanitizeIdeaHtml(i)}</li>`)
                            .join("");

                        return `
            <div class="print-line"><strong>${idx + 1}. ${escapeHtml(t.title || "")}</strong></div>
            ${t.description ? `<div class="print-line">${escapeHtml(t.description)}</div>` : ""}
            ${ideas ? `<ul>${ideas}</ul>` : ""}
          `;
                    })
                    .join("<hr style='border:none;border-top:1px solid rgba(0,0,0,0.06); margin:10px 0;' />");

                return `
        <section class="print-card">
          <h2>${escapeHtml(s.name || "Unknown staff")}</h2>
          ${s.email ? `<div class="print-line">${escapeHtml(s.email)}</div>` : ""}
          ${topics || `<div class="print-line">No topic details provided.</div>`}
          ${keywords ? `<div class="print-keywords"><strong>Keywords:</strong> ${keywords}</div>` : ""}
        </section>
      `;
            })
            .join("");
    }

    function buildTopicPrintCards(items) {
        return items
            .map((p) => {
                const keywords = (p.keywords || [])
                    .map((kw) => `<span class="print-pill">${escapeHtml(kw)}</span>`)
                    .join("");

                const ideas = (p.ideas || [])
                    .map((i) => `<li>${sanitizeIdeaHtml(i)}</li>`)
                    .join("");

                return `
        <section class="print-card">
          <h2>${escapeHtml(p.projectTitle || "Untitled topic")}</h2>
          <div class="print-line"><strong>Supervisor:</strong> ${escapeHtml(p.supervisorName || "Unknown")}${p.email ? ` • ${escapeHtml(p.email)}` : ""}</div>
          ${p.projectDescription ? `<div class="print-line">${escapeHtml(p.projectDescription)}</div>` : ""}
          ${ideas ? `<ul>${ideas}</ul>` : ""}
          ${keywords ? `<div class="print-keywords"><strong>Keywords:</strong> ${keywords}</div>` : ""}
        </section>
      `;
            })
            .join("");
    }


    // Escapes plain text for HTML
    function escapeHtml(str) {
        return String(str ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    /**
     * Your ideas sometimes include actual <a href="..."> links (e.g., SISL link),
     * so for print we allow ONLY safe-ish anchors and strip everything else.
     * If you want *zero* HTML allowed, just return escapeHtml(idea).
     */
    function sanitizeIdeaHtml(idea) {
        const raw = String(idea ?? "");

        // If no tags, just escape
        if (!raw.includes("<")) return escapeHtml(raw);

        // Allow <a href="...">text</a> only; strip other tags
        // This is a simple “good enough” sanitizer for your controlled JSON content.
        const escaped = raw
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");

        // Re-enable anchors that were originally anchors:
        // Convert &lt;a href='URL' ...&gt;TEXT&lt;/a&gt; back to <a ...>TEXT</a>
        // (handles single/double quotes)
        return escaped.replace(
            /&lt;a\s+href=(&quot;|&#039;)(.*?)\1\s*(target=(&quot;|&#039;).*?\4)?\s*&gt;(.*?)&lt;\/a&gt;/gi,
            (_m, _q, href, _t, _tq, text) => {
                const safeHref = href.startsWith("http") ? href : "#";
                return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            }
        );
    }

});

