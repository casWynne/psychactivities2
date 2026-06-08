/**
 * ============================================================
 * STATE MODULE  (js/state.js)
 * ============================================================
 * Single source of truth for the badge editor.
 * Observable store — call subscribe() to listen for changes.
 *
 * On init, attempts to restore the last badge settings from
 * localStorage via BadgeStorage. On every update, auto-saves
 * the new state (debounced to avoid excessive writes).
 *
 * Keys NOT restored from storage (re-computed each session):
 *   logoDataUrl     – re-fetched from assets/ltu-logo.svg
 *   customImageUrl  – user must re-upload their image
 * ============================================================
 */

const BadgeState = (() => {

  const d      = CONFIG.defaults;
  const preset = CONFIG.colourPresets[d.colourPresetIndex];

  // ── Default state ──────────────────────────────────────────
  // This is what you get on a completely fresh first visit.

  const _defaults = {
    shape:             d.shape,
    topText:           d.topText,
    bottomText:        d.bottomText,
    borderColour:      preset.border,
    centreColour:      preset.centre,
    textColour:        preset.text,
    colourPresetIndex: d.colourPresetIndex,
    fontSize:          d.fontSize,
    fontFamily:        d.fontFamily,
    fontWeight:        d.fontWeight,
    letterSpacing:     d.letterSpacing,
    iconName:          d.iconName,
    iconColour:        "#333333",
    iconScale:         d.iconScale  !== undefined ? d.iconScale  : 1.0,
    iconOffsetX:       d.iconOffsetX !== undefined ? d.iconOffsetX : 0,
    iconOffsetY:       d.iconOffsetY !== undefined ? d.iconOffsetY : 0,
    logoDataUrl:       null,   // always re-fetched
    showLogo:          d.showUniversityLogo,
    logoScale:         d.universityLogoScale,
    logoOffsetX:       d.logoOffsetX !== undefined ? d.logoOffsetX : 0,
    logoOffsetY:       d.logoOffsetY !== undefined ? d.logoOffsetY : 0,
    customImageUrl:    null,   // user must re-upload
  };

  // ── Hydrate from localStorage ──────────────────────────────
  // Merge saved scalars on top of defaults. Binary blobs are
  // excluded by BadgeStorage and so stay as null here.

  const _saved   = BadgeStorage.loadBadge() || {};
  let   _state   = { ..._defaults, ..._saved };

  // ── Debounced save ─────────────────────────────────────────
  // We write to localStorage at most once every 400 ms to avoid
  // hammering storage on rapid slider drags.

  let _saveTimer = null;
  const _scheduleSave = () => {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => BadgeStorage.saveBadge(_state), 400);
  };

  // ── Listeners ─────────────────────────────────────────────

  const _listeners = [];
  const _notify    = () => {
    const snapshot = { ..._state };
    _listeners.forEach(fn => fn(snapshot));
  };

  // ── Public API ─────────────────────────────────────────────

  /** Get a full snapshot of current state. */
  const get = () => ({ ..._state });

  /**
   * Merge a patch into state, notify listeners, and schedule
   * a localStorage save.
   * @param {Object} patch
   */
  const update = (patch) => {
    _state = { ..._state, ...patch };
    _notify();
    _scheduleSave();
  };

  /** Apply a named colour preset by index. */
  const applyPreset = (index) => {
    const p = CONFIG.colourPresets[index];
    if (!p) return;
    update({
      colourPresetIndex: index,
      borderColour:      p.border,
      centreColour:      p.centre,
      textColour:        p.text,
    });
  };

  /** Register a listener called on every state change. */
  const subscribe = (fn) => _listeners.push(fn);

  /**
   * Reset all badge settings to CONFIG defaults and clear
   * the saved localStorage entry.
   * logoDataUrl is preserved (it's loaded async, not from storage).
   */
  const resetToDefaults = () => {
    const logoUrl = _state.logoDataUrl;  // keep the loaded logo
    BadgeStorage.clearAll();
    _state = { ..._defaults, logoDataUrl: logoUrl };
    _notify();
  };

  /**
   * Returns true if the current state differs from defaults
   * in any persisted key — useful for showing a "saved" indicator.
   */
  const hasSavedSettings = () => BadgeStorage.loadBadge() !== null;

  return { get, update, applyPreset, subscribe, resetToDefaults, hasSavedSettings };

})();

window.BadgeState = BadgeState;