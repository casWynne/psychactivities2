// app.js


document.addEventListener("DOMContentLoaded", () => {

    // === CONFIG ====================================================
    const showFilters = true;   // <-- toggle this to show/hide the filter bar
    // ===============================================================

    const profilesList = document.getElementById("profilesList");
    const searchInput = document.getElementById("searchInput");
    const keywordSelect = document.getElementById("keywordSelect");
    const searchWrapper = document.querySelector(".search-wrapper");
    const keywordWrapper = document.querySelector(".keyword-wrapper");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const clearKeywordBtn = document.getElementById("clearKeywordBtn");
    const interestFormUrl = "https://forms.office.com/e/UT6nby4S1n";
    const toolbar = document.querySelector(".toolbar");
    if (!showFilters && toolbar) {
        toolbar.style.display = "none";
        searchInput.disabled = true;
        keywordSelect.disabled = true;
    }


    let allProfiles = [];

    // ---- Fetch JSON data ----------------------------------------------------
    fetch("data/staff-projects.json")
        .then((res) => {
            if (!res.ok) {
                throw new Error("Failed to load staff-projects.json");
            }
            return res.json();
        })
        .then((data) => {
            // Expecting { staff: [...] }
            allProfiles = data.staff || [];
            buildKeywordDropdown(allProfiles);
            updateSearchClearVisibility();
            updateKeywordClearVisibility();
            renderProfiles(allProfiles);
        })
        .catch((err) => {
            console.error(err);
            profilesList.innerHTML =
                '<div class="error-message">Sorry, the project list could not be loaded.</div>';
        });

    // ---- Rendering ----------------------------------------------------------

    function renderProfiles(profiles) {
        profilesList.innerHTML = "";

        if (!profiles.length) {
            profilesList.innerHTML =
                '<div class="empty-message">No profiles match your search or filters.</div>';
            return;
        }

        profiles.forEach((profile, index) => {
            const card = document.createElement("article");
            card.className = "profile-card";
            card.setAttribute("tabindex", "0");
            card.setAttribute("data-index", index);
            card.setAttribute("aria-expanded", "false");

            // avatar content: prefer image -> emoji -> initials
            // Avatar: use profile.avatar or fall back to default image
            const avatarSrc = profile.avatar && profile.avatar.trim() !== ""
                ? profile.avatar
                : "images/default-avatar.jpg";

            const avatarPosition = profile.avatarPosition || "50% 50%";

            const avatarInner = `
                <img
                    src="${avatarSrc}"
                    alt="Profile picture of ${profile.name}"
                    style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    object-position:${avatarPosition};
                    "
                    onerror="this.onerror=null; this.src='images/default-avatar.jpg';"
                />
                `;

            const keywordsHtml = (profile.keywords || [])
                .map(
                    (kw) =>
                        `<span class="keyword-chip" aria-label="Keyword: ${kw}">${kw}</span>`
                )
                .join("");

            const topicsHtml = (profile.topics || [])
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

            card.innerHTML = `
        <div class="profile-header">
          <div class="profile-avatar">
            ${avatarInner}
          </div>

          <div class="profile-main">
            <div class="profile-name">${profile.name}</div>
            <div class="keyword-row">
              ${keywordsHtml}
            </div>
          </div>
        </div>

        <div class="profile-details">
          ${topicsHtml || "<p>No project details have been added yet.</p>"}

        <div class="profile-detail-footer">
        <button
            class="detail-btn detail-btn-email"
            type="button"
            data-email="${profile.email || ""}"
        >
            <span class="detail-btn-icon">❓</span>
            Questions? Email me
        </button>
        <button class="detail-btn detail-btn-interest" type="button">
            <span class="detail-btn-icon">👍</span>
            Interested in this topic
        </button>
        </div>

      `;

            profilesList.appendChild(card);
        });
    }

    // ---- Filtering ----------------------------------------------------------
    function buildKeywordDropdown(profiles) {
        const allKeywords = new Set();

        profiles.forEach((profile) => {
            (profile.keywords || []).forEach((kw) => {
                if (kw && kw.trim() !== "") {
                    allKeywords.add(kw.trim());
                }
            });
        });

        const sorted = Array.from(allKeywords).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" })
        );

        // Clear existing options except the first "All keywords"
        keywordSelect.innerHTML = '<option value="">All keywords</option>';

        sorted.forEach((kw) => {
            const opt = document.createElement("option");
            opt.value = kw;
            opt.textContent = kw;
            keywordSelect.appendChild(opt);
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

        const filtered = allProfiles.filter((profile) => {
            const topicsText = (profile.topics || [])
                .map((t) => {
                    const ideasText = (t.ideas || []).join(" ");
                    return `${t.title} ${t.description} ${ideasText}`;
                })
                .join(" ");

            const allText =
                [
                    profile.name,
                    (profile.keywords || []).join(" "),
                    topicsText
                ]
                    .join(" ")
                    .toLowerCase() || "";

            const keywordText = (profile.keywords || []).join(" ").toLowerCase();

            const matchesSearch = !term || allText.includes(term);
            const matchesKeyword =
                !selectedKeyword || keywordText.includes(selectedKeyword);

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
});
