/**
 * ============================================================
 * STORAGE MODULE  (js/storage.js)
 * ============================================================
 * Thin wrapper around localStorage that handles serialisation,
 * versioning, and graceful fallback if storage is unavailable
 * (e.g. private browsing with strict settings).
 *
 * All keys are namespaced under STORAGE_NS so the app never
 * collides with other tools on the same GitHub Pages domain.
 *
 * Keys written:
 *   digilearn:badge-settings   – full badge state (JSON)
 *   digilearn:sidebar-width    – panel width in px (number)
 *
 * Public API:
 *   BadgeStorage.saveBadge(stateObj)        – persist badge state
 *   BadgeStorage.loadBadge()                – returns saved state or null
 *   BadgeStorage.saveSidebarWidth(px)       – persist panel width
 *   BadgeStorage.loadSidebarWidth()         – returns saved px or null
 *   BadgeStorage.clearAll()                 – wipe everything this app saved
 *   BadgeStorage.available                  – boolean: is localStorage usable?
 * ============================================================
 */

const BadgeStorage = (() => {

  // ── Namespace & version ────────────────────────────────────

  const NS      = "digilearn:";
  const VERSION = 1;           // Bump this if the saved schema changes
                               // so stale saves are discarded gracefully.

  // Keys
  const KEY_BADGE   = NS + "badge-settings";
  const KEY_SIDEBAR = NS + "sidebar-width";

  // ── Availability check ─────────────────────────────────────

  /**
   * Test whether localStorage is actually writable.
   * Can fail in private/incognito mode on some browsers.
   */
  const _checkAvailable = () => {
    try {
      const probe = NS + "__probe__";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return true;
    } catch (e) {
      console.warn("BadgeStorage: localStorage unavailable — settings will not persist.", e);
      return false;
    }
  };

  const available = _checkAvailable();

  // ── Low-level helpers ──────────────────────────────────────

  const _write = (key, value) => {
    if (!available) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Notify the UI that a save occurred (picked up by the header indicator)
      window.dispatchEvent(new CustomEvent("badge-saved", { detail: { key } }));
    } catch (e) {
      // Storage quota exceeded or other write error — fail silently
      console.warn(`BadgeStorage: could not write key "${key}"`, e);
    }
  };

  const _read = (key) => {
    if (!available) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn(`BadgeStorage: could not read key "${key}"`, e);
      return null;
    }
  };

  const _remove = (key) => {
    if (!available) return;
    try { localStorage.removeItem(key); } catch (_) {}
  };

  // ── Badge state persistence ────────────────────────────────

  /**
   * Keys that are safe to persist.
   * We deliberately exclude:
   *   logoDataUrl    – large binary blob; re-fetched on load
   *   customImageUrl – user's uploaded file; can't restore without re-upload
   *
   * Everything else is a small scalar (string, number, boolean).
   */
  const PERSISTABLE_KEYS = [
    "shape",
    "topText", "bottomText",
    "borderColour", "centreColour", "textColour", "colourPresetIndex",
    "fontSize", "fontFamily", "fontWeight", "letterSpacing",
    "iconName", "iconColour", "iconScale", "iconOffsetX", "iconOffsetY",
    "showLogo", "logoScale", "logoOffsetX", "logoOffsetY",
  ];

  /**
   * Save the badge state to localStorage.
   * Only persists safe scalar keys (see PERSISTABLE_KEYS above).
   *
   * @param {Object} state – full state snapshot from BadgeState.get()
   */
  const saveBadge = (state) => {
    const payload = { _version: VERSION };
    PERSISTABLE_KEYS.forEach(k => {
      if (state[k] !== undefined) payload[k] = state[k];
    });
    _write(KEY_BADGE, payload);
  };

  /**
   * Load the saved badge state from localStorage.
   *
   * @returns {Object|null}  Partial state object (only persisted keys),
   *                         or null if nothing saved / version mismatch.
   */
  const loadBadge = () => {
    const saved = _read(KEY_BADGE);
    if (!saved) return null;

    // Discard saves from an older schema version
    if (saved._version !== VERSION) {
      console.info("BadgeStorage: schema version mismatch — discarding old save.");
      _remove(KEY_BADGE);
      return null;
    }

    // Return only known keys (guard against unexpected keys in old saves)
    const restored = {};
    PERSISTABLE_KEYS.forEach(k => {
      if (saved[k] !== undefined) restored[k] = saved[k];
    });
    return restored;
  };

  // ── Sidebar width persistence ──────────────────────────────

  /**
   * Save the sidebar panel width.
   * @param {number} px – width in pixels
   */
  const saveSidebarWidth = (px) => {
    _write(KEY_SIDEBAR, Number(px));
  };

  /**
   * Load the saved sidebar width.
   * @returns {number|null}
   */
  const loadSidebarWidth = () => {
    const val = _read(KEY_SIDEBAR);
    // Sanity-check: must be a plausible pixel value
    if (typeof val === "number" && val >= 200 && val <= 700) return val;
    return null;
  };

  // ── Clear everything ───────────────────────────────────────

  /**
   * Remove all keys this app has written to localStorage.
   * Useful for a "Reset to defaults" button.
   */
  const clearAll = () => {
    _remove(KEY_BADGE);
    _remove(KEY_SIDEBAR);
    console.info("BadgeStorage: all saved settings cleared.");
  };

  // ── Public API ─────────────────────────────────────────────

  return {
    available,
    saveBadge,
    loadBadge,
    saveSidebarWidth,
    loadSidebarWidth,
    clearAll,
  };

})();

window.BadgeStorage = BadgeStorage;
