/* ==========================================================================
   CCTK Shared JS
   Combines: theme toggle, UI helpers
   Include with: <script defer src="../shared/cctk-nav.js"></script>
   ========================================================================== */

/* ---------- Theme (light / dark) ---------- */
(function () {
  const STORAGE_KEY = "cctk_theme";
  const root = document.documentElement;

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    window.dispatchEvent(new CustomEvent("cctk:theme", { detail: { theme } }));
  }

  function toggleTheme() {
    const current = root.getAttribute("data-theme") || "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  // Apply immediately to avoid flash
  setTheme(getPreferredTheme());

  function bindToggles() {
    document.querySelectorAll("[data-cctk-theme-toggle]").forEach(btn => {
      btn.addEventListener("click", toggleTheme);
      btn.setAttribute("aria-label", "Toggle theme");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindToggles);
  } else {
    bindToggles();
  }

  window.CCTK = window.CCTK || {};
  window.CCTK.theme = { setTheme, toggleTheme, getPreferredTheme };
})();

/* ---------- UI helpers ---------- */
(function () {
  window.CCTK = window.CCTK || {};

  function qs(sel, el = document) { return el.querySelector(sel); }
  function qsa(sel, el = document) { return Array.from(el.querySelectorAll(sel)); }

  function filterByTag(container, tag) {
    qsa("[data-tags]", container).forEach(item => {
      const tags = (item.getAttribute("data-tags") || "")
        .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
      const show = !tag || tag === "all" || tags.includes(tag.toLowerCase());
      item.classList.toggle("cctk-hidden", !show);
    });
  }

  // Set the current year in any element with id="year"
  function stampYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", stampYear);
  } else {
    stampYear();
  }

  window.CCTK.ui = { qs, qsa, filterByTag };
})();
