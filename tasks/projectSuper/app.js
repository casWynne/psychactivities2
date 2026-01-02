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
            ); allProjects = buildProjectProfilesFromStaff(allStaff);

            // Build keywords based on whichever view is active initially
            const active = getActiveList();
            const allKeywords = getAllUniqueKeywords(active);

            buildKeywordDropdown(allKeywords);
            renderKeywordList(allKeywords);

            updateSearchClearVisibility();
            updateKeywordClearVisibility();

            setActiveToggle();
            renderProfiles(active);
        })



        .catch((err) => {
            console.error(err);
            profilesList.innerHTML =
                '<div class="error-message">Sorry, the project list could not be loaded.</div>';
        });


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

        renderProfiles(active);
    }


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

                    // supervisor fields (still used for avatar + email)
                    supervisorName: staff.name || "Unknown supervisor",
                    email: staff.email || "",
                    avatar: staffAvatar,
                    avatarPosition: staffAvatarPosition,

                    // keywords used for filtering + chips
                    keywords: staffKeywords,

                    // optional: keep for search indexing
                    _rawStaffName: staff.name || "",
                });
            });
        });

        return projects;
    }


    // ---- Rendering ----------------------------------------------------------

    function renderProfiles(items) {
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

                const ideasList = (item.ideas || []).map((idea) => `<li>${idea}</li>`).join("");

                detailsHtml = `
        <p><strong>Supervisor:</strong> ${item.supervisorName || "Unknown"}</p>
        ${item.projectDescription ? `<p>${item.projectDescription}</p>` : ""}
        ${ideasList
                        ? `<p><strong>Within this project, you could investigate:</strong></p>
               <ul>${ideasList}</ul>`
                        : ""
                    }
      `;
            }

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

    function updateKeywordClearVisibility() {
        if (!keywordWrapper) return;
        if (!keywordSelect.value.trim()) {
            keywordWrapper.classList.remove("has-value");
        } else {
            keywordWrapper.classList.add("has-value");
        }
    }

    function applyFilters() {
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

        renderProfiles(filtered);
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


    // ---- Expand / collapse handling ----------------------------------------

    // Use event delegation so re-rendering is safe
    profilesList.addEventListener("click", (event) => {

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
});

