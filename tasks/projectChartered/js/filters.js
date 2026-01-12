import { normalise } from "./utils.js";

export function buildFilterOptions(items) {
  const categories = new Set();
  const keywords = new Set();

  for (const it of items) {
    if (it.category) categories.add(it.category);
    (it.keywords || []).forEach(k => keywords.add(k));
  }

  return {
    categories: Array.from(categories).sort(),
    keywords: Array.from(keywords).sort((a, b) => a.localeCompare(b))
  };
}

function matchesQuery(item, q) {
  if (!q) return true;
  const hay = [
    item.name,
    item.summary,
    item.description,
    item.category,
    item.type,
    ...(item.keywords || [])
  ].map(normalise).join(" ");
  return hay.includes(q);
}

function matchesKeywords(item, selectedSet) {
  if (!selectedSet || selectedSet.size === 0) return true;
  const itemK = new Set((item.keywords || []));
  for (const kw of selectedSet) {
    if (!itemK.has(kw)) return false; // AND logic
  }
  return true;
}

export function applyFiltersAndSort(state) {
  const q = normalise(state.query);

  let out = state.data.items.filter(it => {
    if (state.type && it.type !== state.type) return false;
    if (state.category && it.category !== state.category) return false;
    if (!matchesQuery(it, q)) return false;
    if (!matchesKeywords(it, state.keywords)) return false;
    return true;
  });

  const sorter = {
    name: (a,b) => a.name.localeCompare(b.name),
    category: (a,b) => (a.category || "").localeCompare(b.category || ""),
    type: (a,b) => (a.type || "").localeCompare(b.type || "")
  }[state.sort] || ((a,b) => a.name.localeCompare(b.name));

  out.sort(sorter);
  return out;
}
