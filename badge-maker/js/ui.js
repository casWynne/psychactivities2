/**
 * ============================================================
 * UI MODULE  (js/ui.js)
 * ============================================================
 * Builds the editor control panel, binds events, and drives
 * the live preview via the state store.
 *
 * Sections built:
 *   1. Shape
 *   2. Colours
 *   3. Badge Text  (both fields now optional)
 *   4. Centre Content  (icon tab | image tab)
 *      ↳ Icon size slider + X/Y position sliders
 *   5. University Logo
 *      ↳ Size + X/Y position sliders
 * ============================================================
 */

const BadgeUI = (() => {

  let previewEl    = null;
  let tablerSprite = null;

  // ─── Asset loaders ───────────────────────────────────────

  /**
   * Fetch every Tabler icon listed in CONFIG.iconGroups from
   * the CDN and build an inline SVG sprite so <use> refs work.
   */
  const loadTablerSprite = async () => {
    const needed = CONFIG.iconGroups.flatMap(g => g.icons.map(i => i.name));
    const sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sprite.style.display = "none";
    sprite.id = "tabler-sprite";
    document.body.appendChild(sprite);

    await Promise.all(needed.map(async name => {
      try {
        const url  = `https://cdn.jsdelivr.net/npm/@tabler/icons@3.24.0/icons/outline/${name}.svg`;
        const resp = await fetch(url);
        if (!resp.ok) return;
        const doc  = new DOMParser().parseFromString(await resp.text(), "image/svg+xml");
        const src  = doc.querySelector("svg");
        if (!src) return;
        const sym = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
        sym.id = `tabler-${name}`;
        sym.setAttribute("viewBox", src.getAttribute("viewBox") || "0 0 24 24");
        Array.from(src.children).forEach(c => sym.appendChild(c.cloneNode(true)));
        sprite.appendChild(sym);
      } catch (e) { console.warn(`Icon load failed: ${name}`, e); }
    }));

    tablerSprite = sprite;
    // Re-render so icons appear now that the sprite is ready
    updatePreview(BadgeState.get());
  };

  /** Load LTU logo SVG → base64 data URL → store in state. */
  const loadLtuLogo = async () => {
    try {
      const resp = await fetch("assets/ltu-logo.svg");
      const text = await resp.text();
      const b64  = btoa(unescape(encodeURIComponent(text)));
      BadgeState.update({ logoDataUrl: `data:image/svg+xml;base64,${b64}` });
    } catch (e) { console.warn("LTU logo load failed:", e); }
  };

  // ─── Preview ─────────────────────────────────────────────

  const updatePreview = (state) => {
    if (!previewEl) return;
    previewEl.innerHTML = BadgeRenderer.render(state);
  };

  // ─── DOM helpers ─────────────────────────────────────────

  /** Create element, optionally add class(es) and append to parent. */
  const el = (tag, cls, parent) => {
    const e = document.createElement(tag);
    if (cls) cls.split(" ").forEach(c => c && e.classList.add(c));
    if (parent) parent.appendChild(e);
    return e;
  };

  /**
   * Create a labelled section block with a coloured left-bar heading.
   * Returns the content div (below the heading).
   */
  const section = (title, parent) => {
    const wrap = el("div", "panel-section", parent);
    const h    = el("h3",  "section-heading", wrap);
    h.textContent = title;
    return wrap;
  };

  /**
   * Create a two-column label + control row.
   * Returns the row element (append controls into it).
   */
  const row = (labelText, parent) => {
    const r   = el("div",   "control-row", parent);
    const lbl = el("label", "control-label", r);
    lbl.textContent = labelText;
    return r;
  };

  /**
   * Build a range slider with a live value readout.
   * @param {HTMLElement} parent
   * @param {Object} opts  { min, max, step, value, unit, stateKey, transform }
   *   transform(rawValue) → value stored in state (default: Number)
   *   display(rawValue)   → string shown next to slider
   */
  const rangeSlider = (parent, opts) => {
    const r      = el("div",   "control-row", parent);
    const lbl    = el("label", "control-label", r);
    lbl.textContent = opts.label;

    const input  = el("input", "control-range", r);
    input.type   = "range";
    input.min    = opts.min;
    input.max    = opts.max;
    input.step   = opts.step || 1;
    input.value  = opts.value;

    const val    = el("span", "range-value", r);
    const display = opts.display || (v => v + (opts.unit || ""));
    val.textContent = display(opts.value);

    const transform = opts.transform || (v => Number(v));

    input.addEventListener("input", () => {
      val.textContent = display(input.value);
      BadgeState.update({ [opts.stateKey]: transform(input.value) });
    });

    return input; // return so caller can reset it
  };

  /**
   * Build a pair of X / Y axis sliders with a visual 2D pad.
   * The pad shows a dot that moves as sliders are dragged.
   *
   * Offsets are RAW SVG pixel values on the 500px canvas
   * (range: -200..200 px). This matches config.js directly —
   * iconOffsetY: -35 means 35px upward in the SVG.
   *
   * @param {HTMLElement} parent
   * @param {string} xKey    – state key for X offset
   * @param {string} yKey    – state key for Y offset
   * @param {number} initX   – initial X value in raw SVG px
   * @param {number} initY   – initial Y value in raw SVG px
   */
  const xyPad = (parent, xKey, yKey, initX, initY) => {
    const RANGE = 200;   // ± px range in SVG canvas space

    const wrap = el("div", "xy-pad-wrap", parent);

    // Visual 2D pad
    const pad = el("div", "xy-pad", wrap);
    const dot = el("div", "xy-dot", pad);

    // Map raw px value → dot CSS % position (10%..90%)
    const valToPos = v => ((v + RANGE) / (RANGE * 2)) * 80 + 10;

    const updateDot = (x, y) => {
      dot.style.left = valToPos(x) + "%";
      dot.style.top  = valToPos(y) + "%";
    };

    updateDot(initX, initY);

    // ── X row: label | slider | number input ──
    const xRow    = el("div", "control-row xy-axis-row", wrap);
    const xLabel  = el("label", "control-label axis-label", xRow);
    xLabel.textContent = "← X →";

    const xSlider = el("input", "control-range", xRow);
    xSlider.type  = "range";
    xSlider.min   = -RANGE;
    xSlider.max   =  RANGE;
    xSlider.step  = 1;
    xSlider.value = initX;

    const xNum = el("input", "axis-num-input", xRow);
    xNum.type  = "number";
    xNum.min   = -RANGE;
    xNum.max   =  RANGE;
    xNum.step  = 1;
    xNum.value = initX;

    // ── Y row: label | slider | number input ──
    const yRow    = el("div", "control-row xy-axis-row", wrap);
    const yLabel  = el("label", "control-label axis-label", yRow);
    yLabel.textContent = "↑ Y ↓";

    const ySlider = el("input", "control-range", yRow);
    ySlider.type  = "range";
    ySlider.min   = -RANGE;
    ySlider.max   =  RANGE;
    ySlider.step  = 1;
    ySlider.value = initY;

    const yNum = el("input", "axis-num-input", yRow);
    yNum.type  = "number";
    yNum.min   = -RANGE;
    yNum.max   =  RANGE;
    yNum.step  = 1;
    yNum.value = initY;

    /** Push current slider values → state and dot. */
    const sync = () => {
      const x = parseInt(xSlider.value);
      const y = parseInt(ySlider.value);
      xNum.value = x;
      yNum.value = y;
      updateDot(x, y);
      BadgeState.update({ [xKey]: x, [yKey]: y });
    };

    // Slider → sync
    xSlider.addEventListener("input", sync);
    ySlider.addEventListener("input", sync);

    // Number input → update slider then sync
    xNum.addEventListener("input", () => {
      const v = Math.max(-RANGE, Math.min(RANGE, parseInt(xNum.value) || 0));
      xSlider.value = v; xNum.value = v; sync();
    });
    yNum.addEventListener("input", () => {
      const v = Math.max(-RANGE, Math.min(RANGE, parseInt(yNum.value) || 0));
      ySlider.value = v; yNum.value = v; sync();
    });

    // Click/drag on the 2D pad directly
    const padInteract = (e) => {
      const rect = pad.getBoundingClientRect();
      const px   = (e.clientX - rect.left) / rect.width;
      const py   = (e.clientY - rect.top)  / rect.height;
      // Map 10%..90% region back to -RANGE..+RANGE
      const x = Math.round(Math.max(-RANGE, Math.min(RANGE,
                  ((px - 0.1) / 0.8) * RANGE * 2 - RANGE)));
      const y = Math.round(Math.max(-RANGE, Math.min(RANGE,
                  ((py - 0.1) / 0.8) * RANGE * 2 - RANGE)));
      xSlider.value = x; ySlider.value = y;
      sync();
    };

    let dragging = false;
    pad.addEventListener("mousedown",  e => { dragging = true;  padInteract(e); });
    window.addEventListener("mousemove", e => { if (dragging) padInteract(e); });
    window.addEventListener("mouseup",   () => { dragging = false; });
    pad.addEventListener("touchstart",   e => { dragging = true;  padInteract(e.touches[0]); }, {passive:true});
    window.addEventListener("touchmove", e => { if (dragging) padInteract(e.touches[0]); }, {passive:true});
    window.addEventListener("touchend",  () => { dragging = false; });

    // Reset button → back to 0,0
    const resetBtn = el("button", "reset-btn", wrap);
    resetBtn.textContent = "Reset position";
    resetBtn.addEventListener("click", () => {
      xSlider.value = 0; ySlider.value = 0; sync();
    });

    return { xSlider, ySlider, xNum, yNum };
  };

  // ─── Section builders ────────────────────────────────────

  /** Shape selector: circle / square / triangle button group. */
  const buildShapeSelector = (container) => {
    const sec  = section("Shape", container);
    const wrap = el("div", "shape-buttons", sec);

    ["circle","square","triangle"].forEach(shape => {
      const btn = el("button", "shape-btn", wrap);
      btn.setAttribute("aria-label", shape);
      btn.innerHTML = shapeIcon(shape);
      const lbl = el("span", "shape-label", btn);
      lbl.textContent = shape.charAt(0).toUpperCase() + shape.slice(1);
      if (shape === CONFIG.defaults.shape) btn.classList.add("active");
      btn.addEventListener("click", () => {
        wrap.querySelectorAll(".shape-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        BadgeState.update({ shape });
      });
    });
  };

  /** Colour preset dropdown + individual pickers. */
  const buildColourSection = (container) => {
    const sec = section("Colours", container);

    // Preset dropdown
    const presetRow = row("Preset theme", sec);
    const presetSel = el("select", "control-select", presetRow);
    CONFIG.colourPresets.forEach((p,i) => {
      const opt = el("option", null, presetSel);
      opt.value = i; opt.textContent = p.label;
    });
    presetSel.value = CONFIG.defaults.colourPresetIndex;

    // Individual pickers — keep references so preset can sync them
    const borderRow    = row("Border colour", sec);
    const borderPicker = el("input", "control-colour", borderRow);
    borderPicker.type  = "color";
    borderPicker.value = BadgeState.get().borderColour;

    const centreRow    = row("Centre colour", sec);
    const centrePicker = el("input", "control-colour", centreRow);
    centrePicker.type  = "color";
    centrePicker.value = BadgeState.get().centreColour;

    const textRow    = row("Text colour", sec);
    const textPicker = el("input", "control-colour", textRow);
    textPicker.type  = "color";
    textPicker.value = BadgeState.get().textColour;

    // Wire preset dropdown
    presetSel.addEventListener("change", () => {
      BadgeState.applyPreset(parseInt(presetSel.value));
      const s = BadgeState.get();
      borderPicker.value = s.borderColour;
      centrePicker.value = s.centreColour;
      textPicker.value   = s.textColour;
    });

    // Wire individual pickers
    borderPicker.addEventListener("input", () => BadgeState.update({ borderColour: borderPicker.value }));
    centrePicker.addEventListener("input", () => BadgeState.update({ centreColour: centrePicker.value }));
    textPicker.addEventListener("input",   () => BadgeState.update({ textColour:   textPicker.value }));
  };

  /**
   * Badge text section.
   * Both top and bottom fields are now optional — empty = hidden.
   */
  const buildTextSection = (container) => {
    const sec = section("Badge Text", container);

    // Helper: build a text field row with optional toggle
    const buildTextField = (labelText, defaultVal, placeholder, stateKey) => {
      const r    = el("div", "control-row text-field-row", sec);
      const lbl  = el("label", "control-label", r);
      lbl.textContent = labelText;

      // Show/hide toggle
      const toggle   = el("label", "toggle-switch small-toggle", r);
      const checkbox = el("input", null, toggle);
      checkbox.type    = "checkbox";
      checkbox.checked = defaultVal !== "";
      el("span", "toggle-slider", toggle);

      // Text input (in its own row below)
      const inputRow  = el("div", "control-row indent-row", sec);
      const input     = el("input", "control-input", inputRow);
      input.type        = "text";
      input.value       = defaultVal;
      input.placeholder = placeholder;
      input.maxLength   = 32;
      if (!checkbox.checked) inputRow.classList.add("hidden");

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          inputRow.classList.remove("hidden");
          BadgeState.update({ [stateKey]: input.value });
        } else {
          inputRow.classList.add("hidden");
          BadgeState.update({ [stateKey]: "" });
        }
      });

      input.addEventListener("input", () => {
        if (checkbox.checked) BadgeState.update({ [stateKey]: input.value });
      });
    };

    buildTextField("Top text",    CONFIG.defaults.topText,    "e.g. DIGILEARN",    "topText");
    buildTextField("Bottom text", CONFIG.defaults.bottomText, "e.g. PRACTITIONER", "bottomText");

    // ── Typography ──
    const typoSec = el("div", "typo-group", sec);

    rangeSlider(typoSec, {
      label: "Font size", min: 10, max: 38, step: 1,
      value: CONFIG.defaults.fontSize, unit: "px",
      stateKey: "fontSize", transform: v => parseInt(v)
    });

    rangeSlider(typoSec, {
      label: "Letter spacing", min: 0, max: 14, step: 1,
      value: CONFIG.defaults.letterSpacing, unit: "px",
      stateKey: "letterSpacing", transform: v => parseInt(v)
    });
  };

  /**
   * Centre content: tabbed panel for Icon vs. Image upload.
   * Icon tab includes: icon picker, colour, size slider, XY pad.
   * Image tab includes: file upload, size slider, XY pad.
   */
  const buildIconSection = (container) => {
    const sec = section("Centre Content", container);

    // Tab bar
    const tabBar  = el("div", "tab-bar", sec);
    const iconTab = el("button", "tab-btn active", tabBar);
    iconTab.textContent = "Icon";
    const imgTab  = el("button", "tab-btn", tabBar);
    imgTab.textContent  = "Upload Image";

    const iconPanel = el("div", "tab-panel", sec);
    const imgPanel  = el("div", "tab-panel hidden", sec);

    iconTab.addEventListener("click", () => {
      iconTab.classList.add("active"); imgTab.classList.remove("active");
      iconPanel.classList.remove("hidden"); imgPanel.classList.add("hidden");
      BadgeState.update({ customImageUrl: null });
    });
    imgTab.addEventListener("click", () => {
      imgTab.classList.add("active"); iconTab.classList.remove("active");
      imgPanel.classList.remove("hidden"); iconPanel.classList.add("hidden");
      BadgeState.update({ iconName: "" });
    });

    // ── Icon panel ──────────────────────────────────────────

    // "No icon" option
    const noneWrap = el("div", "icon-none-row", iconPanel);
    const noneBtn  = el("button", "icon-none-btn", noneWrap);
    noneBtn.textContent = "No icon";
    noneBtn.addEventListener("click", () => {
      iconPanel.querySelectorAll(".icon-item").forEach(b => b.classList.remove("active"));
      noneBtn.classList.add("active");
      BadgeState.update({ iconName: "" });
    });

    // Tabler icons link
    const tablerLink = el("a", "tabler-link", iconPanel);
    tablerLink.href = "https://tabler.io/icons";
    tablerLink.target = "_blank";
    tablerLink.rel = "noopener noreferrer";
    tablerLink.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
      <path d="M10 14a3.5 3.5 0 0 0 5 0l4-4a3.5 3.5 0 0 0-5-5l-.5.5"/>
      <path d="M14 10a3.5 3.5 0 0 0-5 0l-4 4a3.5 3.5 0 0 0 5 5l.5-.5"/>
    </svg> Browse 6100+ Tabler Icons ↗`;

    // Icon groups — collapsible accordion
    // The first group starts open; rest start closed.
    CONFIG.iconGroups.forEach((group, groupIndex) => {

      // ── Accordion header (clickable) ──
      const header = el("button", "icon-group-header", iconPanel);
      const chevron = el("span", "group-chevron", header);
      chevron.textContent = "▸";
      const headerLabel = el("span", null, header);
      headerLabel.textContent = group.label;

      // ── Collapsible body ──
      const body = el("div", "icon-group-body", iconPanel);
      const grid = el("div", "icon-grid", body);

      // First group open by default
      if (groupIndex === 0) {
        body.classList.add("open");
        chevron.textContent = "▾";
        header.classList.add("active-group");
      }

      // Toggle on header click
      header.addEventListener("click", () => {
        const isOpen = body.classList.toggle("open");
        chevron.textContent = isOpen ? "▾" : "▸";
        header.classList.toggle("active-group", isOpen);
      });

      group.icons.forEach(icon => {
        const item = el("button", "icon-item", grid);
        item.title = icon.label;
        item.dataset.name = icon.name;
        item.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <use href="#tabler-${icon.name}" />
          </svg>
          <span>${icon.label}</span>`;
        if (icon.name === CONFIG.defaults.iconName) {
          item.classList.add("active");
          // Ensure the group containing the default icon starts open
          if (!body.classList.contains("open")) {
            body.classList.add("open");
            chevron.textContent = "▾";
            header.classList.add("active-group");
          }
        }
        item.addEventListener("click", () => {
          iconPanel.querySelectorAll(".icon-item, .icon-none-btn").forEach(b => b.classList.remove("active"));
          item.classList.add("active");
          BadgeState.update({ iconName: icon.name });
        });
      });
    });

    // Icon colour picker
    const colRow    = row("Icon colour", iconPanel);
    const colPicker = el("input", "control-colour", colRow);
    colPicker.type  = "color";
    colPicker.value = "#333333";
    colPicker.addEventListener("input", () => BadgeState.update({ iconColour: colPicker.value }));

    // Icon size slider (0.3 – 2.0, step 0.05)
    const d = CONFIG.defaults;
    rangeSlider(iconPanel, {
      label: "Icon size", min: 30, max: 200, step: 5,
      value: 100,  // represents 1.0 × scale
      unit: "%",
      stateKey: "iconScale",
      transform: v => parseInt(v) / 100,
      display:   v => v + "%"
    });

    // Icon X/Y position pad — initialise from current state (may be from config or localStorage)
    const posLbl = el("p", "sub-heading", iconPanel);
    posLbl.textContent = "Icon position (SVG px)";
    const iconState = BadgeState.get();
    xyPad(iconPanel, "iconOffsetX", "iconOffsetY", iconState.iconOffsetX, iconState.iconOffsetY);

    // ── Image upload panel ──────────────────────────────────
    // Accepts PNG, JPG and SVG files.
    // SVGs are converted to a data URL and rendered like raster images —
    // the renderer embeds them via <image href="...">.

    const uploadWrap  = el("div", "upload-wrap", imgPanel);
    const uploadLabel = el("label", "upload-label", uploadWrap);

    // Upload zone inner content
    uploadLabel.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
           width="28" height="28" class="upload-icon">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <span class="upload-text">Click or drag to upload</span>
      <span class="upload-hint">PNG · JPG · SVG</span>`;

    const uploadInput = el("input", "upload-input", uploadLabel);
    uploadInput.type   = "file";
    uploadInput.accept = "image/png,image/jpeg,image/jpg,image/svg+xml,.svg";

    // Small preview strip below the drop zone
    const uploadPreview = el("img", "upload-preview hidden", uploadWrap);
    const uploadName    = el("span", "upload-name hidden", uploadWrap);

    /**
     * Handle a file chosen via input or drag-drop.
     * For SVG: read as text, convert to base64 data URL (preserves vector quality).
     * For raster: use FileReader.readAsDataURL directly.
     */
    const handleFile = (file) => {
      if (!file) return;
      const isSvg = file.type === "image/svg+xml" ||
                    file.name.toLowerCase().endsWith(".svg");

      const reader = new FileReader();

      reader.onload = evt => {
        let dataUrl;

        if (isSvg) {
          // Encode SVG text as a base64 data URL so it works
          // inside an SVG <image> href attribute cross-browser.
          const svgText = evt.target.result;       // text content
          const b64     = btoa(unescape(encodeURIComponent(svgText)));
          dataUrl       = `data:image/svg+xml;base64,${b64}`;
        } else {
          dataUrl = evt.target.result;              // already a data URL
        }

        uploadPreview.src = dataUrl;
        uploadPreview.classList.remove("hidden");
        uploadName.textContent = `${file.name}  (${isSvg ? "SVG vector" : "raster"})`;
        uploadName.classList.remove("hidden");
        BadgeState.update({ customImageUrl: dataUrl, iconName: "" });
      };

      if (isSvg) {
        reader.readAsText(file);       // SVG → text → base64
      } else {
        reader.readAsDataURL(file);    // raster → data URL directly
      }
    };

    uploadInput.addEventListener("change", e => handleFile(e.target.files[0]));

    // Drag-and-drop support on the label zone
    uploadLabel.addEventListener("dragover",  e => { e.preventDefault(); uploadLabel.classList.add("drag-over"); });
    uploadLabel.addEventListener("dragleave", ()  => uploadLabel.classList.remove("drag-over"));
    uploadLabel.addEventListener("drop", e => {
      e.preventDefault();
      uploadLabel.classList.remove("drag-over");
      handleFile(e.dataTransfer.files[0]);
    });

    const clearBtn = el("button", "clear-img-btn", imgPanel);
    clearBtn.textContent = "✕ Remove image";
    clearBtn.addEventListener("click", () => {
      uploadInput.value = "";
      uploadPreview.src = "";
      uploadPreview.classList.add("hidden");
      uploadName.classList.add("hidden");
      uploadLabel.querySelector(".upload-text").textContent = "Click or drag to upload";
      BadgeState.update({ customImageUrl: null });
    });

    // Image size slider
    rangeSlider(imgPanel, {
      label: "Image size", min: 30, max: 200, step: 5,
      value: 100, unit: "%",
      stateKey: "iconScale",
      transform: v => parseInt(v) / 100,
      display:   v => v + "%"
    });

    // Image X/Y position pad — initialise from current state
    const imgPosLbl = el("p", "sub-heading", imgPanel);
    imgPosLbl.textContent = "Image position (SVG px)";
    const imgState = BadgeState.get();
    xyPad(imgPanel, "iconOffsetX", "iconOffsetY", imgState.iconOffsetX, imgState.iconOffsetY);
  };

  /** University logo: toggle, size slider, XY position pad. */
  const buildLogoSection = (container) => {
    const sec = section("University Logo", container);

    // Show/hide toggle
    const toggleRow = row("Show LTU logo", sec);
    const toggle    = el("label", "toggle-switch", toggleRow);
    const checkbox  = el("input", null, toggle);
    checkbox.type    = "checkbox";
    checkbox.checked = CONFIG.defaults.showUniversityLogo;
    el("span", "toggle-slider", toggle);
    checkbox.addEventListener("change", () => BadgeState.update({ showLogo: checkbox.checked }));

    // Logo size slider
    rangeSlider(sec, {
      label: "Logo size", min: 10, max: 70, step: 1,
      value: Math.round(CONFIG.defaults.universityLogoScale * 100),
      unit: "%",
      stateKey: "logoScale",
      transform: v => parseInt(v) / 100,
      display:   v => v + "%"
    });

    // Logo X/Y position pad — initialise from current state (may be from config or localStorage)
    const posLbl = el("p", "sub-heading", sec);
    posLbl.textContent = "Logo position (SVG px)";
    const logoState = BadgeState.get();
    xyPad(sec, "logoOffsetX", "logoOffsetY", logoState.logoOffsetX, logoState.logoOffsetY);
  };

  // ─── Shape mini-icons ─────────────────────────────────────

  const shapeIcon = shape => ({
    circle: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17"
      fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="3"/>
      <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    square: `<svg viewBox="0 0 40 40"><rect x="3" y="3" width="34" height="34" rx="5"
      fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="3"/>
      <rect x="10" y="10" width="20" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    triangle: `<svg viewBox="0 0 40 40"><polygon points="20,3 37,35 3,35"
      fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="20,12 30,30 10,30" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`
  })[shape] || "";

  // ─── Public init ─────────────────────────────────────────

  const init = async (panelEl, _previewEl) => {
    previewEl = _previewEl;

    buildShapeSelector(panelEl);
    buildColourSection(panelEl);
    buildTextSection(panelEl);
    buildIconSection(panelEl);
    buildLogoSection(panelEl);

    // ── Export panel ────────────────────────────────────────
    // Contains: JPEG quality slider, live file-size meter, download button.

    const exportSec = section("Export", panelEl);

    // JPEG quality slider (30–100%, stored as 0.30–1.0)
    const qualityDefault = Math.round(CONFIG.export.jpegQuality * 100);
    let   currentQuality = CONFIG.export.jpegQuality;

    const qualRow    = el("div", "control-row", exportSec);
    const qualLabel  = el("label", "control-label", qualRow);
    qualLabel.textContent = "JPEG quality";
    const qualInput  = el("input", "control-range", qualRow);
    qualInput.type   = "range";
    qualInput.min    = Math.round(CONFIG.export.jpegQualityMin * 100);
    qualInput.max    = 100;
    qualInput.step   = 1;
    qualInput.value  = qualityDefault;
    const qualVal    = el("span", "range-value", qualRow);
    qualVal.textContent = qualityDefault + "%";

    qualInput.addEventListener("input", () => {
      currentQuality = parseInt(qualInput.value) / 100;
      qualVal.textContent = qualInput.value + "%";
      scheduleEstimate();
    });

    // ── File size meter ──
    const CAP_KB   = CONFIG.export.fileSizeCapKb;
    const CAP_B    = CAP_KB * 1024;

    const meterWrap = el("div", "size-meter-wrap", exportSec);

    // Top row: label + reading
    const meterTop = el("div", "size-meter-top", meterWrap);
    const meterLbl = el("span", "size-meter-label", meterTop);
    meterLbl.textContent = "Est. file size";
    const meterVal = el("span", "size-meter-value", meterTop);
    meterVal.textContent = "— KB";

    // Progress bar
    const meterBar  = el("div", "size-meter-bar", meterWrap);
    const meterFill = el("div", "size-meter-fill", meterBar);

    // Cap label on the right
    const meterCap = el("span", "size-meter-cap", meterWrap);
    meterCap.textContent = `Moodle limit: ${CAP_KB} KB`;

    /**
     * Update the size meter display.
     * @param {number} bytes  – estimated byte count
     */
    const updateMeter = (bytes) => {
      const kb      = bytes / 1024;
      const pct     = Math.min(100, (bytes / CAP_B) * 100);
      const isOver  = bytes > CAP_B;
      const isWarn  = bytes > CAP_B * 0.8;   // amber at 80%

      meterVal.textContent  = kb >= 1 ? kb.toFixed(1) + " KB" : bytes + " B";
      meterFill.style.width = pct.toFixed(1) + "%";

      meterFill.classList.toggle("over",  isOver);
      meterFill.classList.toggle("warn",  !isOver && isWarn);
      meterFill.classList.toggle("ok",    !isOver && !isWarn);
      meterVal.classList.toggle("over-text", isOver);

      expBtn.disabled = isOver;
      expBtn.title    = isOver
        ? `File too large (${kb.toFixed(1)} KB) — reduce quality or export size`
        : "";
    };

    // Debounced estimate — avoid re-rendering on every slider tick
    let _estTimer = null;
    const scheduleEstimate = () => {
      meterVal.textContent = "estimating…";
      clearTimeout(_estTimer);
      _estTimer = setTimeout(runEstimate, 350);
    };

    const runEstimate = async () => {
      const state     = BadgeState.get();
      const svgString = BadgeRenderer.render(state);
      const bytes     = await BadgeExporter.estimateSize(
        svgString, CONFIG.export.outputSize, currentQuality);
      updateMeter(bytes);
    };

    // Re-estimate whenever the badge state changes
    BadgeState.subscribe(() => scheduleEstimate());

    // ── Download button ──
    const expBtn = el("button", "export-btn", exportSec);
    expBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
           width="15" height="15">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      ${CONFIG.ui.exportButtonLabel}`;

    expBtn.addEventListener("click", async () => {
      const state     = BadgeState.get();
      const svgString = BadgeRenderer.render(state);
      const filename  = (state.bottomText || state.topText || "badge")
                          .toLowerCase().replace(/\s+/g, "-");
      expBtn.disabled    = true;
      expBtn.textContent = "Exporting…";
      await BadgeExporter.downloadJpeg(
        svgString, filename, CONFIG.export.outputSize, currentQuality);
      expBtn.disabled  = false;
      expBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
             width="15" height="15">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        ${CONFIG.ui.exportButtonLabel}`;
    });

    // Run an initial estimate once assets are loaded
    setTimeout(scheduleEstimate, 1200);

    // Subscribe → live preview
    BadgeState.subscribe(updatePreview);

    // Load async assets
    await loadLtuLogo();
    await loadTablerSprite();

    // Initial render
    updatePreview(BadgeState.get());
  };

  return { init };

})();

window.BadgeUI = BadgeUI;