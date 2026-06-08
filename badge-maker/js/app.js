/**
 * ============================================================
 * APP ENTRY POINT  (js/app.js)
 * ============================================================
 * Bootstraps the Badge Maker application.
 * Runs after all modules and the DOM are ready.
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", async () => {

  // Set app title/subtitle from config
  const titleEl    = document.getElementById("app-title");
  const subtitleEl = document.getElementById("app-subtitle");
  if (titleEl)    titleEl.textContent    = CONFIG.ui.appTitle;
  if (subtitleEl) subtitleEl.textContent = CONFIG.ui.appSubtitle;

  // Reference the main panel and preview containers
  const panelEl   = document.getElementById("control-panel");
  const previewEl = document.getElementById("badge-preview");

  if (!panelEl || !previewEl) {
    console.error("Required DOM elements not found. Check index.html.");
    return;
  }

  // Initialise the UI (builds controls + wires events)
  await BadgeUI.init(panelEl, previewEl);

  console.log("DigiLearn Badge Maker ready.");
});
