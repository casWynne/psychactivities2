/**
 * ============================================================
 * APP ENTRY POINT  (js/app.js)
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("app-title").textContent    = CONFIG.ui.appTitle;
  document.getElementById("app-subtitle").textContent = CONFIG.ui.appSubtitle;
  await BadgeUI.init(
    document.getElementById("control-panel"),
    document.getElementById("badge-preview")
  );
  console.log("CPD Badge Maker ready.");
});
