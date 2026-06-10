/**
 * ============================================================
 * UI MODULE  (js/ui.js)
 * ============================================================
 * Builds the editor panel and wires all controls.
 *
 * Sections:
 *   1. Badge Shape (scallop / circle / square / hexagon)
 *   2. Colour Theme (preset + individual pickers)
 *   3. Title
 *   4. Icon Items — add/remove, per-item picker, label,
 *                   colour, iconSize, labelSize, X/Y offset
 *   5. Decoratives — add/remove, per-dec controls
 *   6. Typography
 *   7. Export
 * ============================================================
 */

const BadgeUI = (() => {

  let previewEl = null;

  // ── Tabler sprite ──────────────────────────────────────────

  /** Fetch icons from CDN and inject as a hidden SVG sprite. */
  const loadTablerSprite = async () => {
    const needed = CONFIG.iconGroups.flatMap(g => g.icons.map(i => i.name));
    const sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sprite.style.display = "none";
    document.body.appendChild(sprite);

    await Promise.all(needed.map(async name => {
      try {
        const resp = await fetch(
          `https://cdn.jsdelivr.net/npm/@tabler/icons@3.24.0/icons/outline/${name}.svg`);
        if (!resp.ok) return;
        const doc  = new DOMParser().parseFromString(await resp.text(), "image/svg+xml");
        const src  = doc.querySelector("svg");
        if (!src) return;
        const sym  = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
        sym.id = `tabler-${name}`;
        sym.setAttribute("viewBox", src.getAttribute("viewBox") || "0 0 24 24");
        Array.from(src.children).forEach(c => sym.appendChild(c.cloneNode(true)));
        sprite.appendChild(sym);
      } catch (e) { /* silently skip failed icons */ }
    }));

    updatePreview(BadgeState.get());
  };

  // ── Preview ────────────────────────────────────────────────

  const updatePreview = (state) => {
    if (previewEl) previewEl.innerHTML = BadgeRenderer.render(state);
  };

  // ── DOM helpers ────────────────────────────────────────────

  const el = (tag, cls, parent) => {
    const e = document.createElement(tag);
    if (cls) cls.split(" ").filter(Boolean).forEach(c => e.classList.add(c));
    if (parent) parent.appendChild(e);
    return e;
  };

  const section = (title, parent) => {
    const wrap = el("div", "panel-section", parent);
    const h    = el("h3", "section-heading", wrap);
    h.textContent = title;
    return wrap;
  };

  const row = (labelText, parent) => {
    const r   = el("div", "control-row", parent);
    const lbl = el("label", "control-label", r);
    lbl.textContent = labelText;
    return r;
  };

  /**
   * Slider + synced number input.
   * If opts.onchange is provided it's called instead of BadgeState.update.
   */
  const rangeSlider = (parent, opts) => {
    const r     = el("div", "control-row", parent);
    const lbl   = el("label", "control-label", r);
    lbl.textContent = opts.label;
    const slide = el("input", "control-range", r);
    slide.type  = "range"; slide.min = opts.min; slide.max = opts.max;
    slide.step  = opts.step || 1; slide.value = opts.value;
    const num   = el("input", "range-num-input", r);
    num.type    = "number"; num.min = opts.min; num.max = opts.max;
    num.step    = opts.step || 1; num.value = opts.value;
    const transform = opts.transform || (v => Number(v));
    const sync = (raw) => {
      const v = Math.max(Number(opts.min), Math.min(Number(opts.max), Number(raw) || 0));
      slide.value = v; num.value = v;
      const val = transform(v);
      if (opts.onchange) opts.onchange(val);
      else if (opts.stateKey) BadgeState.update({ [opts.stateKey]: val });
    };
    slide.addEventListener("input", () => sync(slide.value));
    num.addEventListener("input",   () => sync(num.value));
    return { slide, num, setValue: (v) => { slide.value = v; num.value = v; } };
  };

  const toggle = (labelText, parent, checked, onChange) => {
    const r  = el("div", "control-row", parent);
    const lb = el("label", "control-label", r);
    lb.textContent = labelText;
    const sw = el("label", "toggle-switch", r);
    const cb = el("input", null, sw);
    cb.type = "checkbox"; cb.checked = checked;
    el("span", "toggle-slider", sw);
    cb.addEventListener("change", () => onChange(cb.checked));
    return cb;
  };

  const colourPicker = (labelText, parent, value, onChange) => {
    const r   = el("div", "control-row", parent);
    const lbl = el("label", "control-label", r);
    lbl.textContent = labelText;
    const inp = el("input", "control-colour", r);
    inp.type = "color"; inp.value = value || "#333333";
    inp.addEventListener("input", () => onChange(inp.value));
    return inp;
  };

  /**
   * Build a collapsible icon picker accordion inside parent.
   * Calls onSelect(iconName) when an icon is chosen.
   * Returns { headerLabel, setActive(name) }
   */
  const iconPicker = (parent, currentIcon, onSelect) => {
    const wrap   = el("div", "icon-accordion", parent);
    const hdr    = el("button", "icon-group-header", wrap);
    const chev   = el("span", "group-chevron", hdr); chev.textContent = "▸";
    const hLbl   = el("span", null, hdr);
    hLbl.textContent = currentIcon ? `Icon: ${currentIcon}` : "No icon selected";

    const body = el("div", "icon-group-body", wrap);

    hdr.addEventListener("click", () => {
      const open = body.classList.toggle("open");
      chev.textContent = open ? "▾" : "▸";
      hdr.classList.toggle("active-group", open);
    });

    // Tabler link
    const tLink = el("a", "tabler-link", body);
    tLink.href = "https://tabler.io/icons"; tLink.target = "_blank"; tLink.rel = "noopener noreferrer";
    tLink.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="12" height="12">
      <path d="M10 14a3.5 3.5 0 0 0 5 0l4-4a3.5 3.5 0 0 0-5-5l-.5.5"/>
      <path d="M14 10a3.5 3.5 0 0 0-5 0l-4 4a3.5 3.5 0 0 0 5 5l.5-.5"/></svg> Browse 6100+ Tabler Icons ↗`;

    // None button
    const noneBtn = el("button", "icon-none-btn", body);
    noneBtn.textContent = "No icon";
    if (!currentIcon) noneBtn.classList.add("active");
    noneBtn.addEventListener("click", () => {
      body.querySelectorAll(".icon-item, .icon-none-btn").forEach(b => b.classList.remove("active"));
      noneBtn.classList.add("active");
      hLbl.textContent = "No icon selected";
      onSelect("");
    });

    // Groups
    CONFIG.iconGroups.forEach(group => {
      const grpBtn  = el("button", "icon-group-header sub-group-header", body);
      const gc      = el("span", "group-chevron", grpBtn); gc.textContent = "▸";
      const gl      = el("span", null, grpBtn); gl.textContent = group.label;
      const grpBody = el("div", "icon-group-body", body);
      const grid    = el("div", "icon-grid", grpBody);

      grpBtn.addEventListener("click", () => {
        const o = grpBody.classList.toggle("open"); gc.textContent = o ? "▾" : "▸";
        grpBtn.classList.toggle("active-group", o);
      });

      group.icons.forEach(icon => {
        const btn = el("button", "icon-item", grid);
        btn.title = icon.label;
        if (icon.name === currentIcon) btn.classList.add("active");
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round">
            <use href="#tabler-${icon.name}" />
          </svg><span>${icon.label}</span>`;
        btn.addEventListener("click", () => {
          body.querySelectorAll(".icon-item, .icon-none-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          hLbl.textContent = `Icon: ${icon.name}`;
          onSelect(icon.name);
        });
      });
    });

    const setActive = (name) => {
      body.querySelectorAll(".icon-item, .icon-none-btn").forEach(b => b.classList.remove("active"));
      if (!name) { noneBtn.classList.add("active"); hLbl.textContent = "No icon selected"; return; }
      body.querySelectorAll(".icon-item").forEach(b => {
        if (b.dataset && b.querySelector("use") &&
            b.querySelector("use").getAttribute("href") === `#tabler-${name}`) {
          b.classList.add("active");
          hLbl.textContent = `Icon: ${name}`;
        }
      });
    };

    return { hLbl, setActive };
  };

  // ── XY offset mini-control (compact: two number inputs) ───

  const xyControl = (parent, labelText, ox, oy, onChange) => {
    const r    = el("div", "control-row xy-mini-row", parent);
    const lbl  = el("label", "control-label", r);
    lbl.textContent = labelText;
    const wrap = el("div", "xy-mini-wrap", r);

    const xLbl = el("span", "xy-mini-label", wrap); xLbl.textContent = "X";
    const xNum = el("input", "axis-num-input", wrap);
    xNum.type = "number"; xNum.min = -200; xNum.max = 200; xNum.step = 1; xNum.value = ox;

    const yLbl = el("span", "xy-mini-label", wrap); yLbl.textContent = "Y";
    const yNum = el("input", "axis-num-input", wrap);
    yNum.type = "number"; yNum.min = -200; yNum.max = 200; yNum.step = 1; yNum.value = oy;

    const emit = () => onChange(
      Math.max(-200, Math.min(200, parseInt(xNum.value) || 0)),
      Math.max(-200, Math.min(200, parseInt(yNum.value) || 0))
    );
    xNum.addEventListener("input", emit);
    yNum.addEventListener("input", emit);
    return { xNum, yNum };
  };

  // ── Section 1: Badge Shape ─────────────────────────────────

  const buildShapeSection = (container) => {
    const sec    = section("Badge Shape", container);
    const shapes = ["scallop","circle","square","hexagon"];
    const icons  = {
      scallop: `<svg viewBox="0 0 40 40"><path d="M20,3 C22,3 23,5 25,5 C27,5 28,3 30,4 C32,5 31,7 33,8 C35,9 37,8 38,10 C39,12 37,13 37,15 C37,17 39,18 38,20 C37,22 35,21 34,23 C33,25 34,27 32,28 C30,29 28,28 27,30 C26,32 27,34 25,35 C23,36 22,34 20,34 C18,34 17,36 15,35 C13,34 14,32 13,30 C12,28 10,29 8,28 C6,27 7,25 6,23 C5,21 3,22 2,20 C1,18 3,17 3,15 C3,13 1,12 2,10 C3,8 5,9 7,8 C9,7 8,5 10,4 C12,3 13,5 15,5 C17,5 18,3 20,3Z" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="1.5"/></svg>`,
      circle:  `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
      square:  `<svg viewBox="0 0 40 40"><rect x="3" y="3" width="34" height="34" rx="5" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="2"/><rect x="10" y="10" width="20" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
      hexagon: `<svg viewBox="0 0 40 40"><polygon points="20,3 35,12 35,28 20,37 5,28 5,12" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="2"/><polygon points="20,10 30,16 30,24 20,30 10,24 10,16" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
    };
    const wrap = el("div", "shape-buttons", sec);
    const cur  = BadgeState.get().badgeShape;

    shapes.forEach(shape => {
      const btn = el("button", "shape-btn", wrap);
      btn.innerHTML = icons[shape];
      const lbl = el("span", "shape-label", btn);
      lbl.textContent = shape.charAt(0).toUpperCase() + shape.slice(1);
      if (shape === cur) btn.classList.add("active");
      btn.addEventListener("click", () => {
        wrap.querySelectorAll(".shape-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        BadgeState.update({ badgeShape: shape });
      });
    });
  };

  // ── Section 2: Colour Preset ───────────────────────────────

  const buildPresetSection = (container) => {
    const sec = section("Colour Theme", container);
    const r   = row("Preset", sec);
    const sel = el("select", "control-select", r);
    CONFIG.colourPresets.forEach((p, i) => {
      const opt = el("option", null, sel);
      opt.value = i; opt.textContent = p.label;
    });
    sel.value = BadgeState.get().colourPresetIndex;
    sel.addEventListener("change", () => BadgeState.applyPreset(parseInt(sel.value)));
    BadgeState.subscribe(s => { sel.value = s.colourPresetIndex; });
  };

  // ── Section 3: Title ───────────────────────────────────────

  const buildTitleSection = (container) => {
    const sec = section("Title", container);
    const s   = BadgeState.get();

    const mainRow = row("Main text", sec);
    const mainIn  = el("input", "control-input", mainRow);
    mainIn.type = "text"; mainIn.value = s.titleMain; mainIn.placeholder = "e.g. CPD";
    mainIn.addEventListener("input", () => BadgeState.update({ titleMain: mainIn.value }));

    const subRow = row("Sub text", sec);
    const subIn  = el("input", "control-input", subRow);
    subIn.type = "text"; subIn.value = s.titleSub; subIn.placeholder = "e.g. DAY";
    subIn.addEventListener("input", () => BadgeState.update({ titleSub: subIn.value }));

    toggle("Show ruled lines", sec, s.showRules, v => BadgeState.update({ showRules: v }));

    const cp = (lbl, key) => colourPicker(lbl, sec, BadgeState.get()[key], v => BadgeState.update({ [key]: v }));
    cp("Title gradient — start", "titleGradientFrom");
    cp("Title gradient — end",   "titleGradientTo");
    cp("Sub-title colour",        "titleSubColour");
    cp("Left rule colour",        "ruleColourLeft");
    cp("Right rule colour",       "ruleColourRight");

    rangeSlider(sec, { label: "Main title size", min: 50, max: 150, value: s.titleMainSize,
      stateKey: "titleMainSize", transform: v => parseInt(v) });
    rangeSlider(sec, { label: "Sub-title size",  min: 20, max: 80,  value: s.titleSubSize,
      stateKey: "titleSubSize",  transform: v => parseInt(v) });
  };

  // ── Section 4: Icon Items ──────────────────────────────────

  /**
   * Each item is rendered as a collapsible card.
   * Add button appends a new blank item (max 5).
   * Remove button removes that item.
   * Controls: icon picker, label, colour, iconSize, labelSize, XY offset.
   */
  const buildItemsSection = (container) => {
    const sec = section("Icon Items", container);

    // Tabler link at top
    const tLink = el("a", "tabler-link", sec);
    tLink.href = "https://tabler.io/icons"; tLink.target = "_blank"; tLink.rel = "noopener noreferrer";
    tLink.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
      <path d="M10 14a3.5 3.5 0 0 0 5 0l4-4a3.5 3.5 0 0 0-5-5l-.5.5"/>
      <path d="M14 10a3.5 3.5 0 0 0-5 0l-4 4a3.5 3.5 0 0 0 5 5l.5-.5"/></svg> Browse 6100+ Tabler Icons ↗`;

    // Container for item cards (rebuilt on add/remove)
    const cardsWrap = el("div", "items-cards", sec);

    // Add button
    const addBtn = el("button", "add-dec-btn", sec);
    addBtn.innerHTML = `<span>+</span> Add icon item`;

    const rebuildCards = () => {
      cardsWrap.innerHTML = "";
      const state = BadgeState.get();

      state.items.forEach((item, i) => {
        // Card
        const card = el("div", "item-card", cardsWrap);

        // Card header: title + remove button
        const cardHdr = el("div", "item-card-header", card);
        const cardLbl = el("span", "item-card-label", cardHdr);
        cardLbl.textContent = `Item ${i + 1}`;

        const collapseBtn = el("button", "item-collapse-btn", cardHdr);
        collapseBtn.textContent = "▾";
        const body = el("div", "item-card-body", card);

        collapseBtn.addEventListener("click", () => {
          const open = body.classList.toggle("collapsed");
          collapseBtn.textContent = open ? "▸" : "▾";
        });

        const removeBtn = el("button", "remove-item-btn", cardHdr);
        removeBtn.textContent = "✕";
        removeBtn.title = "Remove this item";
        removeBtn.addEventListener("click", () => {
          const cur = BadgeState.get().items.filter((_, j) => j !== i);
          BadgeState.setItems(cur);
          rebuildCards();
        });

        // Icon picker
        iconPicker(body, item.iconName, (name) => BadgeState.updateItem(i, { iconName: name }));

        // Label
        const lblRow = row("Label", body);
        const lblTa  = el("textarea", "control-textarea", lblRow);
        lblTa.rows = 2; lblTa.value = item.label || "";
        lblTa.placeholder = "Label (Enter = new line)";
        lblTa.addEventListener("input", () => BadgeState.updateItem(i, { label: lblTa.value }));

        // Colour
        colourPicker("Icon colour", body, item.colour || "#333333",
          v => BadgeState.updateItem(i, { colour: v }));

        // Icon size
        rangeSlider(body, { label: "Icon size", min: 20, max: 120, value: item.iconSize || 62,
          onchange: v => BadgeState.updateItem(i, { iconSize: v }), transform: v => parseInt(v) });

        // Label size
        rangeSlider(body, { label: "Label size", min: 8, max: 36, value: item.labelSize || 18,
          onchange: v => BadgeState.updateItem(i, { labelSize: v }), transform: v => parseInt(v) });

        // XY offset
        xyControl(body, "Position offset", item.offsetX || 0, item.offsetY || 0,
          (x, y) => BadgeState.updateItem(i, { offsetX: x, offsetY: y }));
      });

      // Disable Add if at 6 items
      addBtn.disabled = state.items.length >= 6;
    };

    addBtn.addEventListener("click", () => {
      const cur = BadgeState.get().items;
      if (cur.length >= 6) return;
      const newItem = { iconName: "", label: `Item ${cur.length + 1}`, colour: "#555555",
                        iconSize: 62, labelSize: 18, offsetX: 0, offsetY: 0 };
      BadgeState.setItems([...cur, newItem]);
      rebuildCards();
    });

    rebuildCards();
  };

  // ── Section 5: Decoratives ─────────────────────────────────

  /**
   * Decoratives are a state-driven array of typed elements.
   * Each card shows: visible toggle, type label, colour, size, XY position.
   * "Add decorative" opens a type picker dropdown + add button.
   */
  const buildDecorativesSection = (container) => {
    const sec = section("Decorative Elements", container);

    const cardsWrap = el("div", "items-cards", sec);

    const rebuildDecs = () => {
      cardsWrap.innerHTML = "";
      const state = BadgeState.get();

      state.decoratives.forEach((dec, i) => {
        const typeDef = CONFIG.decorativeTypes.find(t => t.type === dec.type) || { label: dec.type };

        const card    = el("div", "item-card dec-card", cardsWrap);
        const cardHdr = el("div", "item-card-header", card);

        // Visible toggle (inline in header)
        const visToggle = el("input", "dec-vis-check", cardHdr);
        visToggle.type    = "checkbox";
        visToggle.checked = dec.visible !== false;
        visToggle.title   = "Toggle visibility";
        visToggle.addEventListener("change", () => BadgeState.updateDec(i, { visible: visToggle.checked }));

        const cardLbl = el("span", "item-card-label", cardHdr);
        cardLbl.textContent = typeDef.label;

        const collapseBtn = el("button", "item-collapse-btn", cardHdr);
        collapseBtn.textContent = "▾";
        const body = el("div", "item-card-body", card);

        collapseBtn.addEventListener("click", () => {
          const open = body.classList.toggle("collapsed");
          collapseBtn.textContent = open ? "▸" : "▾";
        });

        const removeBtn = el("button", "remove-item-btn", cardHdr);
        removeBtn.textContent = "✕";
        removeBtn.addEventListener("click", () => { BadgeState.removeDec(i); rebuildDecs(); });

        // Colour (empty = gradient)
        const colRow   = el("div", "control-row", body);
        const colLabel = el("label", "control-label", colRow);
        colLabel.textContent = "Colour";
        const colInp = el("input", "control-colour", colRow);
        colInp.type  = "color"; colInp.value = dec.colour || "#7048e8";
        colInp.addEventListener("input", () => BadgeState.updateDec(i, { colour: colInp.value }));
        // "Use gradient" checkbox
        const gradWrap = el("div", "control-row", body);
        const gradLbl  = el("label", "control-label", gradWrap);
        gradLbl.textContent = "Use title gradient";
        const gradSw   = el("label", "toggle-switch", gradWrap);
        const gradCb   = el("input", null, gradSw); gradCb.type = "checkbox";
        gradCb.checked = !dec.colour;
        el("span", "toggle-slider", gradSw);
        gradCb.addEventListener("change", () => {
          const c = gradCb.checked ? "" : colInp.value;
          BadgeState.updateDec(i, { colour: c });
          colInp.disabled = gradCb.checked;
        });
        colInp.disabled = !dec.colour;

        // Size
        rangeSlider(body, { label: "Size", min: 0.3, max: 3.0, step: 0.1,
          value: dec.size || 1.0,
          onchange: v => BadgeState.updateDec(i, { size: v }),
          transform: v => Math.round(Number(v) * 10) / 10,
          display: v => v + "×"
        });

        // Position X/Y
        xyControl(body, "Position (SVG px)", dec.x || 250, dec.y || 250,
          (x, y) => BadgeState.updateDec(i, { x, y }));
      });
    };

    // Add panel: type selector + add button
    const addWrap = el("div", "add-dec-wrap", sec);
    const typeSel = el("select", "control-select add-dec-sel", addWrap);
    CONFIG.decorativeTypes.forEach(t => {
      const opt = el("option", null, typeSel);
      opt.value = t.type; opt.textContent = t.label;
    });
    const addBtn = el("button", "add-dec-btn", addWrap);
    addBtn.innerHTML = `<span>+</span> Add`;
    addBtn.addEventListener("click", () => {
      const typeDef = CONFIG.decorativeTypes.find(t => t.type === typeSel.value);
      BadgeState.addDec({
        type:    typeSel.value,
        x:       250, y: 400,
        size:    1.0,
        colour:  typeDef ? typeDef.defaultColour : "#7048e8",
        visible: true,
      });
      rebuildDecs();
    });

    rebuildDecs();
  };

  // ── Section 6: Colours ─────────────────────────────────────

  const buildColoursSection = (container) => {
    const sec = section("Colours", container);
    const s   = BadgeState.get();
    colourPicker("Centre — inner", sec, s.centreGradientFrom, v => BadgeState.update({ centreGradientFrom: v }));
    colourPicker("Centre — outer", sec, s.centreGradientTo,   v => BadgeState.update({ centreGradientTo: v }));
    colourPicker("Item labels",    sec, s.labelColour,         v => BadgeState.update({ labelColour: v }));
  };

  // ── Section 7: Export ──────────────────────────────────────

  const buildExportSection = (container) => {
    const sec         = section("Export", container);
    const qualDefault = Math.round(CONFIG.export.jpegQuality * 100);
    let   quality     = CONFIG.export.jpegQuality;

    const qualRow    = el("div", "control-row", sec);
    const qualLabel  = el("label", "control-label", qualRow); qualLabel.textContent = "JPEG quality";
    const qualSlider = el("input", "control-range", qualRow);
    qualSlider.type  = "range"; qualSlider.min = Math.round(CONFIG.export.jpegQualityMin * 100);
    qualSlider.max   = 100; qualSlider.value = qualDefault;
    const qualNum    = el("input", "range-num-input", qualRow);
    qualNum.type     = "number"; qualNum.min = qualSlider.min; qualNum.max = 100; qualNum.value = qualDefault;

    const syncQ = v => {
      v = Math.max(parseInt(qualSlider.min), Math.min(100, parseInt(v) || qualDefault));
      qualSlider.value = v; qualNum.value = v; quality = v / 100; scheduleEst();
    };
    qualSlider.addEventListener("input", () => syncQ(qualSlider.value));
    qualNum.addEventListener("input",   () => syncQ(qualNum.value));

    // Size meter
    const CAP_B  = CONFIG.export.fileSizeCapKb * 1024;
    const meter  = el("div", "size-meter-wrap", sec);
    const mtTop  = el("div", "size-meter-top", meter);
    const mtLbl  = el("span", "size-meter-label", mtTop); mtLbl.textContent = "Est. file size";
    const mtVal  = el("span", "size-meter-value", mtTop); mtVal.textContent = "— KB";
    const mtBar  = el("div", "size-meter-bar", meter);
    const mtFill = el("div", "size-meter-fill", mtBar);
    const mtCap  = el("span", "size-meter-cap", meter);
    mtCap.textContent = `Moodle limit: ${CONFIG.export.fileSizeCapKb} KB`;

    const updateMeter = (bytes) => {
      const kb = bytes / 1024, pct = Math.min(100, bytes / CAP_B * 100);
      const over = bytes > CAP_B, warn = bytes > CAP_B * 0.8;
      mtVal.textContent = kb >= 1 ? kb.toFixed(1) + " KB" : bytes + " B";
      mtFill.style.width = pct.toFixed(1) + "%";
      mtFill.className   = "size-meter-fill " + (over ? "over" : warn ? "warn" : "ok");
      mtVal.classList.toggle("over-text", over);
      expBtn.disabled = over;
    };

    let _et = null;
    const scheduleEst = () => {
      mtVal.textContent = "estimating…";
      clearTimeout(_et);
      _et = setTimeout(async () => {
        const bytes = await BadgeExporter.estimateSize(
          BadgeRenderer.render(BadgeState.get()), CONFIG.export.outputSize, quality);
        updateMeter(bytes);
      }, 350);
    };
    BadgeState.subscribe(scheduleEst);

    const expBtn = el("button", "export-btn", sec);
    expBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      ${CONFIG.ui.exportLabel}`;
    expBtn.addEventListener("click", async () => {
      const state = BadgeState.get();
      const svg   = BadgeRenderer.render(state);
      const name  = (state.titleMain + "-" + state.titleSub).toLowerCase().replace(/\s+/g, "-");
      expBtn.disabled = true; expBtn.textContent = "Exporting…";
      await BadgeExporter.downloadJpeg(svg, name, CONFIG.export.outputSize, quality);
      expBtn.disabled = false;
      expBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        ${CONFIG.ui.exportLabel}`;
    });

    setTimeout(scheduleEst, 1500);
  };

  // ── Init ───────────────────────────────────────────────────

  const init = async (panelEl, _previewEl) => {
    previewEl = _previewEl;
    buildShapeSection(panelEl);
    buildPresetSection(panelEl);
    buildTitleSection(panelEl);
    buildItemsSection(panelEl);
    buildDecorativesSection(panelEl);
    buildColoursSection(panelEl);
    buildExportSection(panelEl);
    BadgeState.subscribe(updatePreview);
    await loadTablerSprite();
    updatePreview(BadgeState.get());
  };

  return { init };

})();

window.BadgeUI = BadgeUI;
