/* CCTK UI Kit — Tiny helpers (optional)
   Keeps the kit lightweight. Add more as you need.
*/

(function () {
  window.CCTK = window.CCTK || {};

  function qs(sel, el = document) { return el.querySelector(sel); }
  function qsa(sel, el = document) { return Array.from(el.querySelectorAll(sel)); }

  // Simple tag filtering pattern for hub/tool lists:
  // - items have data-tags="a,b,c"
  // - call filterByTag(container, "research")
  function filterByTag(container, tag) {
    const items = qsa("[data-tags]", container);
    items.forEach(item => {
      const tags = (item.getAttribute("data-tags") || "")
        .split(",")
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

      const show = !tag || tag === "all" || tags.includes(tag.toLowerCase());
      item.classList.toggle("cctk-hidden", !show);
    });
  }

  window.CCTK.ui = { qs, qsa, filterByTag };
})();
