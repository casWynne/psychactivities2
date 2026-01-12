import { renderCards, renderKeywordChips, renderCategoryOptions } from "./render.js";
import { applyFiltersAndSort, buildFilterOptions } from "./filters.js";
import { byId, debounce } from "./utils.js";

const state = {
  data: null,
  query: "",
  type: "",
  category: "",
  keywords: new Set(),
  sort: "name",
};

async function loadData() {
  const res = await fetch("data/equipment.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load JSON: ${res.status}`);
  return res.json();
}

function syncUICounts(filtered) {
  byId("resultCount").textContent = `${filtered.length} item(s)`;
  byId("emptyState").hidden = filtered.length !== 0;
}

function update() {
  const filtered = applyFiltersAndSort(state);
  renderCards(byId("cards"), filtered, state.data.meta);
  syncUICounts(filtered);
}

function wireUI() {
  const q = byId("q");
  const typeFilter = byId("typeFilter");
  const categoryFilter = byId("categoryFilter");
  const sort = byId("sort");
  const clear = byId("clearFilters");

  q.addEventListener("input", debounce(() => {
    state.query = q.value.trim();
    update();
  }, 120));

  typeFilter.addEventListener("change", () => {
    state.type = typeFilter.value;
    update();
  });

  categoryFilter.addEventListener("change", () => {
    state.category = categoryFilter.value;
    update();
  });

  sort.addEventListener("change", () => {
    state.sort = sort.value;
    update();
  });

  clear.addEventListener("click", () => {
    state.query = "";
    state.type = "";
    state.category = "";
    state.keywords.clear();
    q.value = "";
    typeFilter.value = "";
    categoryFilter.value = "";
    sort.value = "name";
    renderKeywordChips(byId("keywordChips"), [], state.keywords, () => {});
    update();
  });
}

function initKeywordChips(allKeywords) {
  renderKeywordChips(
    byId("keywordChips"),
    allKeywords,
    state.keywords,
    (kw) => {
      if (state.keywords.has(kw)) state.keywords.delete(kw);
      else state.keywords.add(kw);
      update();
    }
  );
}

(async function main() {
  try {
    state.data = await loadData();

    const { categories, keywords } = buildFilterOptions(state.data.items);
    renderCategoryOptions(byId("categoryFilter"), categories);
    initKeywordChips(keywords);

    wireUI();
    update();
  } catch (err) {
    console.error(err);
    byId("cards").innerHTML = `<div class="empty">
      <h3>Couldn’t load equipment list</h3>
      <p class="muted">Check that <code>data/equipment.json</code> exists and paths are correct.</p>
    </div>`;
  }
})();
