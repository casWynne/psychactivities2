// /visualIllusions/app.js
const DATA_URL = "./data/illusions.json";

const dom = {
  // Header / gallery controls
  cardGrid: document.getElementById("cardGrid"),
  tagChips: document.getElementById("tagChips"),
  resultsMeta: document.getElementById("resultsMeta"),
  searchInput: document.getElementById("searchInput"),
  clearBtn: document.getElementById("clearBtn"),
  presenterBtn: document.getElementById("presenterBtn"),
  filtersBar: document.getElementById("filtersBar"),

  // Views
  galleryView: document.getElementById("galleryView"),
  playerView: document.getElementById("playerView"),

  // Player UI
  backBtn: document.getElementById("backBtn"),
  playerTitle: document.getElementById("playerTitle"),
  playerTags: document.getElementById("playerTags"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  stage: document.getElementById("illusionStage"),
  controls: document.getElementById("illusionControls"),
  moduleStatus: document.getElementById("moduleStatus"),
};

const state = {
  registry: [],
  search: "",
  tag: "All",

  activeId: null,
  cleanup: null, // function returned by module init()
};

function uniq(arr) { return [...new Set(arr)]; }

// Optional: unify “Color” -> “Colour”
function normaliseTag(t) {
  if (!t) return t;
  if (t === "Color") return "Colour";
  return t;
}

function allTags() {
  const tags = state.registry.flatMap(x => (x.tags || []).map(normaliseTag));
  return ["All", ...uniq(tags).sort((a,b) => a.localeCompare(b))];
}

function getIdFromHash() {
  const h = location.hash || "";
  const m = h.match(/illusion=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function setHash(id) {
  location.hash = `#illusion=${encodeURIComponent(id)}`;
}

function clearHash() {
  history.replaceState(null, "", location.pathname + location.search);
}

function byId(id) {
  return state.registry.find(x => x.id === id) || null;
}

function indexOfId(id) {
  return state.registry.findIndex(x => x.id === id);
}

function setView(which) {
  const isGallery = which === "gallery";
  dom.galleryView.classList.toggle("hidden", !isGallery);
  dom.playerView.classList.toggle("hidden", isGallery);

  // Hide filter bar when in player (cleaner)
  dom.filtersBar.classList.toggle("hidden", !isGallery);
}

function matchesFilters(item) {
  const q = state.search.trim().toLowerCase();
  const tags = (item.tags || []).map(normaliseTag);

  const searchOk =
    !q ||
    (item.title || "").toLowerCase().includes(q) ||
    (item.id || "").toLowerCase().includes(q) ||
    tags.some(t => t.toLowerCase().includes(q));

  const tagOk = state.tag === "All" || tags.includes(state.tag);
  return searchOk && tagOk;
}

function renderTagChips() {
  dom.tagChips.innerHTML = "";
  for (const t of allTags()) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (state.tag === t ? " is-active" : "");
    btn.textContent = t;
    btn.addEventListener("click", () => {
      state.tag = t;
      renderTagChips();
      renderCards();
    });
    dom.tagChips.appendChild(btn);
  }
}

function renderCards() {
  const list = state.registry.filter(matchesFilters);
  dom.resultsMeta.textContent = `${list.length} / ${state.registry.length} shown`;

  dom.cardGrid.innerHTML = "";

  for (const item of list) {
    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${item.title}`);

    const img = document.createElement("img");
    img.className = "thumb";
    img.alt = `${item.title} thumbnail`;
    img.loading = "lazy";
    img.src = item.thumb;

    const body = document.createElement("div");
    body.className = "body";

    const h3 = document.createElement("h3");
    h3.textContent = item.title;

    const tagsWrap = document.createElement("div");
    tagsWrap.className = "tags";
    for (const raw of item.tags || []) {
      const chip = document.createElement("span");
      chip.className = "chip is-label";
      chip.textContent = normaliseTag(raw);
      tagsWrap.appendChild(chip);
    }

    const p = document.createElement("p");
    p.textContent = `Open → #illusion=${item.id}`;

    body.append(h3, tagsWrap, p);
    card.append(img, body);

    const open = () => setHash(item.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    dom.cardGrid.appendChild(card);
  }
}

function clearStage() {
  dom.stage.innerHTML = "";
  dom.controls.innerHTML = "";
  dom.moduleStatus.textContent = "";
}

function renderPlayerHeader(item) {
  dom.playerTitle.textContent = item.title;

  dom.playerTags.innerHTML = "";
  for (const raw of item.tags || []) {
    const chip = document.createElement("span");
    chip.className = "chip is-label";
    chip.textContent = normaliseTag(raw);
    dom.playerTags.appendChild(chip);
  }

  const idx = indexOfId(item.id);
  dom.prevBtn.disabled = idx <= 0;
  dom.nextBtn.disabled = idx < 0 || idx >= state.registry.length - 1;
}

async function loadIllusion(id) {
  const item = byId(id);
  if (!item) return;

  // Cleanup previous
  if (typeof state.cleanup === "function") {
    try { state.cleanup(); } catch (e) { console.warn("cleanup error", e); }
  }
  state.cleanup = null;

  state.activeId = id;
  setView("player");
  clearStage();
  renderPlayerHeader(item);

  dom.moduleStatus.textContent = "Loading module…";

  try {
    // Dynamic import based on JSON
    const mod = await import(item.module);

    if (typeof mod.init !== "function") {
      throw new Error(`Module ${item.module} does not export init()`);
    }

    // Contract: init({ stageEl, controlsEl, registryItem }) -> cleanup()
    const cleanup = await mod.init({
      stageEl: dom.stage,
      controlsEl: dom.controls,
      registryItem: item,
    });

    state.cleanup = typeof cleanup === "function" ? cleanup : null;
    dom.moduleStatus.textContent = "";

  } catch (err) {
    console.error(err);
    dom.moduleStatus.textContent = `Failed to load: ${item.module}`;
    dom.stage.innerHTML = `
      <div class="small">
        <p><strong>Couldn’t load this illusion module.</strong></p>
        <p>Check that the file exists at <code>${item.module}</code> and that it exports <code>init()</code>.</p>
      </div>
    `;
  }
}

function goGallery() {
  // Cleanup active module
  if (typeof state.cleanup === "function") {
    try { state.cleanup(); } catch {}
  }
  state.cleanup = null;
  state.activeId = null;

  clearStage();
  setView("gallery");
  clearHash();
}

function onRoute() {
  const id = getIdFromHash();
  if (!id) {
    setView("gallery");
    return;
  }
  if (!byId(id)) {
    // Unknown id -> back to gallery
    setView("gallery");
    return;
  }
  loadIllusion(id);
}

function clearFilters() {
  state.search = "";
  state.tag = "All";
  dom.searchInput.value = "";
  renderTagChips();
  renderCards();
}

async function loadRegistry() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${DATA_URL} (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("illusions.json must be an array");
  state.registry = data.map(x => ({
    ...x,
    tags: (x.tags || []).map(normaliseTag),
  }));
}

async function init() {
  try {
    await loadRegistry();
  } catch (err) {
    console.error(err);
    dom.resultsMeta.textContent = "Error loading illusions.json";
    return;
  }

  renderTagChips();
  renderCards();
  onRoute();

  dom.searchInput.addEventListener("input", () => {
    state.search = dom.searchInput.value;
    renderCards();
  });

  dom.clearBtn.addEventListener("click", clearFilters);

  dom.backBtn.addEventListener("click", goGallery);

  dom.prevBtn.addEventListener("click", () => {
    const idx = indexOfId(state.activeId);
    if (idx > 0) setHash(state.registry[idx - 1].id);
  });

  dom.nextBtn.addEventListener("click", () => {
    const idx = indexOfId(state.activeId);
    if (idx >= 0 && idx < state.registry.length - 1) setHash(state.registry[idx + 1].id);
  });

  // Placeholder for Step 3
  dom.presenterBtn.addEventListener("click", () => {
    alert("Presenter mode is Step 3 — next up!");
  });

  window.addEventListener("hashchange", onRoute);

  // Nice keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") goGallery();
    if (!state.activeId) return;
    if (e.key === "ArrowLeft") dom.prevBtn.click();
    if (e.key === "ArrowRight") dom.nextBtn.click();
  });
}

init();
