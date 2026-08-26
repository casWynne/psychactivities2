/* ==========================================================================
   CCTK Project Planner — ENGINE
   You should not need to edit this file to update questions, guides or
   contacts — that all lives in planner-data.js.
   ========================================================================== */

(function () {
  "use strict";

  const D = window.PLANNER_DATA;
  const $ = (sel, el = document) => el.querySelector(sel);

  /* ---------- State ---------- */

  function freshState() {
    return {
      nodeId: D.startNode,
      answers: {},        // fieldId/record label -> value (forms + questions)
      answerLabels: {},   // fieldId -> the label the field was shown under
      trail: [],          // [{q, a}] decision pathway in order
      guides: [],         // guide ids in order, deduped
      contacts: [],       // contact ids, deduped
      platform: null,     // recommended platform
      flags: [],          // notes for the worksheet
      studyType: null,    // "Quantitative" | "Qualitative"
      quantType: null
    };
  }

  let state = freshState();
  let history = [];       // snapshots for Back

  const clone = (o) => JSON.parse(JSON.stringify(o));

  function pushUnique(arr, items) {
    (Array.isArray(items) ? items : [items]).forEach(i => {
      if (i != null && !arr.includes(i)) arr.push(i);
    });
  }

  /* ---------- Persistence ---------- */

  function save() {
    try {
      localStorage.setItem(D.meta.storageKey, JSON.stringify({ state, history, when: Date.now() }));
    } catch (e) { /* private mode etc. — carry on without saving */ }
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(D.meta.storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.state || !D.nodes[data.state.nodeId]) return null;
      return data;
    } catch (e) { return null; }
  }

  function clearSaved() {
    try { localStorage.removeItem(D.meta.storageKey); } catch (e) {}
  }

  /* ---------- JSON export / import ---------- */

  // Shape check: a plan file must contain a state that lands on a real node.
  function validPlan(obj) {
    return obj && obj.state && typeof obj.state === "object"
      && obj.state.nodeId && D.nodes[obj.state.nodeId]
      && obj.state.answers && typeof obj.state.answers === "object";
  }

  function exportJson() {
    const payload = {
      app: "cctk-project-planner",
      version: D.meta.version,
      exported: new Date().toISOString(),
      state,
      history
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const safe = (answerText(state.answers.workingTitle) || "project-plan")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    a.href = URL.createObjectURL(blob);
    a.download = safe + "-plan.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function importJson(file, onDone) {
    const reader = new FileReader();
    reader.onload = () => {
      let obj;
      try { obj = JSON.parse(reader.result); }
      catch (e) { alert("That file isn't valid JSON. Please choose a plan file exported from this planner."); return; }
      if (obj.app && obj.app !== "cctk-project-planner") {
        alert("That JSON file wasn't exported from this planner, so it can't be loaded.");
        return;
      }
      if (!validPlan(obj)) {
        alert("That file doesn't look like a saved plan (it may be from an older version). Nothing was changed.");
        return;
      }
      state = obj.state;
      history = Array.isArray(obj.history) ? obj.history : [];
      save();
      onDone && onDone();
    };
    reader.onerror = () => alert("Sorry — that file couldn't be read.");
    reader.readAsText(file);
  }

  /* ---------- Effects (guides / contacts / platform / flags) ---------- */

  function applyEffects(fx) {
    if (!fx) return;
    if (fx.guides) pushUnique(state.guides, fx.guides);
    if (fx.contacts) pushUnique(state.contacts, fx.contacts);
    if (fx.platform) state.platform = fx.platform;
    if (fx.flag) pushUnique(state.flags, fx.flag);
  }

  /* ---------- Navigation ---------- */

  function goTo(nodeId) {
    state.nodeId = nodeId;
    save();
    render();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function advance(nodeId) {
    history.push(clone(state));
    goTo(nodeId);
  }

  function goBack() {
    if (!history.length) return;
    state = history.pop();
    save();
    render();
  }

  function restart() {
    clearSaved();
    state = freshState();
    history = [];
    render();
  }

  /* ---------- Rendering ---------- */

  const app = () => $("#app");

  function stepLabel() {
    const n = history.length + 1;
    return `Step ${n}`;
  }

  function shell(innerHTML, { showBack = true, step = true } = {}) {
    const backBtn = showBack && history.length
      ? `<button class="pl-back" id="plBack" type="button" aria-label="Go back one step">&larr; Back</button>`
      : `<span></span>`;
    app().innerHTML = `
      <div class="pl-topline">
        ${backBtn}
        ${step ? `<span class="pl-step">${stepLabel()}</span>` : `<span></span>`}
      </div>
      ${innerHTML}
    `;
    const b = $("#plBack");
    if (b) b.addEventListener("click", goBack);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // The toolbar (save/load/clear) is hidden on the very first screen —
  // there's nothing worth saving yet — and shown once the student is underway.
  function refreshToolbar() {
    const bar = $("#plToolbar");
    if (!bar) return;
    const started = state.nodeId !== D.startNode || Object.keys(state.answers).length > 0 || history.length > 0;
    bar.hidden = !started;
  }

  function render() {
    refreshToolbar();
    const node = D.nodes[state.nodeId];
    if (!node) { shell(`<div class="cctk-card pl-card"><p>Something went wrong — unknown step "${esc(state.nodeId)}".</p></div>`); return; }
    switch (node.type) {
      case "form":      return renderForm(node);
      case "question":  return renderQuestion(node);
      case "info":      return renderInfo(node);
      case "checklist": return renderChecklist(node);
      case "summary":   return renderSummary();
      default:          shell(`<div class="cctk-card pl-card"><p>Unknown step type.</p></div>`);
    }
  }

  /* ---------- Question ---------- */

  function renderQuestion(node) {
    const opts = node.options.map((o, i) => `
      <button class="pl-option" type="button" data-i="${i}">
        <span class="pl-option__label">${esc(o.label)}</span>
        ${o.sub ? `<span class="pl-option__sub">${esc(o.sub)}</span>` : ""}
        ${o.definition ? `<span class="pl-option__what" data-def="${i}" role="button" tabindex="0">What's this?</span>` : ""}
      </button>
      ${o.definition ? `<div class="pl-def" id="def-${i}" hidden><p>${esc(o.definition)}</p></div>` : ""}
    `).join("");

    shell(`
      <div class="pl-question">
        <h2 class="pl-prompt">${esc(node.prompt)}</h2>
        ${node.help ? `<p class="pl-help">${esc(node.help)}</p>` : ""}
        <div class="pl-options">${opts}</div>
      </div>
    `);

    // "What's this?" toggles a definition without selecting the option
    document.querySelectorAll(".pl-option__what").forEach(el => {
      const toggle = (ev) => {
        ev.stopPropagation();
        const d = $("#def-" + el.dataset.def);
        d.hidden = !d.hidden;
        el.textContent = d.hidden ? "What's this?" : "Hide";
      };
      el.addEventListener("click", toggle);
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(e); } });
    });

    document.querySelectorAll(".pl-option").forEach(btn => {
      btn.addEventListener("click", (ev) => {
        if (ev.target.classList.contains("pl-option__what")) return;
        const o = node.options[Number(btn.dataset.i)];
        history.push(clone(state));
        applyEffects(o);
        if (node.record) {
          state.trail.push({ q: node.record, a: o.answer || o.label });
          if (state.nodeId === "study_type") state.studyType = o.answer;
          if (state.nodeId === "quant_type") state.quantType = o.answer;
          if (state.nodeId === "qual_method") state.quantType = null;
        }
        goTo(o.next);
      });
    });
  }

  /* ---------- Info ---------- */

  function renderInfo(node) {
    shell(`
      <div class="cctk-card pl-card pl-info ${node.tone === "warn" ? "pl-info--warn" : ""}">
        <h2>${esc(node.title)}</h2>
        <p>${esc(node.body)}</p>
        <button class="cctk-btn cctk-btn--primary pl-continue" id="plNext" type="button">Continue</button>
      </div>
    `);
    $("#plNext").addEventListener("click", () => advance(node.next));
  }

  /* ---------- Checklist ---------- */

  function renderChecklist(node) {
    const saved = state.answers[state.nodeId] || [];
    const items = node.items.map(it => `
      <label class="pl-check">
        <input type="checkbox" value="${esc(it.id)}" ${saved.includes(it.id) ? "checked" : ""} />
        <span>${esc(it.label)}</span>
      </label>
    `).join("");

    shell(`
      <div class="cctk-card pl-card">
        <h2 class="pl-prompt">${esc(node.prompt)}</h2>
        ${node.help ? `<p class="pl-help">${esc(node.help)}</p>` : ""}
        <div class="pl-checks">${items}</div>
        <button class="cctk-btn cctk-btn--primary pl-continue" id="plNext" type="button">Continue</button>
      </div>
    `);

    $("#plNext").addEventListener("click", () => {
      const ticked = Array.from(document.querySelectorAll(".pl-check input:checked")).map(i => i.value);
      const snap = clone(state);
      snap.answers[state.nodeId] = ticked;   // Back restores the ticks…
      history.push(snap);                     // …but not the guides added below
      state.answers[state.nodeId] = ticked;
      pushUnique(state.guides, node.baseGuides || []);
      const labels = [];
      node.items.forEach(it => {
        if (ticked.includes(it.id)) {
          if (it.guide) pushUnique(state.guides, it.guide);
          labels.push(it.label);
        }
      });
      if (node.record) state.trail.push({ q: node.record, a: labels.length ? labels.join("; ") : "None selected" });
      goTo(node.next);
    });
  }

  /* ---------- Form ---------- */

  function resolveOptions(field) {
    return field.optionList ? D.optionLists[field.optionList] : (field.options || []);
  }

  function renderForm(node) {
    const form = D.forms[node.form];
    const fields = form.fields.map(f => fieldHTML(f)).join("");

    shell(`
      <div class="cctk-card pl-card">
        <h2 class="pl-prompt">${esc(form.title)}</h2>
        ${form.intro ? `<p class="pl-help">${esc(form.intro)}</p>` : ""}
        <div class="pl-form">${fields}</div>
        <p class="pl-formerr" id="plFormErr" hidden></p>
        <button class="cctk-btn cctk-btn--primary pl-continue" id="plNext" type="button">Continue</button>
      </div>
    `);

    // Tick a saved value (radio or checkbox) and, if it's the "other" option,
    // restore and reveal its free-text box.
    function restoreChoice(f, choice) {
      const val = choice && typeof choice === "object" ? choice.value : choice;
      const idx = resolveOptions(f).findIndex(o => o.value === val);
      const r = document.querySelector(`input[name="${f.id}"][value="${CSS.escape(String(val))}"]`);
      if (r) r.checked = true;
      if (choice && typeof choice === "object" && choice.other && idx >= 0) {
        const ot = $(`#${f.id}__${idx}__other`);
        if (ot) { ot.value = choice.other; ot.closest(".pl-other").hidden = false; }
      }
    }

    // restore saved values
    form.fields.forEach(f => {
      const v = state.answers[f.id];
      if (v == null) return;
      if (f.type === "radio") {
        restoreChoice(f, v);
      } else if (f.type === "checkboxes") {
        (Array.isArray(v) ? v : []).forEach(choice => restoreChoice(f, choice));
      } else if (f.type === "design") {
        /* design fields mount their own interactive UI below */
      } else if (f.type === "demographics" || f.type === "questionnaires" || f.type === "stimuli") {
        /* extras mount their own interactive UI below */
      } else {
        const el = $(`#f_${f.id}`);
        if (el) el.value = v;
      }
    });

    // Build the interactive design repeater(s) for this form
    DESIGN.mountAll(form);
    // Build demographics / questionnaires / stimuli widgets
    EXTRAS.mountAll(form);

    // show/hide each option's own "other" box as it's ticked/unticked
    form.fields.forEach(f => {
      if (f.type !== "radio" && f.type !== "checkboxes") return;
      document.querySelectorAll(`input[name="${f.id}"]`).forEach(r => {
        const key = r.getAttribute("data-other-key");
        if (!key) return;
        r.addEventListener("change", () => {
          const wrap = $(`#${key}__wrap`);
          if (wrap) wrap.hidden = !r.checked;
        });
      });
    });

    $("#plNext").addEventListener("click", () => {
      const err = $("#plFormErr");
      const missing = [];
      const collected = {};

      // Build a {value, other?} object for one ticked input.
      const choiceFor = (f, input) => {
        const opt = resolveOptions(f).find(o => o.value === input.value);
        const val = { value: input.value };
        if (opt && opt.other) {
          const key = input.getAttribute("data-other-key");
          const ot = key ? $(`#${key}__other`) : null;
          if (ot && ot.value.trim()) val.other = ot.value.trim();
        }
        return val;
      };

      form.fields.forEach(f => {
        if (f.type === "radio") {
          const picked = document.querySelector(`input[name="${f.id}"]:checked`);
          if (picked) collected[f.id] = choiceFor(f, picked);
          else if (f.required) missing.push(f.label);
        } else if (f.type === "checkboxes") {
          const picked = Array.from(document.querySelectorAll(`input[name="${f.id}"]:checked`));
          // Checkboxes here always need at least one tick.
          if (picked.length) collected[f.id] = picked.map(p => choiceFor(f, p));
          else missing.push(f.label);
        } else if (f.type === "design") {
          const res = DESIGN.read(f);
          if (res.error) missing.push(`${f.label} (${res.error})`);
          else collected[f.id] = res.value;
        } else if (f.type === "demographics" || f.type === "questionnaires" || f.type === "stimuli") {
          const res = EXTRAS.read(f);
          if (res.error) missing.push(`${f.label} (${res.error})`);
          else if (res.value != null) collected[f.id] = res.value;
        } else {
          const el = $(`#f_${f.id}`);
          const v = el ? el.value.trim() : "";
          if (v) collected[f.id] = v;
          else if (f.required) missing.push(f.label);
        }
      });

      if (missing.length) {
        err.hidden = false;
        err.textContent = "Please complete: " + missing.join(", ");
        return;
      }

      // Record the label each answered field was shown under, so the summary
      // and worksheet use the current form's wording (field ids are shared
      // across forms but their labels can differ).
      const labelUpdates = {};
      form.fields.forEach(f => { if (f.id in collected) labelUpdates[f.id] = f.label; });

      // Snapshot keeps the typed values (so Back restores them) but not the
      // side effects applied below (so Back undoes flags/contacts cleanly).
      const snap = clone(state);
      Object.assign(snap.answers, collected);
      snap.answerLabels = Object.assign({}, snap.answerLabels, labelUpdates);
      history.push(snap);
      Object.assign(state.answers, collected);
      state.answerLabels = Object.assign({}, state.answerLabels, labelUpdates);

      // participant-group side effects (flags + contacts) from option lists
      form.fields.forEach(f => {
        if (f.type !== "radio" && f.type !== "checkboxes") return;
        const v = collected[f.id];
        if (!v) return;
        const chosen = Array.isArray(v) ? v : [v];
        chosen.forEach(c => {
          const opt = resolveOptions(f).find(o => o.value === c.value);
          if (opt) applyEffects(opt);
        });
      });

      goTo(node.next);
    });
  }

  function fieldHTML(f) {
    const req = f.required ? ` <span class="pl-req" aria-hidden="true">*</span>` : "";
    const hint = f.hint ? `<span class="pl-hint">${esc(f.hint)}</span>` : "";
    if (f.type === "radio" || f.type === "checkboxes") {
      const inputType = f.type === "checkboxes" ? "checkbox" : "radio";
      const opts = resolveOptions(f).map((o, i) => `
        <label class="pl-radio">
          <input type="${inputType}" name="${esc(f.id)}" value="${esc(o.value)}" ${o.other ? `data-other-key="${esc(f.id)}__${i}"` : ""} />
          <span>${esc(o.value)}</span>
        </label>
        ${o.other ? `<div class="pl-other" id="${esc(f.id)}__${i}__wrap" hidden><input type="text" id="${esc(f.id)}__${i}__other" placeholder="Please specify…" /></div>` : ""}
      `).join("");
      return `<fieldset class="pl-field"><legend>${esc(f.label)}${req}</legend>${hint}<div class="pl-radios">${opts}</div></fieldset>`;
    }
    if (f.type === "design") {
      // The interactive contents are built by mountDesign() after render.
      return `<fieldset class="pl-field pl-design" data-design="${esc(f.id)}" data-mode="${esc(f.designMode || "experimental")}">
        <legend>${esc(f.label)}${req}</legend>${hint}
        <div class="pl-design__body" id="design_${esc(f.id)}"></div>
      </fieldset>`;
    }
    if (f.type === "demographics" || f.type === "questionnaires" || f.type === "stimuli") {
      // Interactive contents are built by the EXTRAS module after render.
      return `<fieldset class="pl-field pl-extra" data-extra="${esc(f.id)}" data-kind="${esc(f.type)}">
        <legend>${esc(f.label)}${f.type === "demographics" ? req : ""}</legend>${hint}
        <div id="extra_${esc(f.id)}"></div>
      </fieldset>`;
    }
    const common = `id="f_${esc(f.id)}" ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""}`;
    let input;
    if (f.type === "textarea") input = `<textarea ${common} rows="3"></textarea>`;
    else if (f.type === "number") input = `<input type="number" ${common} ${f.min != null ? `min="${f.min}"` : ""} inputmode="numeric" />`;
    else input = `<input type="${esc(f.type)}" ${common} />`;
    return `<div class="pl-field"><label for="f_${esc(f.id)}">${esc(f.label)}${req}</label>${hint}${input}</div>`;
  }

  /* ======================================================================
     DESIGN FIELD
     A structured IV/DV builder. Two modes:
       experimental — IVs are factors with levels + between/within allocation;
                      the design label ("2×2 mixed design") is DERIVED.
       measured     — predictors & outcomes, no allocation (correlational,
                      questionnaire, secondary data).
     Stored value shape:
       { mode, ivs:[{name, levels:[..], alloc}], dvs:[{name, type, other?}] }
     ====================================================================== */

  const DESIGN = (function () {

    function blankIV(mode) {
      return mode === "experimental"
        ? { name: "", levels: ["", ""], alloc: "between" }
        : { name: "" };
    }
    function blankDV() { return { name: "", type: "", other: "" }; }

    function emptyValue(mode) {
      return { mode, ivs: [blankIV(mode)], dvs: [blankDV()] };
    }

    // Turn factor allocations into a human design description.
    // Returns { label, summary } or null when there aren't enough named factors.
    function derive(value) {
      if (!value || value.mode !== "experimental") return null;
      const factors = value.ivs.filter(iv => iv.name && iv.name.trim());
      if (!factors.length) return null;

      const levelCounts = factors.map(iv => (iv.levels || []).filter(l => l && l.trim()).length || 0);
      const allBetween = factors.every(iv => iv.alloc === "between");
      const allWithin = factors.every(iv => iv.alloc === "within");

      let kind;
      if (factors.length === 1) kind = allWithin ? "within-subjects (repeated measures)" : "between-subjects";
      else if (allBetween) kind = "between-subjects";
      else if (allWithin) kind = "within-subjects (repeated measures)";
      else kind = "mixed";

      // "2×2", "2×3×2" — only when every factor has a level count
      const dims = levelCounts.every(c => c >= 2) ? levelCounts.join("×") + " " : "";
      const label = factors.length === 1
        ? `Single-factor ${kind} design`
        : `${dims}${kind} design`;

      // Plain-English sentence
      const parts = factors.map(iv => `${iv.name.trim()} (${iv.alloc})`);
      let sentence;
      if (factors.length === 1) {
        const iv = factors[0];
        sentence = iv.alloc === "within"
          ? `Every participant experiences all levels of ${iv.name.trim()}.`
          : `Each participant is in one level of ${iv.name.trim()} only.`;
      } else {
        const betweens = factors.filter(iv => iv.alloc === "between").map(iv => iv.name.trim());
        const withins = factors.filter(iv => iv.alloc === "within").map(iv => iv.name.trim());
        const bits = [];
        if (betweens.length) bits.push(`is tested in one level of ${listWords(betweens)}`);
        if (withins.length) bits.push(`experiences all levels of ${listWords(withins)}`);
        sentence = `Factors: ${parts.join(" × ")}. Each participant ${bits.join(", and ")}.`;
      }
      return { label, summary: sentence };
    }

    function listWords(arr) {
      if (arr.length === 1) return arr[0];
      return arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];
    }

    /* ---- Interactive mount ---- */

    // Live working copies keyed by field id, so edits persist across re-renders
    // within a single form view without touching global state until Continue.
    let working = {};

    function mountAll(form) {
      working = {};
      form.fields.forEach(f => {
        if (f.type !== "design") return;
        const mode = f.designMode || "experimental";
        const saved = state.answers[f.id];
        working[f.id] = (saved && saved.mode === mode)
          ? clone(saved)
          : emptyValue(mode);
        paint(f.id, mode);
      });
    }

    function paint(fieldId, mode) {
      const host = document.getElementById("design_" + fieldId);
      if (!host) return;
      const v = working[fieldId];
      const isExp = mode === "experimental";

      const ivTitle = isExp ? "Independent variables (factors)" : "Predictor variable(s)";
      const dvTitle = isExp ? "Dependent variables (what you measure)" : "Outcome variable(s)";
      const ivAdd = isExp ? "Add another factor" : "Add another predictor";

      const ivCards = v.ivs.map((iv, i) => ivCard(iv, i, mode)).join("");
      const dvCards = v.dvs.map((dv, i) => dvCard(dv, i)).join("");

      const derived = derive(v);
      const banner = isExp
        ? `<div class="pl-design__derived ${derived ? "" : "is-empty"}">
             ${derived
               ? `<span class="pl-design__label">${esc(derived.label)}</span>
                  <span class="pl-design__summary">${esc(derived.summary)}</span>`
               : `<span class="pl-design__summary">Name your factors and set how each is administered — the design type will appear here.</span>`}
           </div>`
        : "";

      host.innerHTML = `
        <div class="pl-design__group">
          <h4 class="pl-design__h">${esc(ivTitle)}</h4>
          <div class="pl-design__list" data-role="ivs">${ivCards}</div>
          <button type="button" class="pl-design__add" data-add="iv">+ ${esc(ivAdd)}</button>
        </div>
        ${banner}
        <div class="pl-design__group">
          <h4 class="pl-design__h">${esc(dvTitle)}</h4>
          <div class="pl-design__list" data-role="dvs">${dvCards}</div>
          <button type="button" class="pl-design__add" data-add="dv">+ Add another ${isExp ? "measure" : "outcome"}</button>
        </div>
      `;
      wire(fieldId, mode);
    }

    function ivCard(iv, i, mode) {
      const canRemove = true;
      if (mode !== "experimental") {
        return `<div class="pl-design__card" data-iv="${i}">
          <div class="pl-design__row">
            <input type="text" class="pl-design__name" data-k="name" value="${esc(iv.name || "")}" placeholder="e.g. Trait anxiety" />
            <button type="button" class="pl-design__rm" data-rm="iv" title="Remove" aria-label="Remove predictor">×</button>
          </div>
        </div>`;
      }
      const levels = (iv.levels || []).map((lv, li) => `
        <span class="pl-design__level">
          <input type="text" data-level="${li}" value="${esc(lv)}" placeholder="Level ${li + 1}" />
          ${(iv.levels.length > 2) ? `<button type="button" class="pl-design__level-rm" data-rmlevel="${li}" aria-label="Remove level">×</button>` : ""}
        </span>`).join("");
      return `<div class="pl-design__card" data-iv="${i}">
        <div class="pl-design__row">
          <input type="text" class="pl-design__name" data-k="name" value="${esc(iv.name || "")}" placeholder="e.g. Sleep condition" />
          <button type="button" class="pl-design__rm" data-rm="iv" title="Remove factor" aria-label="Remove factor">×</button>
        </div>
        <div class="pl-design__levels">
          <span class="pl-design__mini">Levels</span>
          ${levels}
          <button type="button" class="pl-design__level-add" data-addlevel="1">+ level</button>
        </div>
        <div class="pl-design__alloc">
          <label class="pl-design__allocopt ${iv.alloc === "between" ? "is-on" : ""}">
            <input type="radio" name="alloc_${i}" data-alloc="between" ${iv.alloc === "between" ? "checked" : ""} />
            <span><strong>Between-subjects</strong><small>each participant is in one level only</small></span>
          </label>
          <label class="pl-design__allocopt ${iv.alloc === "within" ? "is-on" : ""}">
            <input type="radio" name="alloc_${i}" data-alloc="within" ${iv.alloc === "within" ? "checked" : ""} />
            <span><strong>Within-subjects</strong><small>each participant does every level</small></span>
          </label>
        </div>
      </div>`;
    }

    function dvCard(dv, i) {
      const opts = D.optionLists.dvTypes.map(o =>
        `<option value="${esc(o.value)}" ${dv.type === o.value ? "selected" : ""}>${esc(o.value)}</option>`).join("");
      const isOther = D.optionLists.dvTypes.some(o => o.other && o.value === dv.type);
      return `<div class="pl-design__card" data-dv="${i}">
        <div class="pl-design__row">
          <input type="text" class="pl-design__name" data-k="name" value="${esc(dv.name || "")}" placeholder="e.g. Recognition accuracy" />
          <button type="button" class="pl-design__rm" data-rm="dv" title="Remove" aria-label="Remove measure">×</button>
        </div>
        <select class="pl-design__type" data-k="type">
          <option value="">How is it measured?…</option>
          ${opts}
        </select>
        <input type="text" class="pl-design__typeother" data-k="other" value="${esc(dv.other || "")}" placeholder="Please specify…" ${isOther ? "" : "hidden"} />
      </div>`;
    }

    function wire(fieldId, mode) {
      const host = document.getElementById("design_" + fieldId);
      const v = working[fieldId];

      // add IV / DV
      host.querySelectorAll("[data-add]").forEach(btn => btn.addEventListener("click", () => {
        if (btn.dataset.add === "iv") v.ivs.push(blankIV(mode));
        else v.dvs.push(blankDV());
        paint(fieldId, mode);
      }));

      // IV cards
      host.querySelectorAll("[data-iv]").forEach(card => {
        const i = Number(card.dataset.iv);
        const iv = v.ivs[i];
        const nameEl = card.querySelector('[data-k="name"]');
        if (nameEl) nameEl.addEventListener("input", () => { iv.name = nameEl.value; refreshBanner(fieldId, mode); });

        card.querySelectorAll("[data-level]").forEach(el => {
          el.addEventListener("input", () => { iv.levels[Number(el.dataset.level)] = el.value; refreshBanner(fieldId, mode); });
        });
        card.querySelectorAll("[data-rmlevel]").forEach(btn => btn.addEventListener("click", () => {
          iv.levels.splice(Number(btn.dataset.rmlevel), 1); paint(fieldId, mode);
        }));
        const addLevel = card.querySelector("[data-addlevel]");
        if (addLevel) addLevel.addEventListener("click", () => { iv.levels.push(""); paint(fieldId, mode); });

        card.querySelectorAll("[data-alloc]").forEach(r => r.addEventListener("change", () => {
          iv.alloc = r.dataset.alloc; paint(fieldId, mode);
        }));

        const rm = card.querySelector('[data-rm="iv"]');
        if (rm) rm.addEventListener("click", () => {
          v.ivs.splice(i, 1);
          if (!v.ivs.length) v.ivs.push(blankIV(mode));
          paint(fieldId, mode);
        });
      });

      // DV cards
      host.querySelectorAll("[data-dv]").forEach(card => {
        const i = Number(card.dataset.dv);
        const dv = v.dvs[i];
        const nameEl = card.querySelector('[data-k="name"]');
        if (nameEl) nameEl.addEventListener("input", () => { dv.name = nameEl.value; });
        const typeEl = card.querySelector('[data-k="type"]');
        const otherEl = card.querySelector('[data-k="other"]');
        if (typeEl) typeEl.addEventListener("change", () => {
          dv.type = typeEl.value;
          const isOther = D.optionLists.dvTypes.some(o => o.other && o.value === dv.type);
          if (otherEl) { otherEl.hidden = !isOther; if (!isOther) { otherEl.value = ""; dv.other = ""; } }
        });
        if (otherEl) otherEl.addEventListener("input", () => { dv.other = otherEl.value; });
        const rm = card.querySelector('[data-rm="dv"]');
        if (rm) rm.addEventListener("click", () => {
          v.dvs.splice(i, 1);
          if (!v.dvs.length) v.dvs.push(blankDV());
          paint(fieldId, mode);
        });
      });
    }

    // Update only the derived banner (cheap; avoids losing input focus)
    function refreshBanner(fieldId, mode) {
      if (mode !== "experimental") return;
      const host = document.getElementById("design_" + fieldId);
      const banner = host.querySelector(".pl-design__derived");
      if (!banner) return;
      const d = derive(working[fieldId]);
      banner.classList.toggle("is-empty", !d);
      banner.innerHTML = d
        ? `<span class="pl-design__label">${esc(d.label)}</span><span class="pl-design__summary">${esc(d.summary)}</span>`
        : `<span class="pl-design__summary">Name your factors and set how each is administered — the design type will appear here.</span>`;
    }

    /* ---- Read + validate on Continue ---- */
    // Returns { value, error } — error is a string when invalid.
    function read(f) {
      const v = working[f.id];
      const mode = f.designMode || "experimental";
      // Clean copy: drop blank levels, trim names
      const ivs = v.ivs
        .map(iv => mode === "experimental"
          ? { name: (iv.name || "").trim(), levels: (iv.levels || []).map(l => (l || "").trim()).filter(Boolean), alloc: iv.alloc }
          : { name: (iv.name || "").trim() })
        .filter(iv => iv.name);
      const dvs = v.dvs
        .map(dv => ({ name: (dv.name || "").trim(), type: dv.type || "", other: (dv.other || "").trim() }))
        .filter(dv => dv.name);

      if (!ivs.length) return { error: mode === "experimental" ? "add at least one named factor (IV)" : "add at least one named predictor" };
      if (!dvs.length) return { error: "add at least one named " + (mode === "experimental" ? "measure (DV)" : "outcome") };
      if (mode === "experimental") {
        const thin = ivs.find(iv => iv.levels.length < 2);
        if (thin) return { error: `factor “${thin.name}” needs at least two levels` };
      }
      return { value: { mode, ivs, dvs } };
    }

    /* ---- Text rendering for summary + worksheet ---- */
    function toLines(value) {
      if (!value) return [];
      const isExp = value.mode === "experimental";
      const lines = [];
      const d = derive(value);
      if (d) lines.push({ kind: "design", text: `${d.label} — ${d.summary}` });
      value.ivs.forEach(iv => {
        if (isExp) {
          const lv = iv.levels && iv.levels.length ? ` (${iv.levels.join(", ")})` : "";
          lines.push({ kind: "iv", text: `${iv.name}${lv} — ${iv.alloc}-subjects` });
        } else {
          lines.push({ kind: "iv", text: iv.name });
        }
      });
      value.dvs.forEach(dv => {
        const t = dv.type ? ` — ${dv.other ? dv.type.replace(/Other.*/, dv.other) : dv.type}` : "";
        lines.push({ kind: "dv", text: `${dv.name}${t}` });
      });
      return lines;
    }

    return { emptyValue, derive, mountAll, read, toLines };
  })();

  /* ======================================================================
     EXTRAS: demographics, questionnaires, stimuli
     Three small interactive field types. Like DESIGN they keep live working
     copies and only commit to state on Continue.
       demographics  → [{value, custom?}]   (required: at least one)
       questionnaires→ [{name, doi?}]        (optional)
       stimuli       → {has, url?, description?}  (optional)
     ====================================================================== */

  const EXTRAS = (function () {

    let working = {}; // fieldId -> value

    function defaultFor(kind) {
      if (kind === "demographics") return { picked: [], custom: [] };
      if (kind === "questionnaires") return { items: [{ name: "", doi: "" }] };
      return { has: "", url: "", description: "" }; // stimuli
    }

    function toWorking(kind, saved) {
      if (kind === "demographics") {
        if (!Array.isArray(saved)) return defaultFor(kind);
        return {
          picked: saved.filter(d => !d.custom).map(d => d.value),
          custom: saved.filter(d => d.custom).map(d => d.value)
        };
      }
      if (kind === "questionnaires") {
        if (!Array.isArray(saved) || !saved.length) return defaultFor(kind);
        return { items: saved.map(q => ({ name: q.name || "", doi: q.doi || "" })) };
      }
      // stimuli
      if (!saved || typeof saved !== "object") return defaultFor(kind);
      return { has: saved.has || "", url: saved.url || "", description: saved.description || "" };
    }

    function mountAll(form) {
      working = {};
      form.fields.forEach(f => {
        if (!["demographics", "questionnaires", "stimuli"].includes(f.type)) return;
        const saved = state.answers[f.id];
        working[f.id] = saved != null ? toWorking(f.type, saved) : defaultFor(f.type);
        paint(f);
      });
    }

    function host(id) { return document.getElementById("extra_" + id); }

    function paint(f) {
      if (f.type === "demographics") return paintDemographics(f);
      if (f.type === "questionnaires") return paintQuestionnaires(f);
      return paintStimuli(f);
    }

    /* ---- Demographics ---- */
    function paintDemographics(f) {
      const el = host(f.id); if (!el) return;
      const v = working[f.id];
      const opts = (D.optionLists[f.optionList] || []).map((o, i) => {
        const on = v.picked.includes(o.value);
        return `<label class="pl-check">
          <input type="checkbox" data-demo="${i}" value="${esc(o.value)}" ${on ? "checked" : ""} ${o.exclusive ? 'data-exclusive="1"' : ""} />
          <span>${esc(o.value)}</span>
        </label>`;
      }).join("");
      const customRows = v.custom.map((c, i) => `
        <span class="pl-design__level">
          <input type="text" data-custom="${i}" value="${esc(c)}" placeholder="e.g. Handedness" />
          <button type="button" class="pl-design__level-rm" data-rmcustom="${i}" aria-label="Remove">×</button>
        </span>`).join("");
      el.innerHTML = `
        <div class="pl-checks">${opts}</div>
        <div class="pl-extra__custom">
          <span class="pl-design__mini">Add your own</span>
          ${customRows}
          <button type="button" class="pl-design__level-add" data-addcustom="1">+ demographic</button>
        </div>`;
      wireDemographics(f);
    }

    function wireDemographics(f) {
      const el = host(f.id); const v = working[f.id];
      el.querySelectorAll("[data-demo]").forEach(cbx => cbx.addEventListener("change", () => {
        const val = cbx.value;
        const exclusive = cbx.getAttribute("data-exclusive") === "1";
        if (cbx.checked) {
          if (exclusive) v.picked = [val];                       // "None" clears the rest
          else { v.picked = v.picked.filter(x => !isExclusive(f, x)); v.picked.push(val); }
        } else {
          v.picked = v.picked.filter(x => x !== val);
        }
        paintDemographics(f);
      }));
      el.querySelectorAll("[data-custom]").forEach(inp => inp.addEventListener("input", () => {
        v.custom[Number(inp.dataset.custom)] = inp.value;
      }));
      el.querySelectorAll("[data-rmcustom]").forEach(btn => btn.addEventListener("click", () => {
        v.custom.splice(Number(btn.dataset.rmcustom), 1); paintDemographics(f);
      }));
      const add = el.querySelector("[data-addcustom]");
      if (add) add.addEventListener("click", () => { v.custom.push(""); paintDemographics(f); });
    }

    function isExclusive(f, value) {
      const o = (D.optionLists[f.optionList] || []).find(o => o.value === value);
      return o && o.exclusive;
    }

    /* ---- Questionnaires ---- */
    function paintQuestionnaires(f) {
      const el = host(f.id); if (!el) return;
      const v = working[f.id];
      const rows = v.items.map((it, i) => `
        <div class="pl-design__card" data-qn="${i}">
          <div class="pl-design__row">
            <input type="text" class="pl-design__name" data-k="name" value="${esc(it.name || "")}" placeholder="e.g. PHQ-9, Big Five Inventory" />
            <button type="button" class="pl-design__rm" data-rmqn="${i}" aria-label="Remove questionnaire">×</button>
          </div>
          <input type="text" class="pl-extra__doi" data-k="doi" value="${esc(it.doi || "")}" placeholder="DOI or reference (optional) — e.g. 10.1001/…" />
        </div>`).join("");
      el.innerHTML = `
        <div class="pl-design__list">${rows}</div>
        <button type="button" class="pl-design__add" data-addqn="1">+ Add a questionnaire</button>
        <p class="pl-extra__note">Leave blank if you're not using any standard scales.</p>`;
      wireQuestionnaires(f);
    }

    function wireQuestionnaires(f) {
      const el = host(f.id); const v = working[f.id];
      el.querySelectorAll("[data-qn]").forEach(card => {
        const i = Number(card.dataset.qn);
        card.querySelectorAll("[data-k]").forEach(inp => inp.addEventListener("input", () => {
          v.items[i][inp.dataset.k] = inp.value;
        }));
      });
      el.querySelectorAll("[data-rmqn]").forEach(btn => btn.addEventListener("click", () => {
        v.items.splice(Number(btn.dataset.rmqn), 1);
        if (!v.items.length) v.items.push({ name: "", doi: "" });
        paintQuestionnaires(f);
      }));
      const add = el.querySelector("[data-addqn]");
      if (add) add.addEventListener("click", () => { v.items.push({ name: "", doi: "" }); paintQuestionnaires(f); });
    }

    /* ---- Stimuli ---- */
    function paintStimuli(f) {
      const el = host(f.id); if (!el) return;
      const v = working[f.id];
      const opt = (val, label) => `
        <label class="pl-radio">
          <input type="radio" name="stim_${esc(f.id)}" value="${val}" ${v.has === val ? "checked" : ""} />
          <span>${esc(label)}</span>
        </label>`;
      const details = v.has === "yes" ? `
        <div class="pl-extra__stimdetails">
          <label class="pl-extra__sublabel" for="stimurl_${esc(f.id)}">Link to your stimuli (optional)</label>
          <input type="url" id="stimurl_${esc(f.id)}" class="pl-extra__doi" value="${esc(v.url || "")}" placeholder="https://osf.io/… or a shared drive link" />
          <label class="pl-extra__sublabel" for="stimdesc_${esc(f.id)}">Describe your stimuli</label>
          <textarea id="stimdesc_${esc(f.id)}" rows="3">${esc(v.description || "")}</textarea>
          <span class="pl-hint">Good practice to note here: naming convention, file format(s), number of items, and any licensing/source.</span>
        </div>` : "";
      el.innerHTML = `
        <div class="pl-radios">
          ${opt("yes", "Yes — I have my stimuli / materials")}
          ${opt("developing", "Not yet — still sourcing or creating them")}
          ${opt("na", "Not applicable to my study")}
        </div>
        ${details}`;
      wireStimuli(f);
    }

    function wireStimuli(f) {
      const el = host(f.id); const v = working[f.id];
      el.querySelectorAll(`input[name="stim_${f.id}"]`).forEach(r => r.addEventListener("change", () => {
        v.has = r.value; paintStimuli(f);
      }));
      const url = el.querySelector(`#stimurl_${f.id}`);
      if (url) url.addEventListener("input", () => { v.url = url.value; });
      const desc = el.querySelector(`#stimdesc_${f.id}`);
      if (desc) desc.addEventListener("input", () => { v.description = desc.value; });
    }

    /* ---- Read + validate ---- */
    function read(f) {
      const v = working[f.id];
      if (f.type === "demographics") {
        const picked = (v.picked || []).slice();
        const custom = (v.custom || []).map(c => (c || "").trim()).filter(Boolean);
        const all = picked.concat(custom.map(c => c));
        if (!all.length) return { error: "tick at least one, or choose “None”" };
        // Store presets and customs distinctly so the worksheet can label them.
        const value = picked.map(p => ({ value: p, demo: true }))
          .concat(custom.map(c => ({ value: c, demo: true, custom: true })));
        return { value };
      }
      if (f.type === "questionnaires") {
        const items = (v.items || [])
          .map(it => ({ name: (it.name || "").trim(), doi: (it.doi || "").trim() }))
          .filter(it => it.name);
        return { value: items.length ? items : null }; // optional
      }
      // stimuli (optional)
      const has = v.has || "";
      if (!has) return { value: null };
      const value = { has };
      if (has === "yes") {
        if (v.url && v.url.trim()) value.url = v.url.trim();
        if (v.description && v.description.trim()) value.description = v.description.trim();
      }
      return { value };
    }

    /* ---- Text helpers for summary + docx ---- */
    function demographicsText(v) {
      if (!Array.isArray(v)) return "";
      return v.map(d => d.value).join(", ");
    }
    function questionnairesText(v) {
      if (!Array.isArray(v)) return "";
      return v.map(q => q.doi ? `${q.name} (${q.doi})` : q.name).join("; ");
    }
    function stimuliLabel(has) {
      return has === "yes" ? "Have stimuli"
           : has === "developing" ? "Still sourcing / creating"
           : has === "na" ? "Not applicable" : "";
    }
    function stimuliText(v) {
      if (!v || !v.has) return "";
      const bits = [stimuliLabel(v.has)];
      if (v.url) bits.push(v.url);
      if (v.description) bits.push(v.description);
      return bits.join(" — ");
    }

    return { mountAll, read, demographicsText, questionnairesText, stimuliText, stimuliLabel };
  })();

  /* ---------- Summary ---------- */

  function guideURL(id) {
    return D.meta.guideBase + D.guides[id].file;
  }

  function summaryGuides() {
    const ids = state.guides.slice();
    // Gorilla experiment paths: add the Sona-for-Gorilla guide automatically
    // if the student said they're recruiting via RPS.
    const rec = state.answers.recruitment;
    const recText = rec ? answerText(rec) : "";
    if (state.platform === "Gorilla" && /RPS/i.test(recText) && !ids.includes("g_sona_gorilla")) {
      ids.push("g_sona_gorilla");
    }
    return ids;
  }

  function summaryContacts() {
    const ids = state.contacts.slice();
    // The technician is always a sensible first port of call for set-up.
    if (!ids.includes("technician")) ids.push("technician");
    if (!ids.includes("supervisor")) ids.push("supervisor");
    return ids.map(id => {
      const c = clone(D.contacts[id]);
      if (id === "supervisor" && state.answers.supervisorEmail) c.email = state.answers.supervisorEmail;
      return c;
    }).filter(c => c.email);
  }

  function fieldLabelMap() {
    const map = {};
    Object.values(D.forms).forEach(form => form.fields.forEach(f => { map[f.id] = f.label; }));
    // Session-recorded labels win: they reflect the exact form the student used.
    Object.assign(map, state.answerLabels || {});
    return map;
  }

  function choiceText(c) {
    if (c && typeof c === "object") return c.other ? `${c.value} — ${c.other}` : c.value;
    return String(c);
  }

  function answerText(v) {
    if (v == null) return "";
    if (v && typeof v === "object" && !Array.isArray(v) && v.mode && (v.ivs || v.dvs)) {
      return DESIGN.toLines(v).map(l => l.text).join("\n");
    }
    if (v && typeof v === "object" && !Array.isArray(v) && v.has) {
      return EXTRAS.stimuliText(v);                       // stimuli
    }
    if (Array.isArray(v) && v.length && v[0] && typeof v[0] === "object" && "name" in v[0]) {
      return EXTRAS.questionnairesText(v);                // questionnaires
    }
    if (Array.isArray(v) && v.length && v[0] && typeof v[0] === "object" && v[0].demo) {
      return EXTRAS.demographicsText(v);                  // demographics
    }
    if (Array.isArray(v)) return v.map(choiceText).join("; ");
    return choiceText(v);
  }

  function renderSummary() {
    const labels = fieldLabelMap();
    const isDesign = (v) => v && typeof v === "object" && !Array.isArray(v) && v.mode && (v.ivs || v.dvs);
    const detailRows = Object.entries(state.answers)
      .filter(([k]) => labels[k])
      .map(([k, v]) => {
        if (isDesign(v)) {
          const lines = DESIGN.toLines(v);
          const body = lines.map(l => l.kind === "design"
            ? `<div class="pl-design-out__label">${esc(l.text)}</div>`
            : `<div class="pl-design-out__var"><span class="pl-design-out__tag">${l.kind.toUpperCase()}</span>${esc(l.text)}</div>`
          ).join("");
          return `<div class="pl-sumrow"><dt>${esc(labels[k])}</dt><dd class="pl-design-out">${body}</dd></div>`;
        }
        return `<div class="pl-sumrow"><dt>${esc(labels[k])}</dt><dd>${esc(answerText(v)) || "—"}</dd></div>`;
      })
      .join("");

    const trailRows = state.trail
      .map(t => `<div class="pl-sumrow"><dt>${esc(t.q)}</dt><dd>${esc(t.a)}</dd></div>`)
      .join("");

    const guides = summaryGuides();
    const guideItems = guides.length
      ? guides.map(id => `<li><a href="${esc(guideURL(id))}" target="_blank" rel="noopener">${esc(D.guides[id].label)}</a></li>`).join("")
      : `<li class="cctk-muted">No specific guides for this pathway — your contacts below can point you in the right direction.</li>`;

    const contacts = summaryContacts();
    const contactItems = contacts.map(c => `
      <li><a href="mailto:${esc(c.email)}">${esc(c.name)}</a>
        <span class="cctk-muted cctk-small"> — ${esc(c.note || "")} (${esc(c.email)})</span></li>
    `).join("");

    const flags = state.flags.length
      ? `<div class="pl-flags"><h3>Before you go any further</h3><ul>${state.flags.map(f => `<li>${esc(f)}</li>`).join("")}</ul></div>`
      : "";

    shell(`
      <div class="pl-summary">
        <h2 class="pl-prompt">Your project plan</h2>
        <p class="pl-help">Everything below goes into your worksheet. Download it, keep editing it, and bring it to meetings with your supervisor and the technician.</p>

        ${state.platform ? `<div class="pl-platform">Recommended platform: <strong>${esc(state.platform)}</strong></div>` : ""}
        ${flags}

        <section class="cctk-card pl-card">
          <h3>${esc(state.answers.workingTitle || "Untitled project")}</h3>
          <dl class="pl-sumlist">${detailRows}</dl>
        </section>

        <section class="cctk-card pl-card">
          <h3>Your decisions</h3>
          <dl class="pl-sumlist">${trailRows}</dl>
        </section>

        <section class="cctk-card pl-card">
          <h3>Your guide pack</h3>
          <ul class="pl-links">${guideItems}</ul>
        </section>

        <section class="cctk-card pl-card">
          <h3>Who to contact</h3>
          <ul class="pl-links">${contactItems}</ul>
        </section>

        <div class="pl-actions">
          <button class="cctk-btn cctk-btn--primary" id="plDocx" type="button">Download worksheet (.docx)</button>
          <button class="cctk-btn" id="plRestart" type="button">Start again</button>
        </div>
        <p class="cctk-muted cctk-small">The worksheet is a normal Word document — you can edit every part of it afterwards.</p>
      </div>
    `);

    $("#plDocx").addEventListener("click", exportDocx);
    $("#plRestart").addEventListener("click", () => {
      if (confirm("Start again? Your current answers will be cleared.")) restart();
    });
  }

  /* ---------- DOCX export ---------- */

  function exportDocx() {
    if (!window.docx) {
      alert("The document library hasn't loaded (are you offline?). Please refresh and try again.");
      return;
    }
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
            WidthType, ExternalHyperlink, AlignmentType, BorderStyle } = window.docx;

    const labels = fieldLabelMap();
    const A = state.answers;
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" }
    };

    function kvTable(pairs) {
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: pairs.map(([k, v]) => new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 34, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20 })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 66, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: v || "—", size: 20 })] })]
            })
          ]
        }))
      });
    }

    const heading = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 120 }, children: [new TextRun(t)] });

    const overviewPairs = [
      ["Supervisor email", answerText(A.supervisorEmail)],
      ["Year of study", answerText(A.yearOfStudy)],
      ["Study type", [state.studyType, state.quantType].filter(Boolean).join(" — ")],
      ["Recommended platform", state.platform || "—"],
      ["What is the study about?", answerText(A.studyAbout)],
      ["Primary research question", answerText(A.researchQuestion)]
    ];

    const preformIds = new Set(D.forms.preform.fields.map(f => f.id));
    const isDesignVal = (v) => v && typeof v === "object" && !Array.isArray(v) && v.mode && (v.ivs || v.dvs);

    // The design field (if any) is rendered as its own block, not a KV row.
    let designVal = null, designLabel = "Variables and design";
    Object.entries(A).forEach(([k, v]) => { if (isDesignVal(v)) { designVal = v; designLabel = labels[k] || designLabel; } });

    const designPairs = Object.entries(A)
      .filter(([k, v]) => labels[k] && !preformIds.has(k) && !k.endsWith("_features") && !isDesignVal(v))
      .map(([k, v]) => [labels[k], answerText(v)]);

    function headerCell(t) {
      return new TableCell({ borders: cellBorders, shading: { fill: "F0F0F0" }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18 })] })] });
    }
    function bodyCell(t) {
      return new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: t || "—", size: 20 })] })] });
    }

    // Build the design subsection paragraphs/tables (experimental or measured)
    function designBlock(v) {
      const out = [];
      const d = DESIGN.derive(v);
      if (d) {
        out.push(new Paragraph({ spacing: { after: 60 }, children: [
          new TextRun({ text: d.label + ": ", bold: true, size: 22 }),
          new TextRun({ text: d.summary, size: 22 })
        ]}));
      }
      const isExp = v.mode === "experimental";
      const ivRows = [ new TableRow({ tableHeader: true, children: isExp
        ? [ headerCell("Independent variable (factor)"), headerCell("Levels"), headerCell("Administered") ]
        : [ headerCell("Predictor variable") ] }) ];
      v.ivs.forEach(iv => {
        const cells = [ bodyCell(iv.name) ];
        if (isExp) {
          cells.push(bodyCell((iv.levels || []).join(", ") || "—"));
          cells.push(bodyCell(iv.alloc === "within" ? "Within-subjects" : "Between-subjects"));
        }
        ivRows.push(new TableRow({ children: cells }));
      });
      out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: ivRows }));
      out.push(new Paragraph({ text: "" }));

      const dvRows = [ new TableRow({ tableHeader: true, children: [ headerCell(isExp ? "Dependent variable (measure)" : "Outcome variable"), headerCell("Measured as") ] }) ];
      v.dvs.forEach(dv => {
        const t = dv.type ? (dv.other ? dv.type.replace(/Other.*/, dv.other) : dv.type) : "—";
        dvRows.push(new TableRow({ children: [ bodyCell(dv.name), bodyCell(t) ] }));
      });
      out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: dvRows }));
      return out;
    }

    const trailPairs = state.trail.map(t => [t.q, t.a]);

    const guideParas = summaryGuides().map(id => new Paragraph({
      bullet: { level: 0 },
      children: [new ExternalHyperlink({
        link: guideURL(id),
        children: [new TextRun({ text: D.guides[id].label, style: "Hyperlink" })]
      })]
    }));
    if (!guideParas.length) guideParas.push(new Paragraph({ children: [new TextRun({ text: "No specific guides for this pathway — see contacts below.", italics: true })] }));

    const contactParas = summaryContacts().map(c => new Paragraph({
      bullet: { level: 0 },
      children: [
        new ExternalHyperlink({ link: "mailto:" + c.email, children: [new TextRun({ text: `${c.name} (${c.email})`, style: "Hyperlink" })] }),
        new TextRun({ text: c.note ? ` — ${c.note}` : "" })
      ]
    }));

    const flagParas = state.flags.map(f => new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun({ text: f, bold: true })]
    }));

    const children = [
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(answerText(A.workingTitle) || "Dissertation Project")] }),
      new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: `Dissertation project worksheet — generated ${today} with the CCTK Project Planner. This is your working document: edit and update it as your project develops.`, italics: true, size: 20 })] }),
      heading("Project overview"),
      kvTable(overviewPairs),
      heading("Study design"),
      ...(designVal ? [
        new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: designLabel, bold: true, size: 22 })] }),
        ...designBlock(designVal),
        new Paragraph({ text: "" })
      ] : []),
      kvTable(designPairs.length ? designPairs : [["Details", "—"]]),
      heading("Decision pathway"),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "The answers you gave in the planner, so staff can see how you got here.", italics: true, size: 20 })] }),
      kvTable(trailPairs.length ? trailPairs : [["Pathway", "—"]])
    ];

    if (flagParas.length) {
      children.push(heading("Before you go any further"));
      children.push(...flagParas);
    }

    children.push(heading("Your guide pack"), ...guideParas);
    children.push(heading("Who to contact"), ...contactParas);
    children.push(
      heading("Notes from supervision meetings"),
      new Paragraph({ children: [new TextRun({ text: "Use this space to record feedback and agreed actions.", italics: true, size: 20 })] }),
      new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" })
    );

    const doc = new Document({
      creator: "CCTK Project Planner",
      title: answerText(A.workingTitle) || "Dissertation Project Worksheet",
      styles: {
        default: {
          document: { run: { font: "Calibri", size: 22 } },
          title: { run: { size: 44, bold: true } },
          heading1: { run: { size: 26, bold: true } }
        }
      },
      sections: [{ children }]
    });

    Packer.toBlob(doc).then(blob => {
      const a = document.createElement("a");
      const safe = (answerText(A.workingTitle) || "project-worksheet")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
      a.href = URL.createObjectURL(blob);
      a.download = safe + "-worksheet.docx";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }).catch(() => alert("Sorry — the worksheet couldn't be generated. Please try again."));
  }

  /* ---------- Help panel ---------- */

  // Pull the 11-char video id out of any common YouTube URL form.
  function youtubeId(url) {
    if (!url) return null;
    const patterns = [
      /[?&]v=([A-Za-z0-9_-]{11})/,        // watch?v=ID
      /youtu\.be\/([A-Za-z0-9_-]{11})/,   // youtu.be/ID
      /\/embed\/([A-Za-z0-9_-]{11})/,     // /embed/ID
      /\/shorts\/([A-Za-z0-9_-]{11})/     // /shorts/ID
    ];
    for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
    // bare id
    if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim();
    return null;
  }

  function buildHelp() {
    const help = (D.meta && D.meta.help) || {};
    const panel = $("#plHelp");
    const body = $("#plHelpBody");
    if (!panel || !body) return;

    const parts = [];
    if (help.intro) parts.push(`<p class="pl-help-panel__intro">${esc(help.intro)}</p>`);

    if (help.guide) {
      const href = D.meta.guideBase + help.guide;
      parts.push(`<a class="pl-help-panel__guide" href="${esc(href)}" target="_blank" rel="noopener">
        <span class="pl-help-panel__guide-icon" aria-hidden="true">📄</span>
        <span>How to use this app<small>PDF guide — opens in a new tab</small></span>
      </a>`);
    }

    const vid = youtubeId(help.video);
    if (vid) {
      parts.push(`<div class="pl-help-panel__video">
        <iframe src="https://www.youtube-nocookie.com/embed/${esc(vid)}"
          title="How to use the Project Planner"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>
      </div>`);
    }

    // Nothing to show at all → leave the whole panel hidden.
    if (!parts.length) { panel.hidden = true; return; }
    body.innerHTML = parts.join("");
    panel.hidden = false;
  }

  /* ---------- Boot ---------- */

  function wireToolbar() {
    const save = $("#plSaveJson"), loadInput = $("#plLoadJson"), clear = $("#plClear");
    if (save) save.addEventListener("click", exportJson);
    if (loadInput) loadInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importJson(file, () => { history = history || []; render(); });
      e.target.value = ""; // allow re-loading the same file
    });
    if (clear) clear.addEventListener("click", () => {
      if (confirm("Clear all saved data on this device? This can't be undone. Save your plan as JSON first if you want to keep it.")) {
        restart();
      }
    });
  }

  function boot() {
    buildHelp();
    wireToolbar();
    const saved = loadSaved();
    if (saved && saved.state.nodeId !== D.startNode) {
      app().innerHTML = `
        <div class="cctk-card pl-card pl-resume">
          <h2>Welcome back</h2>
          <p>You have a plan in progress${saved.state.answers.workingTitle ? ` for “${esc(saved.state.answers.workingTitle)}”` : ""}. Pick up where you left off?</p>
          <div class="pl-actions">
            <button class="cctk-btn cctk-btn--primary" id="plResume" type="button">Continue my plan</button>
            <button class="cctk-btn" id="plFresh" type="button">Start fresh</button>
          </div>
        </div>`;
      $("#plResume").addEventListener("click", () => {
        state = saved.state;
        history = saved.history || [];
        render();
      });
      $("#plFresh").addEventListener("click", restart);
      return;
    }
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

})();
