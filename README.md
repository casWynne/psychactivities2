# CasBadge

A static, single-page tool for academic staff to design Moodle badges for undergraduate psychology students. Built with vanilla HTML/CSS/JS — no build step, no data storage, no server.

## Run it

Open `index.html` in a browser, or host the three files anywhere static.

**GitHub Pages:**
1. Create a repository and upload `index.html`, `styles.css`, `app.js`.
2. Repository **Settings → Pages → Source: Deploy from a branch → main / root**.
3. Your app appears at `https://<username>.github.io/<repo>/`.

## Features

- **Shapes:** circle, square, hexagon — with optional scalloped (rosette) edge, scallop count/depth and border width in advanced settings.
- **Colour styles:** rainbow, bronze, silver, gold + 7 single-hue presets; full gradient-point editor (add/remove/recolour points, min 2).
- **Text:** required title + optional subtitle, fixed positions per shape. Straight text **auto-shrinks to fit** using pixel-accurate width measurement (Canvas `measureText`): text renders at the chosen size but scales down toward a readable floor (title 24px, subtitle 13px) if it would overflow, so short text stays large and long text still fits. Input is only capped when even the floor size can't fit — and never below **10 characters** on any shape. The counter shows the fitted size when text has shrunk.
- **Icons:** curated, categorised library shown as **collapsed accordions** (categories and counts generated automatically from `ICON_LIBRARY`) + in-app **search of 200,000+ icons across ~200 open icon sets** via the free Iconify API (`api.iconify.design` — keyless, CORS-enabled). The search has a **set-filter dropdown** (edit `ICON_SET_FILTERS` in `app.js` to change the options), **Show more** paging (fetches up to 256 matches, renders 24 at a time — both tunable via `SEARCH_FETCH_LIMIT` / `SEARCH_PAGE_SIZE`), and a link to the full catalogue at [icon-sets.iconify.design](https://icon-sets.iconify.design/). Each result's tooltip names its icon set; most sets use open licences (MIT/Apache/CC). Manual import from [tabler.io/icons](https://tabler.io/icons) via Copy SVG → paste also works.
- **Decorations:** laurels, sparkle, divider with per-shape default positions.
- **Positioning grid:** toggleable Cartesian overlay; all items use centre-origin X/Y number boxes (Gorilla-style).
- **Auto-fit:** shrinks oversized text and pulls icons/decorations back inside the badge face.
- **Export:** PNG, JPG or SVG with live file-size estimates and the 256 KB limit enforced automatically — JPG by stepping quality down, PNG by stepping pixel dimensions down (1024→512). PNG and JPG are the formats Moodle's badge system accepts; PNG keeps the badge's transparency. SVG is offered too (rightmost, secondary button) because it is re-openable here for editing, but it is **not** accepted by Moodle's badge system. Pros/cons are listed per format in the export window.
- **Import badge:** the ⬆ Import badge button (header) re-opens any SVG previously exported from Badge Maker, with every setting restored for further editing. Exported SVGs carry their design as embedded metadata, so the image file *is* the save file — nothing is stored by the app. SVGs from other sources can't be re-opened (they have no design data) and trigger a friendly explanation instead.

## Extending it (all in `app.js`, top section)

| What | Where | How |
|---|---|---|
| New icon | `ICON_LIBRARY` | Add `id:{ label, svg }` under any category (24×24 stroke paths; new category keys appear automatically) |
| New decoration | `DECORATIONS` + `DECOR_DEFAULTS` | Add the artwork, then a default `{x, y, scale}` for **each** shape |
| New colour preset | `COLOR_PRESETS` | Add `{ label, stops:[{color, at}, …] }` |
| Text positions / icon drop slots | `SHAPES` | Per-shape `title.y`, `subtitle.y`, `maxW`, `iconSlots` |

Coordinates are centre-origin: **x → right, y → up**, canvas 512×512 (so roughly ±200 stays on the badge face).

## Notes

- Icon search is the app's only network call (to `api.iconify.design`). Everything else — including all built-in icons, decorations and export — works fully offline. If Iconify is unreachable, the search box fails gracefully with a message.
- The exported SVG uses common font fallbacks so it renders consistently in Moodle without bundled fonts.
- JPG export renders at 1024×1024 on a white background (JPG has no transparency).
- Nothing is saved or sent anywhere; refreshing the page resets the design.

## v1.2 additions

- **Quick alignment** — every placed icon/decoration has L/C/R and T/M/B snap buttons (offsets configurable via `ALIGN_STEP_X` / `ALIGN_STEP_Y` in `app.js`).
- **More decorations** — ribbon banner, crown, dot divider and starburst, each with per-shape defaults in `DECOR_DEFAULTS`.
- **Image upload** — embed a PNG/JPG (square transparent PNGs ~200–300 px recommended). The importer rejects non-PNG/JPG and files over 2 MB, auto-resizes anything over 320 px or 120 KB, and warns when the embedded image (~180 KB+) risks exceeding the 256 KB badge limit. Embedded images survive badge export/import round-trips (validated as strict PNG/JPG data URLs on re-import).
- **Arched text** — each text box has a Curve control (Straight / Arch over top / Arch under bottom) with an adjustable radius (60–220). Implemented with SVG `textPath`, so arches stay crisp in both SVG and JPG exports, survive badge import round-trips, and the character counter automatically allows more characters on a curve.
- **Text positioning** — title and subtitle each have X/Y inputs with L/C/R and T/M/B align buttons in the advanced text settings (alongside the relocated Curve controls). Straight text uses X/Y; arched text is positioned by its curve radius. Switching shape resets text to that shape's defaults.
- **Live Moodle preview** — a panel to the left of the main canvas shows the badge at 100 px (profile page) and 60 px (badge list), updating live with every edit, so unreadable-at-thumbnail-size text is caught before export.
- **Undo** — header button + Ctrl/Cmd+Z reverts the last change (up to 60 steps). Rapid edits like typing or value-scrubbing coalesce into single undo steps. History is in-memory only and clears on refresh, keeping the no-storage guarantee; native text-field undo still works while a field is focused.