# CCTK — Caspar's Cool Tool Kit

A collection of research and teaching tools for psychology staff and students, hosted on GitHub Pages. Each tool is served straight from this repo as static HTML/CSS/JS — no build step.

## Structure

- `index.html` — the homepage. Every live tool has one card here linking to its folder.
- One folder per tool at the repo root (e.g. `q-sort/`, `mop2/`, `castime/`), each self-contained: its own HTML entry point, styles, scripts, and any assets it needs.
- `shared/` — `cctk.css` and `cctk-nav.js`, an optional common header/nav for tools that want to match the CCTK look (see `mop/`, `mop2/`, `q-sort/`). Plenty of tools intentionally skip this in favour of their own bespoke styling (`castime/`, `redditRambler/`, `cointoss/`, etc.) — that's a legitimate choice, not an inconsistency.
- `assets/` — shared images (branding, staff photos) used across multiple tools.
- `tasks/` — a few tools that haven't been promoted to their own root-level folder yet (parked/in-progress work).
- `archive/` — superseded or unlinked tools, kept for reference instead of deleted (see `archive/README.md`).

## Adding a new tool

1. Create a new folder at the repo root for it, self-contained (its own HTML/CSS/JS, plus any images it needs).
2. Optionally pull in `shared/cctk.css` and `shared/cctk-nav.js` for the common header/nav.
3. Add a card to `index.html` following the existing `<article class="cctk-card cctk-tool ...">` pattern, linking to the tool's entry HTML file.

## Retiring a tool

When a tool is replaced by a newer version, move the old one into `archive/` (`git mv`, so history follows it) rather than deleting it — old links to it may still be shared externally. Remove its card from `index.html`.
