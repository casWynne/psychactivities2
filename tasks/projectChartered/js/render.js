function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function fileBadgeLabel(d) {
  if (d.tag === "risk") return "Risk assessment";
  if (d.tag === "training") return "Training";
  return "Download";
}

export function renderCategoryOptions(selectEl, categories) {
  const base = `<option value="">All</option>`;
  const opts = categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  selectEl.innerHTML = base + opts;
}

export function renderKeywordChips(container, keywords, selectedSet, onToggle) {
  // if keywords empty (e.g. cleared) rebuild from existing dom is fine
  const list = (keywords && keywords.length) ? keywords : Array.from(container.querySelectorAll(".chip")).map(b => b.dataset.kw);
  container.innerHTML = list.map(kw => {
    const pressed = selectedSet.has(kw);
    return `<button class="chip" type="button" data-kw="${escapeHtml(kw)}" aria-pressed="${pressed}">
      ${escapeHtml(kw)}
    </button>`;
  }).join("");

  container.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => onToggle(btn.dataset.kw));
  });
}

export function renderCards(container, items, meta) {
  const email = encodeURIComponent(meta.contactEmail || "");

  container.innerHTML = items.map(it => {
    const subject = encodeURIComponent(`Equipment Enquiry: ${it.name}`);
    const mailto = `mailto:${email}?subject=${subject}`;

    const badges = [
      it.type ? `<span class="badge">${escapeHtml(it.type)}</span>` : "",
      it.category ? `<span class="badge">${escapeHtml(it.category)}</span>` : "",
      it.availability ? `<span class="badge">${escapeHtml(it.availability)}</span>` : "",
      ...(it.downloads || []).slice(0, 2).map(d => `<span class="badge">${escapeHtml(fileBadgeLabel(d))}</span>`)
    ].filter(Boolean).join("");

    const downloads = (it.downloads || []).map(d =>
      `<a href="${escapeHtml(d.path)}" download>${escapeHtml(d.label)}</a>`
    ).join("");

    return `
      <article class="card">
        <img src="${escapeHtml(it.image || "")}" alt="${escapeHtml(it.name)}" loading="lazy" />
        <div class="pad">
          <div class="badges">${badges}</div>
          <h3>${escapeHtml(it.name)}</h3>
          <p>${escapeHtml(it.summary || "")}</p>
          ${it.location ? `<p><strong>Location:</strong> ${escapeHtml(it.location)}</p>` : ""}
        </div>
        <div class="actions">
          <a class="primary" href="${mailto}">Email about this</a>
          ${downloads || `<a href="#" onclick="return false;" aria-disabled="true">No downloads</a>`}
        </div>
      </article>
    `;
  }).join("");
}
