/* CCTK UI Kit — Theme (light/dark)
   Usage:
   - Include this on hub and all tools.
   - Add a button with: data-cctk-theme-toggle
*/

(function () {
  const STORAGE_KEY = "cctk_theme";
  const root = document.documentElement;

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;

    // Respect OS preference if nothing saved
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);

    // Let apps react if they want
    window.dispatchEvent(new CustomEvent("cctk:theme", { detail: { theme } }));
  }

  function toggleTheme() {
    const current = root.getAttribute("data-theme") || "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  // Init immediately
  setTheme(getPreferredTheme());

  // Wire up any toggle buttons
  function bindToggles() {
    const toggles = document.querySelectorAll("[data-cctk-theme-toggle]");
    toggles.forEach(btn => {
      btn.addEventListener("click", toggleTheme);
      btn.setAttribute("aria-label", "Toggle theme");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindToggles);
  } else {
    bindToggles();
  }

  // Expose minimal API
  window.CCTK = window.CCTK || {};
  window.CCTK.theme = { setTheme, toggleTheme, getPreferredTheme };
})();
