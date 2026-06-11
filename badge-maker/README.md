# Badge Maker 2.0

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
- **Text:** required title + optional subtitle, fixed positions per shape, live character counters that adapt to font size.
- **Icons:** curated, categorised library (4 per category) + import any icon from [tabler.io/icons](https://tabler.io/icons) via Copy SVG → paste.
- **Decorations:** laurels, sparkle, divider with per-shape default positions.
- **Positioning grid:** toggleable Cartesian overlay; all items use centre-origin X/Y number boxes (Gorilla-style).
- **Auto-fit:** shrinks oversized text and pulls icons/decorations back inside the badge face.
- **Export:** SVG or JPG with live file-size estimates, 256 KB limit enforced for JPG by stepping quality down, pros/cons listed in the export window.
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

- The exported SVG uses common font fallbacks so it renders consistently in Moodle without bundled fonts.
- JPG export renders at 1024×1024 on a white background (JPG has no transparency).
- Nothing is saved or sent anywhere; refreshing the page resets the design.
