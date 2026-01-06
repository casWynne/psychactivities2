/* ============================================================================
   MOP2627 v2 — Wizard-style Module Planner (mobile-first)
   Steps: Year 1 (L4) -> Year 2 (L5) -> Year 3 (L6) -> Summary
   ============================================================================ */

(() => {
  "use strict";

  // -------------------------------
  // Guard: if this page isn't the app
  // -------------------------------
  const modulesContainer = document.getElementById("modulesContainer");
  if (!modulesContainer) return;

  // -------------------------------
  // DOM
  // -------------------------------
  const dom = {
    modulesContainer,
    // Header text
    stepSubtitle: document.getElementById("stepSubtitle"),
    stepInstruction: document.getElementById("stepInstruction"),
    selectionStatus: document.getElementById("selectionStatus"),

    // Progress
    progressBar: document.getElementById("progressBar"),
    labelY1: document.getElementById("labelY1"),
    labelY2: document.getElementById("labelY2"),
    labelY3: document.getElementById("labelY3"),
    labelSummary: document.getElementById("labelSummary"),

    // Refine controls
    refinePanel: document.getElementById("refinePanel"),
    pathwayFilter: document.getElementById("pathwayFilter"),
    searchInput: document.getElementById("searchInput"),
    clearFiltersBtn: document.getElementById("clearFiltersBtn"),

    // Nav
    backBtn: document.getElementById("backBtn"),
    nextBtn: document.getElementById("nextBtn"),
    printBtn: document.getElementById("printBtn"),

    // Clear actions
    clearSelectionsBtn: document.getElementById("clearSelectionsBtn"),
    clearLocalBtn: document.getElementById("clearLocalBtn"),
  };

  // -------------------------------
  // Data + State
  // -------------------------------
  let allModules = [];
  const selectedModules = [];

  const levelLimits = { 4: 1, 5: 2, 6: 3 };
  const steps = [4, 5, 6, "summary"]; // order
  let currentStepIndex = 0; // start on Level 4

  const STORAGE_KEY = "selectedModules"; // stores array of IDs

  // -------------------------------
  // Init
  // -------------------------------
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindUI();

    fetch("modules.json")
      .then((r) => r.json())
      .then((data) => {
        allModules = Array.isArray(data) ? data : [];

        // Restore selections from localStorage -> rehydrate to full objects
        restoreSelections();

        // Start on Year 1 by default
        render();
      })
      .catch((err) => {
        console.error("Failed to load modules.json", err);
        dom.modulesContainer.innerHTML =
          `<div class="hint">Could not load module data. Please check <code>modules.json</code>.</div>`;
      });
  }

  function bindUI() {
    // Refine controls
    dom.pathwayFilter?.addEventListener("change", render);
    dom.searchInput?.addEventListener("input", render);

    dom.clearFiltersBtn?.addEventListener("click", () => {
      if (dom.pathwayFilter) dom.pathwayFilter.value = "";
      if (dom.searchInput) dom.searchInput.value = "";
      render();
    });

    // Nav
    dom.backBtn?.addEventListener("click", () => {
      if (currentStepIndex > 0) {
        currentStepIndex--;
        render(true);
      }
    });

    dom.nextBtn?.addEventListener("click", () => {
      const step = steps[currentStepIndex];
      if (step === "summary") return;

      // Gate next until the current year requirement is met
      if (!isStepComplete(step)) return;

      if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        render(true);
      }
    });

    dom.printBtn?.addEventListener("click", () => {
      const step = steps[currentStepIndex];
      if (step === "summary") {
        printSummary();
      } else {
        printYear(step);
      }
    });

    // Clear all (in-memory + local storage)
    dom.clearSelectionsBtn?.addEventListener("click", () => {
      selectedModules.length = 0;
      persistSelections();

      // Optional: reset refine filters too
      if (dom.pathwayFilter) dom.pathwayFilter.value = "";
      if (dom.searchInput) dom.searchInput.value = "";

      // Reset wizard back to Year 1
      currentStepIndex = 0;

      render(true); // scroll to top
    });

  }

  // -------------------------------
  // Restore + Persist
  // -------------------------------
  function restoreSelections() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const savedIds = JSON.parse(raw);
      if (!Array.isArray(savedIds)) return;

      const restored = allModules.filter((m) => savedIds.includes(m.id));
      selectedModules.length = 0;
      selectedModules.push(...restored);
    } catch {
      // ignore bad storage
    }
  }

  function persistSelections() {
    const ids = selectedModules.map((m) => m.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  // -------------------------------
  // Rendering
  // -------------------------------
  function render(scrollTop = false) {
    const step = steps[currentStepIndex];

    updateHeader(step);
    updateSelectionStatus();

    if (step === "summary") {
      if (dom.refinePanel) dom.refinePanel.style.display = "none";
      renderSummary();
    } else {
      if (dom.refinePanel) dom.refinePanel.style.display = "";
      renderYear(step);
    }

    updateNav(step);

    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function updateHeader(step) {
    // Subtitle & instruction
    if (step === "summary") {
      if (dom.stepSubtitle) dom.stepSubtitle.textContent = "Summary";
      if (dom.stepInstruction)
        dom.stepInstruction.innerHTML =
          `Review your selections and print your plan.`;
      setActiveProgressLabel("summary");
      setProgressPercent(100);
      return;
    }

    const yearNum = step === 4 ? 1 : step === 5 ? 2 : 3;
    const need = levelLimits[step];
    const chosen = countSelectedPerLevel(step);

    if (dom.stepSubtitle) dom.stepSubtitle.textContent = `Year ${yearNum} (Level ${step})`;

    if (dom.stepInstruction) {
      if (step === 5) {
        const s1 = countSelectedBySemester(5, 1);
        const s2 = countSelectedBySemester(5, 2);

        dom.stepInstruction.innerHTML =
          `Pick <strong>2</strong> modules for Year 2 — ` +
          `<strong>one in Sem 1</strong> and <strong>one in Sem 2</strong>. ` +
          `You’ve picked <strong>${chosen}</strong> of <strong>2</strong> ` +
          `(Sem 1: <strong>${s1}</strong>/1, Sem 2: <strong>${s2}</strong>/1).`;
      } else {
        dom.stepInstruction.innerHTML =
          `Pick <strong>${need}</strong> module${need === 1 ? "" : "s"} for Year ${yearNum} — ` +
          `you’ve picked <strong>${chosen}</strong> of <strong>${need}</strong>.`;
      }
    }


    setActiveProgressLabel(step);
    // Progress (0%, 33%, 66%, 100% feel)
    const pct = step === 4 ? 0 : step === 5 ? 33 : 66;
    setProgressPercent(pct);
  }

  function setProgressPercent(pct) {
    if (!dom.progressBar) return;
    dom.progressBar.style.width = `${pct}%`;
  }

  function setActiveProgressLabel(step) {
    const labels = [dom.labelY1, dom.labelY2, dom.labelY3, dom.labelSummary];
    labels.forEach((el) => el?.classList.remove("is-active"));

    if (step === 4) dom.labelY1?.classList.add("is-active");
    else if (step === 5) dom.labelY2?.classList.add("is-active");
    else if (step === 6) dom.labelY3?.classList.add("is-active");
    else dom.labelSummary?.classList.add("is-active");
  }

  function updateSelectionStatus() {
    if (!dom.selectionStatus) return;

    const l4 = countSelectedPerLevel(4);
    const l5 = countSelectedPerLevel(5);
    const l6 = countSelectedPerLevel(6);

    const l4Status = l4 >= levelLimits[4] ? `${l4}/1 ✅` : `${l4}/1`;
    const l5Status = l5 >= levelLimits[5] ? `${l5}/2 ✅` : `${l5}/2`;
    const l6Status = l6 >= levelLimits[6] ? `${l6}/3 ✅` : `${l6}/3`;

    dom.selectionStatus.textContent = `L4: ${l4Status} | L5: ${l5Status} | L6: ${l6Status}`;
  }

  function updateNav(step) {
    // Back button visibility
    if (dom.backBtn) {
      const atStart = currentStepIndex === 0;

      dom.backBtn.disabled = atStart;

      // Make it clearly visible but subtly inactive
      dom.backBtn.style.opacity = atStart ? "1" : "1";
      dom.backBtn.style.filter = atStart ? "grayscale(0.6)" : "none";
    }

    // Next button rules
    if (dom.nextBtn) {
      if (step === "summary") {
        dom.nextBtn.disabled = true;
        dom.nextBtn.style.opacity = "0.5";
        dom.nextBtn.textContent = "Next →";
      } else {
        const complete = isStepComplete(step);
        dom.nextBtn.disabled = !complete;
        dom.nextBtn.style.opacity = complete ? "1" : "0.6";

        const nextLabel =
          step === 4 ? "Next: Year 2 →" :
            step === 5 ? "Next: Year 3 →" :
              "Next: Summary →";
        dom.nextBtn.textContent = nextLabel;
      }
    }

    // Print label
    if (dom.printBtn) {
      dom.printBtn.textContent = step === "summary" ? "🖨️ Print Summary" : "🖨️ Print This Year";
    }
  }

  // -------------------------------
  // Step completeness
  // -------------------------------
  function isStepComplete(level) {
    // Default rule: meet the limit for that year
    if (level !== 5) {
      return countSelectedPerLevel(level) >= levelLimits[level];
    }

    // Level 5 special rule:
    // 2 total, with 1 in Sem 1 and 1 in Sem 2
    const total = countSelectedPerLevel(5);
    const s1 = countSelectedBySemester(5, 1);
    const s2 = countSelectedBySemester(5, 2);

    return total >= 2 && s1 >= 1 && s2 >= 1;
  }


  // -------------------------------
  // Year render
  // -------------------------------
  function renderYear(level) {
    const pathway = (dom.pathwayFilter?.value || "").toLowerCase();
    const searchTerm = (dom.searchInput?.value || "").toLowerCase();

    const filtered = allModules
      .filter((m) => m.level === level)
      .filter((m) => {
        const matchesPathway = !pathway || m.pathway.toLowerCase().includes(pathway);
        const matchesSearch =
          !searchTerm ||
          m.title.toLowerCase().includes(searchTerm) ||
          m.description.toLowerCase().includes(searchTerm) ||
          (m.id && String(m.id).toLowerCase().includes(searchTerm));
        return matchesPathway && matchesSearch;
      });

    renderModules(filtered, level);
  }

  // -------------------------------
  // Summary render
  // -------------------------------
  function renderSummary() {
    const y1 = selectedModules.filter((m) => m.level === 4);
    const y2 = selectedModules.filter((m) => m.level === 5);
    const y3 = selectedModules.filter((m) => m.level === 6);

    const html = `
      <div class="summary">
        ${renderSummaryGroup("Year 1 (Level 4)", y1, 4)}
        ${renderSummaryGroup("Year 2 (Level 5)", y2, 5)}
        ${renderSummaryGroup("Year 3 (Level 6)", y3, 6)}
        <div class="hint" style="margin-top:14px;">
          Tip: Use <strong>Back</strong> to change selections for a year, then return here to print.
        </div>
      </div>
    `;

    dom.modulesContainer.innerHTML = html;

    // Bind remove buttons
    dom.modulesContainer.querySelectorAll("[data-remove-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-remove-id");
        if (!id) return;
        removeSelectionById(id);
        render();
      });
    });
  }

  function renderSummaryGroup(title, items, level) {
    const need = levelLimits[level];
    const chosen = items.length;

    const badge = chosen >= need
      ? `<span style="font-weight:800;">${chosen}/${need} ✅</span>`
      : `<span style="font-weight:800;">${chosen}/${need}</span>`;

    const rows = items.length
      ? items.map((m) => `
          <div class="summary-card">
            <div class="summary-card-top">
              <div>
                <div class="summary-title">${escapeHtml(m.title)} <span class="summary-code">(${escapeHtml(m.id)})</span></div>
                <div class="summary-meta">Credits: ${escapeHtml(String(m.credits))} • ${escapeHtml(m.timetable)} • ${escapeHtml(m.pathway)}</div>
              </div>
              <button class="summary-remove" type="button" data-remove-id="${escapeAttr(m.id)}" aria-label="Remove ${escapeAttr(m.title)}">
                Remove
              </button>
            </div>
          </div>
        `).join("")
      : `<div class="hint">No modules selected for this year yet.</div>`;

    return `
      <section class="summary-group">
        <div class="summary-group-header">
          <h2 class="summary-h2">${escapeHtml(title)}</h2>
          ${badge}
        </div>
        ${rows}
      </section>
    `;
  }

  // Add minimal styling for summary cards using existing CSS context
  // (We keep this lightweight to avoid a CSS rewrite right now.)
  const summaryStyle = document.createElement("style");
  summaryStyle.textContent = `
    .summary-group { margin-bottom: 18px; }
    .summary-group-header { display:flex; justify-content:space-between; align-items:baseline; gap:10px; }
    .summary-h2 { margin: 10px 0; font-size: 1.05rem; }
    .summary-card { background:#fff; border:1px solid rgba(0,0,0,0.10); border-radius:14px; padding:12px; margin-bottom:10px; box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
    .summary-card-top { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; }
    .summary-title { font-weight: 800; line-height:1.2; }
    .summary-code { font-weight: 700; opacity: 0.7; }
    .summary-meta { margin-top:6px; font-size:0.92rem; color:#4b5563; }
    .summary-remove { border:none; background: rgba(0,0,0,0.06); padding:10px 10px; border-radius:12px; cursor:pointer; font-weight:700; }
  `;
  document.head.appendChild(summaryStyle);

  // -------------------------------
  // Module list render (cards)
  // -------------------------------
  function renderModules(modules, currentLevel) {
    dom.modulesContainer.innerHTML = "";

    const yearComplete = isStepComplete(currentLevel);

    modules.forEach((module) => {
      const isSelected = selectedModules.some((m) => m.id === module.id);

      const levelCount = countSelectedPerLevel(module.level);
      const limitReached = levelCount >= levelLimits[module.level];
      const timetableClash = hasTimetableConflict(module.level, module.timetable);

      const sem = getSemesterFromTimetable(module.timetable);
      const semLabel = sem ? `Sem ${sem}` : "";

      // Year 2 special rule blocking (already have one in that semester)
      const semesterRuleBlocked =
        module.level === 5 &&
        !isSelected &&
        sem &&
        countSelectedBySemester(5, sem) >= 1;

      // NEW: once year requirement is met, lock all other modules for that year
      const yearCompleteBlocked =
        module.level === currentLevel && yearComplete && !isSelected;

      const isBlocked = !isSelected && (
        yearCompleteBlocked ||
        limitReached ||
        timetableClash ||
        semesterRuleBlocked
      );

      const moduleElement = document.createElement("div");
      moduleElement.className = "module-collapsible";
      if (isSelected) moduleElement.classList.add("selected");
      if (isBlocked) moduleElement.classList.add("disabled");

      const toggleId = `toggle-${module.id}`;
      const contentId = `content-${module.id}`;
      const pathwayKey = module.pathwayKey || "general";

      moduleElement.innerHTML = `
<div class="module-header pathway-${escapeAttr(pathwayKey)}"
       role="button"
       tabindex="0"
       aria-expanded="false"
       aria-controls="${escapeAttr(contentId)}"
       id="${escapeAttr(toggleId)}">

    <h3>${escapeHtml(module.title)}</h3>

    <div class="module-badges">
      ${semLabel ? `<span class="module-semester">${escapeHtml(semLabel)}</span>` : ""}
      <span class="module-level">Level ${escapeHtml(String(module.level))}</span>

      ${isSelected ? `
        <button
          class="module-clear-btn"
          type="button"
          aria-label="Remove ${escapeAttr(module.title)}">
          ✕
        </button>
      ` : ""}
    </div>
  </div>

  <div class="module-body"
       id="${escapeAttr(contentId)}"
       role="region"
       aria-labelledby="${escapeAttr(toggleId)}">

    <p><strong>Code:</strong> ${escapeHtml(module.id)}</p>
    <p><strong>Credits:</strong> ${escapeHtml(String(module.credits))}</p>
    <p><strong>Pathway:</strong> ${escapeHtml(module.pathway)}</p>
    <p class="description">${escapeHtml(module.description)}</p>
    <p><strong>Staff:</strong> ${escapeHtml(module.staff)}</p>
    <p><strong>Timetable:</strong> ${escapeHtml(module.timetable)}</p>
    <p><strong>Assessment:</strong> ${escapeHtml(module.assessment)}</p>

    <button class="select-button" type="button">
      ${isSelected ? "Deselect" : "Select"}
    </button>

    <div class="module-reason"></div>
  </div>
`;


      const header = moduleElement.querySelector(".module-header");
      const body = moduleElement.querySelector(".module-body");
      const button = moduleElement.querySelector(".select-button");
      const reasonDiv = moduleElement.querySelector(".module-reason");
      const clearBtn = moduleElement.querySelector(".module-clear-btn");

      if (clearBtn) {
        clearBtn.addEventListener("click", (e) => {
          e.stopPropagation(); // IMPORTANT: don’t toggle the accordion
          removeSelectionById(module.id);
          persistSelections();
          render();
        });
      }

      // Expand/collapse still allowed (even if disabled)
      header.addEventListener("click", () => {
        body.classList.toggle("show");
        const expanded = header.getAttribute("aria-expanded") === "true";
        header.setAttribute("aria-expanded", (!expanded).toString());
      });

      header.addEventListener("keyup", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          header.click();
          e.preventDefault();
        }
      });

      // Blocked explanation (hide button + show reason)
      if (!isSelected && isBlocked) {
        button.style.display = "none";

        if (yearCompleteBlocked) {
          reasonDiv.textContent = `Year complete — deselect a module to change your choice.`;
        } else if (semesterRuleBlocked) {
          reasonDiv.textContent =
            `Year 2 rule: you need one Sem 1 and one Sem 2 module. You already picked a Sem ${sem} module.`;
        } else if (limitReached) {
          reasonDiv.textContent = `You’ve already picked the maximum for this year.`;
        } else if (timetableClash) {
          const conflict = getConflictingModule(module.level, module.timetable);
          reasonDiv.textContent = conflict
            ? `Timetable conflict with "${conflict.title}".`
            : `Timetable conflict.`;
        }
      } else {
        button.style.display = "block";
        reasonDiv.textContent = "";
      }

      // Select / deselect
      button.addEventListener("click", () => {
        toggleSelection(module);
        persistSelections();
        render();
      });

      dom.modulesContainer.appendChild(moduleElement);
    });

    if (modules.length === 0) {
      dom.modulesContainer.innerHTML =
        `<div class="hint">No modules match your refine filters.</div>`;
    }
  }



  // -------------------------------
  // Selection helpers
  // -------------------------------
  function toggleSelection(module) {
    const idx = selectedModules.findIndex((m) => m.id === module.id);

    if (idx !== -1) {
      selectedModules.splice(idx, 1);
      return;
    }

    const level = module.level;
    const levelCount = countSelectedPerLevel(level);

    if (levelCount >= levelLimits[level]) {
      alert(`You can only select ${levelLimits[level]} module(s) for this year.`);
      return;
    }

    // Level 5: must be one in Sem 1 and one in Sem 2
    if (level === 5) {
      const sem = getSemesterFromTimetable(module.timetable);

      if (!sem) {
        alert("This module doesn’t have a clear semester listed, so it can’t be used for the Year 2 semester rule.");
        return;
      }

      const alreadyInSameSem = countSelectedBySemester(5, sem) >= 1;
      if (alreadyInSameSem) {
        alert(`For Year 2 you must choose one module in Sem 1 and one in Sem 2 (you already picked a Sem ${sem} module).`);
        return;
      }
    }

    if (hasTimetableConflict(level, module.timetable)) {
      const conflict = getConflictingModule(level, module.timetable);
      alert(conflict ? `That clashes with: ${conflict.title}` : `That module has a timetable clash.`);
      return;
    }

    selectedModules.push(module);
  }

  function removeSelectionById(id) {
    const idx = selectedModules.findIndex((m) => m.id === id);
    if (idx !== -1) {
      selectedModules.splice(idx, 1);
      persistSelections();
    }
  }

  function countSelectedPerLevel(level) {
    return selectedModules.filter((m) => m.level === level).length;
  }

  function getSemesterFromTimetable(timetable) {
    // expects strings like "Sem 1: Tue 14–16"
    const m = String(timetable || "").match(/Sem\s*([12])/i);
    return m ? Number(m[1]) : null; // 1 | 2 | null
  }

  function countSelectedBySemester(level, sem) {
    return selectedModules.filter(
      (m) => m.level === level && getSemesterFromTimetable(m.timetable) === sem
    ).length;
  }

  function hasTimetableConflict(level, timetable) {
    return selectedModules.some(
      (m) => m.level === level && m.timetable === timetable
    );
  }

  function getConflictingModule(level, timetable) {
    return selectedModules.find(
      (m) => m.level === level && m.timetable === timetable
    );
  }

  // -------------------------------
  // Print (clean HTML)
  // -------------------------------
  function printYear(level) {
    const yearNum = level === 4 ? 1 : level === 5 ? 2 : 3;
    const picks = selectedModules.filter((m) => m.level === level);

    const title = `Psychology Module Planner — Year ${yearNum} Selections`;
    const html = buildPrintHtml({
      title,
      subtitle: `Year ${yearNum} (Level ${level})`,
      groups: [
        {
          heading: `Selected modules (${picks.length}/${levelLimits[level]})`,
          modules: picks,
        },
      ],
    });

    openPrintWindow(html);
  }

  function printSummary() {
    const y1 = selectedModules.filter((m) => m.level === 4);
    const y2 = selectedModules.filter((m) => m.level === 5);
    const y3 = selectedModules.filter((m) => m.level === 6);

    const html = buildPrintHtml({
      title: "Psychology Module Planner — Summary",
      subtitle: "Your selected modules (guidance only)",
      groups: [
        { heading: `Year 1 (Level 4) — ${y1.length}/${levelLimits[4]}`, modules: y1 },
        { heading: `Year 2 (Level 5) — ${y2.length}/${levelLimits[5]}`, modules: y2 },
        { heading: `Year 3 (Level 6) — ${y3.length}/${levelLimits[6]}`, modules: y3 },
      ],
    });

    openPrintWindow(html);
  }

  function buildPrintHtml({ title, subtitle, groups }) {
    const now = new Date();
    const stamp = now.toLocaleString();

    const groupHtml = groups.map((g) => `
      <section class="group">
        <h2>${escapeHtml(g.heading)}</h2>
        ${g.modules.length ? g.modules.map(renderPrintModule).join("") : `<p class="muted">No modules selected.</p>`}
      </section>
    `).join("");

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
        <style>
          :root { --text:#111827; --muted:#6b7280; --border:rgba(0,0,0,0.12); }
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 24px; color: var(--text); }
          header { border-bottom: 2px solid var(--border); padding-bottom: 12px; margin-bottom: 18px; }
          h1 { margin: 0; font-size: 1.4rem; }
          .sub { margin: 6px 0 0; color: var(--muted); }
          .meta { margin-top: 8px; color: var(--muted); font-size: 0.92rem; }
          .group { margin: 18px 0; }
          h2 { margin: 0 0 10px; font-size: 1.05rem; }
          .card { border: 1px solid var(--border); border-radius: 12px; padding: 12px; margin: 10px 0; break-inside: avoid; }
          .title { font-weight: 800; margin: 0; }
          .kv { margin-top: 6px; font-size: 0.95rem; }
          .muted { color: var(--muted); }
          .disclaimer { margin-top: 22px; padding-top: 12px; border-top: 2px solid var(--border); font-size: 0.92rem; color: var(--muted); }
          @media print {
            body { margin: 12mm; }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>${escapeHtml(title)}</h1>
          <p class="sub">${escapeHtml(subtitle)}</p>
          <div class="meta">Generated: ${escapeHtml(stamp)}</div>
        </header>

        ${groupHtml}

        <p class="disclaimer">
          This planner is for guidance only. It does not submit your module choices — please register via the university system.
        </p>

        <script>
          window.onload = () => window.print();
        </script>
      </body>
      </html>
    `;
  }

  function renderPrintModule(m) {
    return `
      <div class="card">
        <p class="title">${escapeHtml(m.title)} <span class="muted">(${escapeHtml(m.id)})</span></p>
        <div class="kv"><strong>Level:</strong> ${escapeHtml(String(m.level))} &nbsp; • &nbsp; <strong>Credits:</strong> ${escapeHtml(String(m.credits))}</div>
        <div class="kv"><strong>Pathway:</strong> ${escapeHtml(m.pathway)}</div>
        <div class="kv"><strong>Timetable:</strong> ${escapeHtml(m.timetable)}</div>
        <div class="kv"><strong>Assessment:</strong> ${escapeHtml(m.assessment)}</div>
        <div class="kv"><strong>Staff:</strong> ${escapeHtml(m.staff)}</div>
      </div>
    `;
  }

  function openPrintWindow(html) {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      alert("Pop-up blocked. Please allow pop-ups to print.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  // -------------------------------
  // Utils: escaping (prevents injection from JSON)
  // -------------------------------
  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(str) {
    // Same as escapeHtml, but keep it explicit for attributes
    return escapeHtml(str).replaceAll("`", "&#096;");
  }
})();
