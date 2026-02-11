/* CCTK Hub v1
   - Loads /data/tools.json
   - Builds tag chips
   - Search + multi-tag filtering
   - Status + internal/external behaviour
*/

const DATA_URL = "data/tools.json";

const els = {};
const state = {
  tools: [],
  tags: [],
  selectedTags: new Set(),
  query: "",
  showArchived: false,
  onlyInternal: false
};

function $(id) { return document.getElementById(id); }

function normalize(str) {
  return (str || "").toString().trim().toLowerCase();
}

function uniqueSorted(arr) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

function toolMatches(tool) {
  const q = normalize(state.query);
  const text = normalize([
    tool.name,
    tool.tagline,
    tool.description,
    (tool.tags || []).join(" ")
  ].join(" "));

  if (q && !text.includes(q)) return false;

  if (!state.showArchived && (tool.status === "archived" || tool.status === "prototype")) return false;
  if (state.onlyInternal && tool.type !== "internal") return false;

  if (state.selectedTags.size > 0) {
    const toolTags = new Set((tool.tags || []).map(normalize));
    for (const t of state.selectedTags) {
      if (!toolTags.has(t)) return false; // AND logic
    }
  }

  return true;
}

function statusLabel(status) {
  switch (status) {
    case "prototype": return "Prototype";
    case "active": return "Active";
    case "beta": return "Beta";
    case "maintenance": return "Maintenance";
    case "archived": return "Archived";
    default: return "—";
  }
}

function accentForTool(tool) {
  // tool.accent should be one of: red, orange, yellow, green, teal, blue, indigo, purple, pink
  return tool.accent || "indigo";
}

function toolHref(tool) {
  if (tool.type === "internal") return tool.path || "#";
  return tool.url || "#";
}

function isExternal(tool) {
  return tool.type === "external";
}

function renderToolCard(tool) {
  const accent = accentForTool(tool);
  const href = toolHref(tool);
  const external = isExternal(tool);

  const tags = (tool.tags || []).slice(0, 6);
  const tagHtml = tags.map(t => `<span class="cctk-chip" data-accent="${accent}">${escapeHtml(t)}</span>`).join("");

  const status = tool.status || "active";
  const isPrototype = status === "prototype";

  return `
    <article class="cctk-card cctk-card--soft cctk-tool cctk-col-4"
      data-accent="${accent}"
      data-tags="${(tool.tags || []).map(normalize).join(",")}"
      data-status="${escapeHtml(status)}"
    >
      <div class="cctk-card__inner cctk-stack" style="gap: var(--space-4);">
        <div class="cctk-tool__top">
          <div>
            <h3 class="cctk-tool__name">${escapeHtml(tool.name)}</h3>
            ${tool.tagline ? `<p class="cctk-tool__tagline">${escapeHtml(tool.tagline)}</p>` : ``}
          </div>

          <span class="cctk-badge" data-status="${escapeHtml(status)}">
            <span class="cctk-dot"></span>
            ${statusLabel(status)}
          </span>
        </div>

        ${tool.description ? `<p class="cctk-tool__desc">${escapeHtml(tool.description)}</p>` : ``}

        ${isPrototype ? `
          <p class="cctk-muted cctk-small" style="margin:0;">
            Experimental build — interface and behaviour may change.
          </p>
        ` : ``}

        ${tags.length ? `<div class="cctk-chips">${tagHtml}</div>` : ``}

        <div class="cctk-tool__actions">
          <a class="cctk-btn cctk-btn--primary" href="${escapeAttr(href)}"
             ${external ? `target="_blank" rel="noopener noreferrer"` : ``}>
            Launch ${external ? `↗` : `→`}
          </a>

          <span class="cctk-muted cctk-small">
            ${escapeHtml(tool.type === "internal" ? "Internal" : "External")}
          </span>
        </div>
      </div>
    </article>
  `;
}


