// Refactored: dynamically populate Programme Info from data/programme_info.json
document.addEventListener("DOMContentLoaded", () => {
  const mainContent = document.querySelector("main");
  const nav = document.querySelector("nav");

  const state = {
    data: null,
    modulesById: new Map(),
    staffById: new Map(),
    moduleCounts: new Map()
  };

  const introContent = {
    title: "Welcome to Psychology at Leeds Trinity University",
    description: `
      Discover a variety of Psychology programmes designed to provide you with the skills,
      knowledge, and experience you need for a rewarding career in psychology. All our undergraduate courses
      are accredited by the British Psychological Society (BPS), ensuring you gain a high-quality
      education that meets professional standards.
      <img src="../assets/BPS-Logo.png" alt="BPS Logo" class="bps-logo">
      At Leeds Trinity, we combine theory with practice, giving you hands-on experience through
      work experience and practical projects. Explore topics like Counselling, Forensic
      Psychology, Sport Psychology, and Child Development in our supportive learning environment.
      <br><br>
      To start exploring our programmes, select one of the options above.
    `
  };

  function assetPath(path) {
    if (!path) return path;
    // Ensure assets referenced from data resolve relative to tasks/programme_info.html
    return path.startsWith("../") ? path : `../${path.replace(/^\\+|^\/+/, "")}`;
  }

  async function loadData() {
    try {
      const res = await fetch("programme_info.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.data = data;

      // Index modules and staff by id
      state.modulesById = new Map((data.modules || []).map(m => [m.id, m]));
      state.staffById = new Map((data.staff || []).map(s => [s.id, s]));

      // Compute how many programmes include each module id
      const counts = new Map();
      (data.programmes || []).forEach(p => {
        (p.modules || []).forEach(id => {
          counts.set(id, (counts.get(id) || 0) + 1);
        });
      });
      state.moduleCounts = counts;

      renderProgrammeNav(data.programmes || []);
    } catch (err) {
      mainContent.innerHTML = `
        <h2>Programme Information</h2>
        <p>Sorry, there was a problem loading programme data.</p>
      `;
      // eslint-disable-next-line no-console
      console.error("Failed to load programme_info.json", err);
    }
  }

  function renderProgrammeNav(programmes) {
    if (!nav) return;
    nav.innerHTML = "";
    programmes.forEach(p => {
      const btn = document.createElement("button");
      btn.className = "programme-option";
      btn.textContent = p.name;
      btn.dataset.programmeId = String(p.id);
      btn.addEventListener("click", () => {
        updateMainContent(p);
        setInactivityTimeout();
      });
      nav.appendChild(btn);
    });
  }

  function renderDetailsBlocks(blocks) {
    if (!Array.isArray(blocks)) return "";
    return blocks.map(b => {
      if (b.type === "header") {
        return `<h3>${b.content}</h3>`;
      }
      if (b.type === "text") {
        return `<p>${b.content}</p>`;
      }
      if (b.type === "image") {
        const src = assetPath(b.src);
        const alt = b.alt || "";
        return `<img src="${src}" alt="${alt}">`;
      }
      return "";
    }).join("");
  }

  function createModuleSection(mod, shared) {
    const badge = shared
      ? '<span class="shared-module">(Shared)</span>'
      : '<span class="unique-module">(Unique)</span>';
    const detailBlocks = renderDetailsBlocks(mod.details);
    return `
      <div class="module">
        <button class="collapsible">${mod.name} ${badge}</button>
        <div class="module-content">
          ${mod.description ? `<p>${mod.description}</p>` : ""}
          ${mod.assessment ? `<h3>Assessments</h3><p>${mod.assessment}</p>` : ""}
          ${detailBlocks}
        </div>
        <div class="gap"></div>
      </div>
    `;
  }

  function updateMainContent(programme) {
    let uniqueModulesHTML = "";
    let sharedModulesHTML = "";

    const moduleIds = programme.modules || [];
    moduleIds.forEach(id => {
      const mod = state.modulesById.get(id);
      if (!mod) return;
      const isShared = (state.moduleCounts.get(id) || 0) > 1;
      const html = createModuleSection(mod, isShared);
      if (isShared) sharedModulesHTML += html; else uniqueModulesHTML += html;
    });

    const staff = state.staffById.get(programme.staff);
    const staffHTML = staff ? `
      <h3>Programme Staff</h3>
      <p><img src="${assetPath(staff.picture)}" alt="${staff.name}" style="max-width:120px; vertical-align:middle; margin-right:10px;"> ${staff.name}</p>
    ` : "";

    const detailsHTML = renderDetailsBlocks(programme.details);

    mainContent.innerHTML = `
      <h2>${programme.name}</h2>
      ${detailsHTML}
      ${staffHTML}
      ${moduleIds.length ? `<h3>Unique Programme Modules</h3>` : ""}
      ${uniqueModulesHTML || (moduleIds.length ? "<p>No unique modules for this programme.</p>" : "")}
      ${moduleIds.length ? `<h3>Shared Modules</h3>` : ""}
      ${sharedModulesHTML || (moduleIds.length ? "<p>No shared modules for this programme.</p>" : "")}
      <button class="back-button">Back</button>
    `;

    // Collapsible behaviour
    const collapsibleButtons = document.querySelectorAll(".collapsible");
    collapsibleButtons.forEach(button => {
      button.addEventListener("click", function () {
        this.classList.toggle("active");
        const content = this.nextElementSibling;
        content.style.display = content.style.display === "block" ? "none" : "block";
      });
    });

    // Back button -> intro
    const backButton = document.querySelector(".back-button");
    if (backButton) {
      backButton.addEventListener("click", () => {
        loadIntroContent();
      });
    }
  }

  function loadIntroContent() {
    mainContent.innerHTML = `
      <h2>${introContent.title}</h2>
      <p>${introContent.description}</p>
    `;
  }

  function setInactivityTimeout() {
    clearTimeout(window.inactivityTimeout);
    window.inactivityTimeout = setTimeout(() => {
      loadIntroContent();
    }, 300000); // 5 minutes
  }

  // Initial render
  loadIntroContent();
  loadData();
  setInactivityTimeout();
});

