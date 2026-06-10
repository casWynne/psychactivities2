/**
 * ============================================================
 * STATE MODULE  (js/state.js)
 * ============================================================
 * Observable store. Hydrates from localStorage on load.
 * Auto-saves on every change (debounced 400ms).
 * ============================================================
 */

const BadgeState = (() => {

  const d = CONFIG.defaults;

  // Deep-clone arrays so mutations stay isolated
  const cloneItems = (arr) => (arr || []).map(it => ({ ...it }));
  const cloneDecs  = (arr) => (arr || []).map(d  => ({ ...d  }));

  const _defaults = {
    badgeShape:          d.badgeShape,
    titleMain:           d.titleMain,
    titleSub:            d.titleSub,
    showRules:           d.showRules,
    borderGradient:      [...d.borderGradient],
    centreGradientFrom:  d.centreGradientFrom,
    centreGradientTo:    d.centreGradientTo,
    titleGradientFrom:   d.titleGradientFrom,
    titleGradientTo:     d.titleGradientTo,
    titleSubColour:      d.titleSubColour,
    ruleColourLeft:      d.ruleColourLeft,
    ruleColourRight:     d.ruleColourRight,
    labelColour:         d.labelColour,
    items:               cloneItems(d.items),
    decoratives:         cloneDecs(d.decoratives),
    fontFamily:          d.fontFamily,
    titleMainSize:       d.titleMainSize,
    titleSubSize:        d.titleSubSize,
    colourPresetIndex:   0,
  };

  // ── localStorage ──────────────────────────────────────────

  const _load = () => {
    try {
      const raw = localStorage.getItem("cpdbadge:state");
      if (!raw) return {};
      const s = JSON.parse(raw);
      if (s._version !== 2) return {};   // version 2 for new schema
      const { _version, ...rest } = s;
      return rest;
    } catch (e) { return {}; }
  };

  let _state = { ..._defaults, ...(_load()) };
  // Ensure arrays are always present after hydration
  if (!Array.isArray(_state.items))       _state.items       = cloneItems(d.items);
  if (!Array.isArray(_state.decoratives)) _state.decoratives = cloneDecs(d.decoratives);

  // Debounced save
  let _saveTimer = null;
  const _save = () => {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      try {
        localStorage.setItem("cpdbadge:state", JSON.stringify({ ..._state, _version: 2 }));
        window.dispatchEvent(new CustomEvent("badge-saved"));
      } catch (e) {}
    }, 400);
  };

  // Sidebar width helpers (kept on state module for convenience)
  const saveSidebarWidth = (px) => {
    try { localStorage.setItem("cpdbadge:sidebar-width", px); } catch (e) {}
  };
  const loadSidebarWidth = () => {
    try {
      const v = parseInt(localStorage.getItem("cpdbadge:sidebar-width"));
      return (!isNaN(v) && v >= 260 && v <= 700) ? v : null;
    } catch (e) { return null; }
  };

  // ── Listeners ─────────────────────────────────────────────

  const _listeners = [];
  const _snap = () => ({
    ..._state,
    items:       cloneItems(_state.items),
    decoratives: cloneDecs(_state.decoratives),
    borderGradient: [..._state.borderGradient],
  });
  const _notify = () => { const s = _snap(); _listeners.forEach(fn => fn(s)); };

  // ── Public API ────────────────────────────────────────────

  const get       = ()     => _snap();
  const subscribe = (fn)   => _listeners.push(fn);

  const update = (patch) => {
    _state = { ..._state, ...patch };
    _notify(); _save();
  };

  /** Update one item by index. */
  const updateItem = (index, patch) => {
    const items = _state.items.map((it, i) => i === index ? { ...it, ...patch } : { ...it });
    update({ items });
  };

  /** Replace the entire items array. */
  const setItems = (arr) => update({ items: cloneItems(arr) });

  /** Update one decorative by index. */
  const updateDec = (index, patch) => {
    const decoratives = _state.decoratives.map((d, i) => i === index ? { ...d, ...patch } : { ...d });
    update({ decoratives });
  };

  /** Add a new decorative. */
  const addDec = (dec) => {
    update({ decoratives: [..._state.decoratives, { ...dec }] });
  };

  /** Remove a decorative by index. */
  const removeDec = (index) => {
    update({ decoratives: _state.decoratives.filter((_, i) => i !== index) });
  };

  /** Apply a colour preset. */
  const applyPreset = (index) => {
    const p = CONFIG.colourPresets[index];
    if (!p) return;
    update({
      colourPresetIndex:  index,
      borderGradient:     [...p.borderGradient],
      centreGradientFrom: p.centreFrom,
      centreGradientTo:   p.centreTo,
      titleGradientFrom:  p.titleFrom,
      titleGradientTo:    p.titleTo,
      titleSubColour:     p.titleSubColour,
      ruleColourLeft:     p.ruleLeft,
      ruleColourRight:    p.ruleRight,
      labelColour:        p.labelColour,
    });
  };

  /** Reset to CONFIG defaults and clear localStorage. */
  const resetToDefaults = () => {
    try { localStorage.removeItem("cpdbadge:state"); } catch (e) {}
    _state = {
      ..._defaults,
      items:       cloneItems(d.items),
      decoratives: cloneDecs(d.decoratives),
      borderGradient: [..._defaults.borderGradient],
    };
    _notify();
  };

  return {
    get, update, subscribe,
    updateItem, setItems,
    updateDec, addDec, removeDec,
    applyPreset, resetToDefaults,
    saveSidebarWidth, loadSidebarWidth,
  };

})();

window.BadgeState = BadgeState;
