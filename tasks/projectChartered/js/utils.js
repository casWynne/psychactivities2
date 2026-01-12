export const byId = (id) => document.getElementById(id);

export function debounce(fn, ms = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function normalise(s) {
  return (s || "").toString().toLowerCase().trim();
}