function renderGrid() {
  const grid = els.toolGrid;
  const empty = els.emptyState;

  const filtered = state.tools.filter(toolMatches);

  grid.innerHTML = filtered.map(renderToolCard).join("");
  empty.classList.toggle("cctk-hidden", filtered.length > 0);

  // meta
  const total = state.tools.length;
  els.resultMeta.textContent =
    `${filtered.length} of ${total} tools` +
    (state.selectedTags.size ? ` • tags: ${Array.from(state.selectedTags).join(", ")}` : "") +
    (state.query ? ` • search: "${state.query}"` : "");
}

function renderTagChips() {
  const wrap = els.tagChips;

  const chips = state.tags.map(tag => {
    const active = state.selectedTags.has(tag);
    return `
      <span class="cctk-chip cctk-chip--clickable ${active ? "cctk-chip--active" : ""}"
            data-tag="${escapeAttr(tag)}"
            data-accent="teal"
            role="button"
            tabindex="0"
            aria-pressed="${active ? "true" : "false"}">
        ${escapeHtml(tag)}
      </span>
    `;
  });

  wrap.innerHTML = chips.join("");

  // Click + keyboard toggle
  wrap.querySelectorAll("[data-tag]").forEach(el => {
    el.addEventListener("click", () => toggleTag(el.getAttribute("data-tag")));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleTag(el.getAttribute("data-tag"));
      }
    });
  });
}

function toggleTag(tag) {
  const t = normalize(tag);
  if (!t) return;

  if (state.selectedTags.has(t)) state.selectedTags.delete(t);
  else state.selectedTags.add(t);

  renderTagChips();
  renderGrid();
}

function clearAll() {
  state.selectedTags.clear();
  state.query = "";
  state.showArchived = false;
  state.onlyInternal = false;

  els.toolSearch.value = "";
  els.showArchived.checked = false;
  els.onlyInternal.checked = false;

  renderTagChips();
  renderGrid();
}

async function loadTools() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${DATA_URL} (${res.status})`);

  const data = await res.json();
  const tools = Array.isArray(data.tools) ? data.tools : [];

  // Basic sanity defaults
  state.tools = tools.map(t => ({
    id: t.id || "",
    name: t.name || "Untitled tool",
    tagline: t.tagline || "",
    description: t.description || "",
    type: t.type || (t.path ? "internal" : "external"),
    path: t.path || "",
    url: t.url || "",
    status: t.status || "active",
    tags: Array.isArray(t.tags) ? t.tags : [],
    accent: t.accent || "indigo"
  }));

  // Build tag list
  const allTags = state.tools.flatMap(t => (t.tags || []).map(normalize)).filter(Boolean);
  state.tags = uniqueSorted(allTags);

  renderTagChips();
  renderGrid();
}

function escapeHtml(str) {
  return (str || "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("`", "&#096;");
}

function init() {
  // Bind elements
  els.toolGrid = $("toolGrid");
  els.emptyState = $("emptyState");
  els.toolSearch = $("toolSearch");
  els.tagChips = $("tagChips");
  els.resultMeta = $("resultMeta");
  els.clearFiltersBtn = $("clearFiltersBtn");
  els.showArchived = $("showArchived");
  els.onlyInternal = $("onlyInternal");
  $("year").textContent = new Date().getFullYear().toString();

  // Events
  els.toolSearch.addEventListener("input", (e) => {
    state.query = e.target.value || "";
    renderGrid();
  });

  els.showArchived.addEventListener("change", (e) => {
    state.showArchived = !!e.target.checked;
    renderGrid();
  });

  els.onlyInternal.addEventListener("change", (e) => {
    state.onlyInternal = !!e.target.checked;
    renderGrid();
  });

  els.clearFiltersBtn.addEventListener("click", clearAll);

  loadTools().catch(err => {
    console.error(err);
    els.toolGrid.innerHTML = `
      <div class="cctk-col-12">
        <div class="cctk-card" data-accent="red">
          <div class="cctk-card__inner">
            <h2 class="cctk-tool__name" style="margin:0;">Couldn’t load tools.json</h2>
            <p class="cctk-tool__desc" style="margin-top: var(--space-2);">
              Check that <span class="cctk-mono">/data/tools.json</span> exists and GitHub Pages is serving it.
            </p>
            <p class="cctk-muted cctk-small cctk-mono">${escapeHtml(err.message)}</p>
          </div>
        </div>
      </div>
    `;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
