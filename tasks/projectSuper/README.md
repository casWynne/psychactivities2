# Project Super — Staff & Dissertation Topic Finder

A lightweight, mobile-first web app to help students browse dissertation **topics** and **staff supervisors**, with search, theme/keyword filtering, “saved” favourites, and a print/PDF export.

This is a static site (HTML/CSS/JS) designed to run on GitHub Pages or any basic web host.

---

## Features

- **Two views**
  - **Staff** view: see staff profiles and their available dissertation topics
  - **Topics** view: see dissertation topics with supervising staff shown
- **Search** across names, topics, descriptions, ideas, and keywords
- **Theme filtering (Super Keywords)**  
  Group many keywords into thematic filters to keep the UI manageable
- **Keyword legend chips**
  - Click a **theme chip** to filter by that theme
  - Click an **orphan keyword** chip to filter by that keyword (only in super-keyword mode)
- **Saved favourites**
  - Save staff or individual topics
  - “Saved only” toggle to show just favourites
  - Saved items persist using `localStorage`
- **Print / Export**
  - Print-friendly layout designed for saving as PDF

---

## Project Structure

Typical file layout:

project-root/
├─ projectSuper.html # Main page
├─ styles.css # Styling (mobile-first)
├─ app.js # App logic
├─ data/
│ └─ staff-projects.json # Data source
└─ images/
├─ default-avatar.jpg
└─ ...staff images...


---

## How It Works (High Level)

1. On load, the app fetches `data/staff-projects.json`
2. It builds two datasets in memory:
   - `allStaff` (from JSON)
   - `allProjects` (derived from staff topics)
3. The app renders cards based on:
   - current view (`staff` or `projects`)
   - search text
   - theme/keyword filter
   - saved-only mode
4. “Saved” items are stored in `localStorage`, so selections persist between visits.

---

## Data Format

The app expects this shape inside `data/staff-projects.json`:

```json
{
  "staff": [
    {
      "id": "unique-id-optional",
      "name": "Dr Example Person",
      "email": "example@university.ac.uk",
      "avatar": "images/example.jpg",
      "avatarPosition": "50% 15%",
      "keywords": ["Keyword A", "Keyword B"],
      "topics": [
        {
          "title": "Topic title",
          "description": "Short description of the topic.",
          "ideas": ["Idea 1", "Idea 2"]
        }
      ]
    }
  ]
}

Notes

* id is optional, but recommended. If absent, the app falls back to using name as an ID.

* avatarPosition is optional (defaults to "50% 50%").

* Keywords are used for both the legend chips and filtering.

## Config Options (in app.js)

At the top of app.js there is a CONFIG object. Common options:

const CONFIG = {
  showSearch: true,
  showKeywordFilter: true,
  showKeywordLegend: true,
  enableLegendChipFilter: true,

  interestFormUrl: "https://forms.office.com/e/UT6nby4S1n",

  useSuperKeywords: true,
  superKeywords: {
    "Theme Name": ["Keyword A", "Keyword B"]
  }
};

## Super Keywords (Themes)

When useSuperKeywords: true:

* The dropdown filters by theme
* The legend shows:
** Theme chips (super keywords)
** Orphan keyword chips (keywords not included in any theme)

When useSuperKeywords: false:

* The dropdown filters by all keywords
* The legend shows only keyword chips

Tip: You can build themes later — the app won’t break if the theme list is incomplete.

## Saved Items (How It Behaves)

There are three saved-related sets in localStorage:

* Saved topics
* Saved staff
* Topic exclusions (when a staff member is saved, but you “unsave” one of their topics)

This creates a nice rule:
* Saving a staff member effectively saves all their topics
* Unsaving a single topic while staff is saved adds it to exclusions
There’s also an auto-cleanup:
* If a saved staff member ends up with zero effective topics, they’re automatically unsaved (and their exclusions cleared)**

## Accessibility / UX Notes

*Cards are keyboard accessible:
** Enter / Space toggles details open/closed
* Buttons inside cards (email / interest / save) don’t trigger card toggling
* prefers-reduced-motion is respected for expand/collapse animation