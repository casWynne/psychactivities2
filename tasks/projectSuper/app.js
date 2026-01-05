// app.js
document.addEventListener("DOMContentLoaded", () => {
  const CONFIG = {
    // Toolbar always visible now (because it always has Saved)
    showSearch: true,              // show/hide the search input (toolbar)
    showKeywordFilter: true,       // show/hide keyword dropdown (toolbar)
    showKeywordLegend: true,       // show/hide keyword legend box (above toolbar)
    enableLegendChipFilter: true, // clicking legend chips filters dropdown
    interestFormUrl: "https://forms.office.com/e/UT6nby4S1n",
    useSuperKeywords: true,

    superKeywords: {
      "Learning, Cognition & Memory": [
        "Sequences",
        "Serial Dependence",
        "Statistical Learning",
        "Implicit Learning",
        "Learning",
        "Memory",
        "Social Cognition",
        "Visual Disorders"
      ],

      "Language, Communication & Neurodiversity": [
        "Stuttering",
        "Language Disorders",
        "Autism",
        "Social Cognition",
        "Anxiety"
      ],

      "Wellbeing, Mental Health & Flourishing": [
        "Human Flourishing",
        "Well-being",
        "Well-being Literacy",
        "Balance and Harmony",
        "Forgiveness",
        "Anxiety",
        "Hope & Wellbeing"
      ],

      "Culture, Identity & Social Justice": [
        "Culture",
        "Migration & Identity",
        "Race/Ethnicity",
        "Racism",
        "Intersectionality",
        "Microaggressions",
        "Widening Participation",
        "Student Experience",
        "Cultural intelligence",
        "Agriculturation & Adjustment",
        "Cross-cultural and international psychology"
      ],

      "Behaviour, Decision-Making & Influence": [
        "Gambling",
        "Responsible Gambling",
        "Advertising",
        "Branding",
        "Enivronmental Behaviour"
      ],

      "Environment, Values & Society": [
        "Human Environment Relationships",
        "Enivronmental Behaviour",
        "Hope & Wellbeing",
        "Balance and Harmony"
      ]
    }


  }
  // ---- Storage keys ---------------------------------------------
  const STORAGE = {
    topics: "projectSuperSavedTopics",
    staff: "projectSuperSavedStaff",
    excluded: "projectSuperExcludedTopics",
  }


  // ---- App state (single source of truth) ------------------------
  const state = {
    currentView: "staff",    // "staff" | "projects"
    showSavedOnly: false,
    search: "",
    keyword: "",
    superKeyword: "",


    allStaff: [],
    allProjects: [],

    manualTopicIds: new Set(),
    manualStaffIds: new Set(),
    excludedTopicIds: new Set(),

    effectiveTopicIds: new Set(),
    effectiveStaffIds: new Set(),

    currentDisplayed: [],
  };

  // ---- DOM refs --------------------------------------------------
  let dom = {};
  let listenersAttached = false;

  // ---- Print restore buffer -------------------------------------
  let prePrint = null;

  // ===============================================================
  // INIT
  // ===============================================================

  bindDom();
  applyConfigVisibility();
  ensureLegendClearButton();
  updateLegendClearButtonVisibility();
  hydrateFromStorage();

  fetch("data/staff-projects.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load staff-projects.json");
      return res.json();
    })
    .then((data) => {
      state.allStaff = (data.staff || []).sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
      );
      state.allProjects = buildProjectProfilesFromStaff(state.allStaff);

      recomputeEffectiveSaves();
      attachListeners();

      // Initial render
      refreshKeywordsForCurrentView();
      renderAndUpdate();
    })
    .catch((err) => {
      console.error(err);
      if (dom.profilesList) {
        dom.profilesList.innerHTML =
          '<div class="error-message">Sorry, the project list could not be loaded.</div>';
      }
    });

  // ===============================================================
  // DOM + CONFIG
  // ===============================================================

  function bindDom() {
    dom = {
      profilesList: document.getElementById("profilesList"),
      searchInput: document.getElementById("searchInput"),
      keywordSelect: document.getElementById("keywordSelect"),
      searchWrapper: document.querySelector(".search-wrapper"),
      keywordWrapper: document.querySelector(".keyword-wrapper"),
      clearSearchBtn: document.getElementById("clearSearchBtn"),
      clearKeywordBtn: document.getElementById("clearKeywordBtn"),
      keywordList: document.getElementById("keywordList"),

      viewStaffBtn: document.getElementById("viewStaffBtn"),
      viewProjectsBtn: document.getElementById("viewProjectsBtn"),
      search: document.getElementById("search"),
      keyword: document.getElementById("keyword"),
      printBtn: document.getElementById("printBtn"),

      savedToggleBtn: document.getElementById("savedToggleBtn"),
      savedCountEl: document.getElementById("savedCount"),
      savedWrapper: document.getElementById("savedWrapper"),
      clearSavedBtn: document.getElementById("clearSavedBtn"),

      toolbar: document.querySelector(".toolbar"),
      keywordLegendSection: document.querySelector(".keywords"),

      keywordLegendLabel: document.getElementById("keywordLegendLabel"),
      keywordFilterLabel: document.getElementById("keywordFilterLabel"),

      keywordLegendLabel: document.getElementById("keywordLegendLabel"),
      keywordFilterLabel: document.getElementById("keywordFilterLabel"),
    };
  }

  function hasActiveKeywordFilter() {
    return !!(String(state.superKeyword || "").trim() || String(state.keyword || "").trim());
  }

  function ensureLegendClearButton() {
    if (!dom.keywordLegendSection) return;

    // If already added, don't add again
    if (dom.keywordLegendSection.querySelector(".legend-clear-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "legend-clear-btn";
    btn.textContent = "Clear ✕";
    btn.setAttribute("aria-label", "Clear keyword/theme filter");

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Clear both, whichever is in use
      state.keyword = "";
      state.superKeyword = "";

      // If dropdown exists, reset it too
      if (dom.keywordSelect) dom.keywordSelect.value = "";

      renderAndUpdate();
    });

    // Stick it at the end of the legend section (you can move it later)
    dom.keywordLegendSection.appendChild(btn);
  }

  function updateLegendClearButtonVisibility() {
    const btn = dom.keywordLegendSection?.querySelector(".legend-clear-btn");
    if (!btn) return;

    // Only show if:
    // - legend is visible
    // - chip filtering is enabled (otherwise it’s weird)
    // - there’s something to clear
    const shouldShow =
      CONFIG.showKeywordLegend &&
      CONFIG.enableLegendChipFilter &&
      hasActiveKeywordFilter();

    btn.style.display = shouldShow ? "inline-flex" : "none";
  }


  function getAllSuperKeywordMembersSet() {
    const set = new Set();
    const map = CONFIG.superKeywords || {};
    Object.values(map).forEach((arr) => {
      (arr || []).forEach((k) => set.add(normaliseKw(k)));
    });
    return set;
  }

  function getOrphanKeywords(activeList) {
    const all = getAllUniqueKeywords(activeList); // returns original-cased keywords
    const themed = getAllSuperKeywordMembersSet();
    return all.filter((k) => !themed.has(normaliseKw(k)));
  }


  function applyConfigVisibility() {
    // Toolbar stays visible — we only hide individual controls

    // --- Search control (toolbar) ---
    if (dom.search) {
      dom.search.style.display = CONFIG.showSearch ? "" : "none";
    }
    if (dom.searchInput) {
      dom.searchInput.disabled = !CONFIG.showSearch;
      if (!CONFIG.showSearch) {
        dom.searchInput.value = "";
        state.search = "";
      }
    }

    // --- Keyword filter dropdown (toolbar) ---
    if (dom.keyword) {
      dom.keyword.style.display = CONFIG.showKeywordFilter ? "" : "none";
    }
    if (dom.keywordSelect) {
      dom.keywordSelect.disabled = !CONFIG.showKeywordFilter;

      if (!CONFIG.showKeywordFilter) {
        // Dropdown hidden: only clear filter state if user has *no other* way to control it
        const chipsCanFilter =
          CONFIG.showKeywordLegend && CONFIG.enableLegendChipFilter;

        dom.keywordSelect.value = ""; // keep dropdown visually reset

        if (!chipsCanFilter) {
          // No dropdown + no chip filtering => clear to avoid “invisible filtering”
          state.keyword = "";
          state.superKeyword = "";
        }
        // else: chips are the control now, so keep state.keyword/state.superKeyword as-is
      }
    }

    // --- Keyword legend box (above toolbar) ---
    if (dom.keywordLegendSection) {
      dom.keywordLegendSection.style.display = CONFIG.showKeywordLegend ? "" : "none";
    }

    // If legend is hidden and dropdown is hidden, user can't control keyword filters:
    if (!CONFIG.showKeywordLegend && !CONFIG.showKeywordFilter) {
      state.keyword = "";
      state.superKeyword = "";
      if (dom.keywordSelect) dom.keywordSelect.value = "";
    }
  }

  // ===============================================================
  // STORAGE
  // ===============================================================

  function hydrateFromStorage() {
    state.manualTopicIds = new Set(loadArray(STORAGE.topics));
    state.manualStaffIds = new Set(loadArray(STORAGE.staff));
    state.excludedTopicIds = new Set(loadArray(STORAGE.excluded));
  }

  function persistToStorage() {
    saveArray(STORAGE.topics, Array.from(state.manualTopicIds));
    saveArray(STORAGE.staff, Array.from(state.manualStaffIds));
    saveArray(STORAGE.excluded, Array.from(state.excludedTopicIds));
  }

  function loadArray(key) {
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveArray(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
  }

  // ===============================================================
  // DATA SHAPING
  // ===============================================================

  function buildProjectProfilesFromStaff(staffList) {
    const projects = [];

    staffList.forEach((staff) => {
      const staffKeywords = staff.keywords || [];
      const staffAvatar = staff.avatar || "";
      const staffAvatarPosition = staff.avatarPosition || "50% 50%";
      const supervisorId = staff.id || staff.name;

      (staff.topics || []).forEach((topic, idx) => {
        projects.push({
          id: `${supervisorId}-topic-${idx + 1}`,
          projectTitle: topic.title || "Untitled project",
          projectDescription: topic.description || "",
          ideas: topic.ideas || [],

          supervisorId,
          supervisorName: staff.name || "Unknown supervisor",
          email: staff.email || "",
          avatar: staffAvatar,
          avatarPosition: staffAvatarPosition,

          keywords: staffKeywords,
        });
      });
    });

    return projects;
  }

  function getActiveList() {
    return state.currentView === "staff" ? state.allStaff : state.allProjects;
  }

  // ===============================================================
  // SAVES (core logic)
  // ===============================================================

  function recomputeEffectiveSaves() {
    // 1) Topics derived from saved staff (minus exclusions)
    const topicsFromStaff = new Set();
    for (const staffId of state.manualStaffIds) {
      for (const p of state.allProjects) {
        if (p.supervisorId === staffId && !state.excludedTopicIds.has(p.id)) {
          topicsFromStaff.add(p.id);
        }
      }
    }

    // 2) Effective topics = manual topics + staff-derived topics
    state.effectiveTopicIds = new Set([...state.manualTopicIds, ...topicsFromStaff]);

    // 3) Effective staff = manual staff + anyone who has at least one effective topic
    state.effectiveStaffIds = new Set(state.manualStaffIds);
    for (const p of state.allProjects) {
      if (state.effectiveTopicIds.has(p.id)) {
        state.effectiveStaffIds.add(p.supervisorId);
      }
    }

    // 4) Auto-clean: if a manual staff has zero effective topics left, unsave that staff
    for (const staffId of Array.from(state.manualStaffIds)) {
      const hasAny = state.allProjects.some(
        (p) => p.supervisorId === staffId && state.effectiveTopicIds.has(p.id)
      );
      if (!hasAny) {
        state.manualStaffIds.delete(staffId);
        // clear exclusions for that staff (no point keeping them)
        state.allProjects.forEach((p) => {
          if (p.supervisorId === staffId) state.excludedTopicIds.delete(p.id);
        });
      }
    }
  }

  function isTopicSaved(topicId) {
    return state.effectiveTopicIds.has(topicId);
  }

  function isStaffSaved(staffId) {
    return state.effectiveStaffIds.has(staffId);
  }

  // ===============================================================
  // FILTERS + KEYWORDS
  // ===============================================================

  function normaliseKw(s) {
    return String(s || "").trim().toLowerCase();
  }

  function getSuperKeywordNames() {
    return Object.keys(CONFIG.superKeywords || {}).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }

  function getSuperKeywordMembers(superName) {
    const map = CONFIG.superKeywords || {};
    const members = map[superName] || [];
    return members.map(normaliseKw).filter(Boolean);
  }

  function setKeywordUiLabels() {
    const usingSuper = !!CONFIG.useSuperKeywords;

    if (dom.keywordLegendLabel) {
      dom.keywordLegendLabel.textContent = usingSuper ? "Themes" : "Keywords";
    }
    if (dom.keywordFilterLabel) {
      dom.keywordFilterLabel.textContent = usingSuper ? "Filter by theme" : "Filter by keyword";
    }

    // Update the default dropdown option text
    if (dom.keywordSelect) {
      const first = dom.keywordSelect.querySelector("option[value='']");
      if (first) first.textContent = usingSuper ? "All themes" : "All keywords";
    }
  }


  function getAllUniqueKeywords(profiles) {
    const all = new Set();
    profiles.forEach((p) => {
      (p.keywords || []).forEach((kw) => {
        if (kw && kw.trim()) all.add(kw.trim());
      });
    });
    return Array.from(all).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }

  function buildKeywordDropdown(keywords) {
    if (!dom.keywordSelect) return;

    dom.keywordSelect.innerHTML = '<option value="">All keywords</option>';
    keywords.forEach((kw) => {
      const opt = document.createElement("option");
      opt.value = kw;
      opt.textContent = kw;
      dom.keywordSelect.appendChild(opt);
    });
  }

  function renderKeywordLegend(items) {
    if (!dom.keywordList) return;

    dom.keywordList.innerHTML = "";

    items.forEach(({ label, type }) => {
      const chip = document.createElement("button");
      chip.className = "keyword-chip";
      chip.type = "button";
      chip.textContent = label;

      if (type === "super") chip.classList.add("keyword-chip--super");
      if (type === "orphan") chip.classList.add("keyword-chip--orphan");
      if (type === "keyword") chip.classList.add("keyword-chip--keyword");

      // ✅ Apply disabled style immediately if chip filtering is off
      if (!CONFIG.enableLegendChipFilter) {
        chip.classList.add("is-disabled");
        chip.setAttribute("aria-disabled", "true");
      }

      // Click-to-filter behaviour (only when enabled)
      if (CONFIG.enableLegendChipFilter) {
        chip.addEventListener("click", () => {
          // If dropdown exists & visible, sync it; otherwise chips still control the filter state
          if (dom.keywordSelect && CONFIG.showKeywordFilter) {
            dom.keywordSelect.value = label;
          }

          if (CONFIG.useSuperKeywords) {
            if (type === "super") {
              state.superKeyword = label;
              state.keyword = "";
              if (dom.keywordSelect && CONFIG.showKeywordFilter) dom.keywordSelect.value = label;
            } else {
              // orphan keyword chip
              state.keyword = label;
              state.superKeyword = "";
              if (dom.keywordSelect && CONFIG.showKeywordFilter) dom.keywordSelect.value = "";
            }
          } else {
            state.keyword = label;
            state.superKeyword = "";
            if (dom.keywordSelect && CONFIG.showKeywordFilter) dom.keywordSelect.value = label;
          }

          if (typeof updateKeywordClearVisibility === "function") {
            updateKeywordClearVisibility();
          }

          renderAndUpdate();
        });
      }

      dom.keywordList.appendChild(chip);
    });
  }

  function refreshKeywordsForCurrentView() {
    const active = getActiveList();

    let dropdownLabels = [];
    let legendItems = [];

    if (CONFIG.useSuperKeywords) {
      const themes = getSuperKeywordNames();       // ["Learning & Memory", "Wellbeing", ...]
      const orphans = getOrphanKeywords(active);   // ["Eye tracking", "EEG", ...]

      dropdownLabels = themes;

      legendItems = themes
        .map((label) => ({ label, type: "super" }))
        .concat(orphans.map((label) => ({ label, type: "orphan" })));
    } else {
      const keywords = getAllUniqueKeywords(active);

      dropdownLabels = keywords;
      legendItems = keywords.map((label) => ({ label, type: "keyword" }));
    }

    buildKeywordDropdown(dropdownLabels);
    renderKeywordLegend(legendItems);
    setKeywordUiLabels();
    ensureLegendClearButton();
    updateLegendClearButtonVisibility();
  }


  function applyFilters() {
    recomputeEffectiveSaves();

    const term = (state.search || "").trim().toLowerCase();
    const active = getActiveList();

    // Normalise the chosen filter values
    const chosenKeyword = normaliseKw(state.keyword);
    const chosenSuperLabel = (state.superKeyword || "").trim(); // keep original label for lookup
    const chosenSuperNorm = normaliseKw(state.superKeyword);

    // Precompute members for selected superKeyword (if any)
    const superMembers = CONFIG.useSuperKeywords && chosenSuperLabel
      ? getSuperKeywordMembers(chosenSuperLabel) // expected to return normalised strings
      : [];

    const filtered = active.filter((item) => {
      // --- Keywords (normalised) ------------------------------------
      const itemKeywords = (item.keywords || []).map(normaliseKw).filter(Boolean);
      const keywordText = itemKeywords.join(" "); // already lower-ish via normaliseKw

      // --- Search text (depends on view) ----------------------------
      let allText = "";
      if (state.currentView === "staff") {
        const topicsText = (item.topics || [])
          .map((t) => {
            const ideas = (t.ideas || []).join(" ");
            return `${t.title || ""} ${t.description || ""} ${ideas}`;
          })
          .join(" ");

        allText = `${item.name || ""} ${keywordText} ${topicsText}`.toLowerCase();
      } else {
        const ideasText = (item.ideas || []).join(" ");
        allText = `${item.projectTitle || ""} ${item.projectDescription || ""} ${ideasText} ${item.supervisorName || ""} ${keywordText}`.toLowerCase();
      }

      const matchesSearch = !term || allText.includes(term);

      // --- Keyword / SuperKeyword matching --------------------------
      let matchesKeyword = true;

      if (CONFIG.useSuperKeywords) {
        // If no theme selected, don't filter by theme
        if (chosenSuperNorm) {
          // If theme exists but has no members yet, don't hide everything
          if (superMembers.length === 0) {
            matchesKeyword = true;
          } else {
            // Theme matches if any member keyword is present on the item
            matchesKeyword = superMembers.some((m) => itemKeywords.includes(m));
          }
        }
      } else {
        // Plain keyword mode (substring behaviour like before)
        matchesKeyword = !chosenKeyword || keywordText.includes(chosenKeyword);
      }

      return matchesSearch && matchesKeyword;
    });

    // --- Saved-only filter ------------------------------------------
    if (!state.showSavedOnly) return filtered;

    if (state.currentView === "projects") {
      return filtered.filter((x) => state.effectiveTopicIds.has(x.id));
    }
    return filtered.filter((x) => state.effectiveStaffIds.has(x.id));
  }


  // ===============================================================
  // RENDER
  // ===============================================================

  function renderAndUpdate() {
    const list = applyFilters();
    renderProfiles(list);
    updateSavedCount();
    updateSavedClearVisibility();
    updateSearchClearVisibility();
    updateKeywordClearVisibility();
    setActiveToggleUI();
    updateLegendClearButtonVisibility();
  }

  function renderProfiles(items) {
    recomputeEffectiveSaves();

    state.currentDisplayed = items;
    if (!dom.profilesList) return;
    dom.profilesList.innerHTML = "";

    if (!items.length) {
      dom.profilesList.innerHTML =
        '<div class="empty-message">No profiles match your search or filters.</div>';
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "profile-card";
      card.tabIndex = 0;
      card.setAttribute("aria-expanded", "false");

      const avatarSrc =
        item.avatar && item.avatar.trim() !== "" ? item.avatar : "images/default-avatar.jpg";
      const avatarPosition = item.avatarPosition || "50% 50%";

      const keywordsHtml = (item.keywords || [])
        .map((kw) => `<span class="keyword-chip" aria-label="Keyword: ${escapeHtml(kw)}">${escapeHtml(kw)}</span>`)
        .join("");

      const headerName =
        state.currentView === "staff" ? (item.name || "Unknown staff") : (item.projectTitle || "Untitled topic");

      const saved =
        state.currentView === "projects" ? isTopicSaved(item.id) : isStaffSaved(item.id);

      if (saved) card.classList.add("is-saved");

      let detailsHtml = "";
      let emailForButton = "";

      if (state.currentView === "staff") {
        emailForButton = item.email || "";

        const topicsHtml = (item.topics || [])
          .map((topic, i, arr) => {
            const ideas = (topic.ideas || []).map((idea) => `<li>${idea}</li>`).join("");
            return `
              <section class="profile-topic">
                <h3>${i + 1}. ${escapeHtml(topic.title || "")}</h3>
                <p>${escapeHtml(topic.description || "")}</p>
                ${ideas
                ? `<p><strong>Within this topic, you could investigate:</strong></p><ul>${ideas}</ul>`
                : ""
              }
              </section>
              ${i < arr.length - 1 ? "<hr class='topic-divider'>" : ""}
            `;
          })
          .join("");

        detailsHtml = topicsHtml || "<p>No project details have been added yet.</p>";
      } else {
        emailForButton = item.email || "";
        const ideasList = (item.ideas || []).map((idea) => `<li class="idea-item">${idea}</li>`).join("");

        detailsHtml = `
          <div class="project-details">
            <p><strong>Supervisor:</strong> ${escapeHtml(item.supervisorName || "Unknown")}</p>
            ${item.projectDescription ? `<p class="project-description">${escapeHtml(item.projectDescription)}</p>` : ""}
            ${ideasList
            ? `<p><strong>Within this project, you could investigate:</strong></p><ul class="idea-list">${ideasList}</ul>`
            : ""
          }
          </div>
        `;
      }

      const saveType = state.currentView === "projects" ? "topic" : "staff";
      const saveBtnHtml = `
        <button
          class="detail-btn detail-btn-save"
          type="button"
          data-save-id="${escapeHtml(item.id)}"
          data-save-type="${saveType}"
          aria-pressed="${saved ? "true" : "false"}"
        >
          <span class="detail-btn-icon">${saved ? "⭐" : "☆"}</span>
          ${saved ? "Saved" : "Save"}
        </button>
      `;

      card.innerHTML = `
        <div class="profile-header">
          <div class="profile-avatar">
            <img
              src="${escapeHtml(avatarSrc)}"
              alt="Profile picture"
              style="width:100%;height:100%;object-fit:cover;object-position:${escapeHtml(avatarPosition)};"
              onerror="this.onerror=null; this.src='images/default-avatar.jpg';"
            />
          </div>

          <div class="profile-main">
            <div class="profile-name">${escapeHtml(headerName)}</div>
            <div class="keyword-row">${keywordsHtml}</div>
          </div>
        </div>

        <div class="profile-details">
          ${detailsHtml}

          <div class="profile-detail-footer">
            <button class="detail-btn detail-btn-email" type="button" data-email="${escapeHtml(emailForButton)}">
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

      dom.profilesList.appendChild(card);
    });
  }

  // ===============================================================
  // UI HELPERS
  // ===============================================================

  function updateSearchClearVisibility() {
    if (!dom.searchWrapper || !dom.searchInput) return;
    dom.searchWrapper.classList.toggle("has-value", !!dom.searchInput.value.trim());
  }

  function updateKeywordClearVisibility() {
    if (!dom.keywordWrapper || !dom.keywordSelect) return;
    dom.keywordWrapper.classList.toggle("has-value", !!dom.keywordSelect.value.trim());
  }

  function updateSavedCount() {
    if (!dom.savedCountEl) return;
    recomputeEffectiveSaves();
    dom.savedCountEl.textContent = String(
      state.currentView === "projects" ? state.effectiveTopicIds.size : state.effectiveStaffIds.size
    );
  }

  function updateSavedClearVisibility() {
    if (!dom.savedWrapper) return;
    recomputeEffectiveSaves();
    const count =
      state.currentView === "projects" ? state.effectiveTopicIds.size : state.effectiveStaffIds.size;
    dom.savedWrapper.classList.toggle("has-value", count > 0);
  }

  function setActiveToggleUI() {
    if (!dom.viewStaffBtn || !dom.viewProjectsBtn) return;

    const staffActive = state.currentView === "staff";
    dom.viewStaffBtn.classList.toggle("is-active", staffActive);
    dom.viewProjectsBtn.classList.toggle("is-active", !staffActive);

    dom.viewStaffBtn.setAttribute("aria-pressed", staffActive ? "true" : "false");
    dom.viewProjectsBtn.setAttribute("aria-pressed", staffActive ? "false" : "true");

    document.body.classList.toggle("view-projects", !staffActive);
    document.body.classList.toggle("view-staff", staffActive);

    // Keep saved toggle state in sync
    if (dom.savedToggleBtn) {
      dom.savedToggleBtn.classList.toggle("is-active", state.showSavedOnly);
      dom.savedToggleBtn.setAttribute("aria-pressed", state.showSavedOnly ? "true" : "false");
    }
  }

  function toggleCard(card) {
    const details = card.querySelector(".profile-details");
    if (!details) return;

    const isOpen = card.classList.contains("open");
    card.classList.toggle("open", !isOpen);
    card.setAttribute("aria-expanded", !isOpen ? "true" : "false");
  }

  // ===============================================================
  // EVENTS (attach once per DOM)
  // ===============================================================

  function attachListeners() {
    if (listenersAttached) return;
    listenersAttached = true;

    // Search input
    if (dom.searchInput) {
      dom.searchInput.addEventListener("input", () => {
        state.search = dom.searchInput.value;
        renderAndUpdate();
      });
    }

    // Keyword select
    if (dom.keywordSelect) {
      dom.keywordSelect.addEventListener("change", () => {
        if (CONFIG.useSuperKeywords) {
          state.superKeyword = dom.keywordSelect.value;
        } else {
          state.keyword = dom.keywordSelect.value;
        }
        renderAndUpdate();
      });
    }

    // Clear search
    if (dom.clearSearchBtn && dom.searchInput) {
      dom.clearSearchBtn.addEventListener("click", () => {
        dom.searchInput.value = "";
        state.search = "";
        renderAndUpdate();
        dom.searchInput.focus();
      });
    }

    // Clear keyword/theme
    if (dom.clearKeywordBtn && dom.keywordSelect) {
      dom.clearKeywordBtn.addEventListener("click", () => {
        dom.keywordSelect.value = "";
        state.keyword = "";
        state.superKeyword = "";
        renderAndUpdate();
        dom.keywordSelect.focus();
      });
    }


    // Saved-only toggle
    if (dom.savedToggleBtn) {
      dom.savedToggleBtn.addEventListener("click", () => {
        state.showSavedOnly = !state.showSavedOnly;
        renderAndUpdate();
      });
    }

    // Clear saved (clears everything)
    if (dom.clearSavedBtn) {
      dom.clearSavedBtn.addEventListener("click", () => {
        state.showSavedOnly = false;
        state.manualStaffIds.clear();
        state.manualTopicIds.clear();
        state.excludedTopicIds.clear();
        persistToStorage();
        renderAndUpdate();
      });
    }

    // View toggles
    if (dom.viewStaffBtn) {
      dom.viewStaffBtn.addEventListener("click", () => {
        state.currentView = "staff";
        // keep filters, don’t wipe them unless you want to
        refreshKeywordsForCurrentView();
        renderAndUpdate();
      });
    }

    if (dom.viewProjectsBtn) {
      dom.viewProjectsBtn.addEventListener("click", () => {
        state.currentView = "projects";
        refreshKeywordsForCurrentView();
        renderAndUpdate();
      });
    }

    // Print
    if (dom.printBtn) {
      dom.printBtn.addEventListener("click", () => {
        printInPlace(state.currentDisplayed);
      });
    }

    // Delegated clicks (cards + footer buttons + save button)
    if (dom.profilesList) {
      dom.profilesList.addEventListener("click", (event) => {
        const saveBtn = event.target.closest(".detail-btn-save");
        if (saveBtn) {
          event.stopPropagation();
          handleSaveClick(saveBtn);
          return;
        }

        const interestBtn = event.target.closest(".detail-btn-interest");
        if (interestBtn) {
          event.stopPropagation();
          window.open(CONFIG.interestFormUrl, "_blank");
          return;
        }

        const emailBtn = event.target.closest(".detail-btn-email");
        if (emailBtn) {
          event.stopPropagation();
          const email = emailBtn.dataset.email || "";
          if (email) {
            window.location.href =
              `mailto:${email}?subject=I%20am%20interested%20in%20your%20research%20project`;
          }
          return;
        }

        const card = event.target.closest(".profile-card");
        if (!card) return;
        toggleCard(card);
      });

      dom.profilesList.addEventListener("keydown", (event) => {
        const card = event.target.closest(".profile-card");
        if (!card) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleCard(card);
        }
      });
    }
  }

  function handleSaveClick(btn) {
    const id = btn.dataset.saveId;
    const type = btn.dataset.saveType; // "topic" | "staff"
    if (!id || !type) return;

    recomputeEffectiveSaves();

    if (type === "staff") {
      // Toggle staff manual save
      if (state.manualStaffIds.has(id)) {
        // Turning OFF staff: remove staff + remove all manual topic saves for them + clear exclusions
        state.manualStaffIds.delete(id);
        state.allProjects.forEach((p) => {
          if (p.supervisorId === id) {
            state.manualTopicIds.delete(p.id);
            state.excludedTopicIds.delete(p.id);
          }
        });
      } else {
        // Turning ON staff: save staff + clear exclusions so all topics show
        state.manualStaffIds.add(id);
        state.allProjects.forEach((p) => {
          if (p.supervisorId === id) state.excludedTopicIds.delete(p.id);
        });
      }

      persistToStorage();
      renderAndUpdate();
      return;
    }

    // type === topic
    const topicId = id;
    const topic = state.allProjects.find((p) => p.id === topicId);
    const staffId = topic?.supervisorId;

    const isEffective = state.effectiveTopicIds.has(topicId);

    if (isEffective) {
      // Turn OFF
      state.manualTopicIds.delete(topicId);

      // If topic is highlighted due to staff save, exclude it
      if (staffId && state.manualStaffIds.has(staffId)) {
        state.excludedTopicIds.add(topicId);
      }
    } else {
      // Turn ON
      state.excludedTopicIds.delete(topicId);
      state.manualTopicIds.add(topicId);
    }

    persistToStorage();
    renderAndUpdate();
  }

  // ===============================================================
  // PRINT (in-place swap, then restore + rebind)
  // ===============================================================

  function printInPlace(items) {
    // Save page HTML and state (DON’T touch localStorage)
    prePrint = {
      title: document.title,
      scrollY: window.scrollY,
      bodyClass: document.body.className,
      bodyHtml: document.body.innerHTML,
      superKeyword: state.superKeyword,

      stateSnapshot: {
        currentView: state.currentView,
        showSavedOnly: state.showSavedOnly,
        search: state.search,
        keyword: state.keyword,
      },
    };

    const dateStr = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const title =
      state.currentView === "staff"
        ? "Research Projects Directory — Staff"
        : "Research Projects Directory — Topics";

    const subtitle =
      state.currentView === "staff"
        ? "Staff profiles and their available dissertation topics"
        : "Dissertation topics (with supervising staff shown)";

    const cards =
      state.currentView === "staff"
        ? buildStaffPrintCards(items)
        : buildTopicPrintCards(items);

    document.title = title;
    document.body.className = "print-mode";
    document.body.innerHTML = `
      <main class="print-wrap">
        <header class="print-header">
          <h1>${escapeHtml(title)}</h1>
          <p class="print-meta">${escapeHtml(subtitle)} • Generated ${escapeHtml(dateStr)} • Showing ${items.length} result(s)</p>
        </header>
        <section class="print-grid">
          ${cards || `<div class="print-card"><p>No results to export (try clearing filters).</p></div>`}
        </section>
      </main>
    `;

    const restoreOnce = once(restoreAfterPrint);

    window.addEventListener("afterprint", restoreOnce, { once: true });
    setTimeout(restoreOnce, 800);

    window.print();
  }

  function restoreAfterPrint() {
    if (!prePrint) return;

    // Restore DOM
    document.body.innerHTML = prePrint.bodyHtml;
    document.body.className = prePrint.bodyClass;
    document.title = prePrint.title;

    // Rebind DOM + listeners
    bindDom();
    applyConfigVisibility();
    listenersAttached = false; // IMPORTANT: allow re-attach after restore
    attachListeners();

    // Restore state snapshot
    const snap = prePrint.stateSnapshot;
    state.currentView = snap.currentView;
    state.showSavedOnly = snap.showSavedOnly;
    state.search = snap.search;
    state.keyword = snap.keyword;
    state.superKeyword = snap.superKeyword || "";

    // Restore input values
    if (dom.searchInput) dom.searchInput.value = state.search;
    if (dom.keywordSelect) dom.keywordSelect.value = state.keyword;
    if (dom.keywordSelect) {
      dom.keywordSelect.value = CONFIG.useSuperKeywords ? state.superKeyword : state.keyword;
    }
    // Enforce config so we don't restore "invisible" filters
    if (!CONFIG.showSearch) {
      state.search = "";
      if (dom.searchInput) dom.searchInput.value = "";
    }

    if (dom.keywordSelect) {
      dom.keywordSelect.disabled = !CONFIG.showKeywordFilter;

      if (!CONFIG.showKeywordFilter) {
        // Only clear the filter state if the user has no other way to control it
        const chipsCanFilter = CONFIG.showKeywordLegend && CONFIG.enableKeywordChipFilter;

        if (!chipsCanFilter) {
          dom.keywordSelect.value = "";
          state.keyword = "";
          state.superKeyword = "";
        } else {
          // Dropdown hidden, but chips still usable: keep state as-is
          dom.keywordSelect.value = "";
        }
      }
    }




    // Keywords + render
    refreshKeywordsForCurrentView();
    renderAndUpdate();

    window.scrollTo(0, prePrint.scrollY);

    prePrint = null;
  }

  function once(fn) {
    let done = false;
    return (...args) => {
      if (done) return;
      done = true;
      fn(...args);
    };
  }

  function buildStaffPrintCards(items) {
    return items
      .map((s) => {
        const keywords = (s.keywords || [])
          .map((kw) => `<span class="print-pill">${escapeHtml(kw)}</span>`)
          .join("");

        const topics = (s.topics || [])
          .map((t, idx) => {
            const ideas = (t.ideas || []).map((i) => `<li>${sanitizeIdeaHtml(i)}</li>`).join("");
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

        const ideas = (p.ideas || []).map((i) => `<li>${sanitizeIdeaHtml(i)}</li>`).join("");

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

  // ===============================================================
  // UTIL
  // ===============================================================

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function sanitizeIdeaHtml(idea) {
    const raw = String(idea ?? "");
    if (!raw.includes("<")) return escapeHtml(raw);

    const escaped = raw
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    return escaped.replace(
      /&lt;a\s+href=(&quot;|&#039;)(.*?)\1\s*(target=(&quot;|&#039;).*?\4)?\s*&gt;(.*?)&lt;\/a&gt;/gi,
      (_m, _q, href, _t, _tq, text) => {
        const safeHref = String(href).startsWith("http") ? href : "#";
        return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
    );
  }
});
