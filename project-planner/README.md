# CCTK Project Planner

A mobile-first, fully static dissertation project planner. Students answer a short branching set of questions (based on the UG project workflow), fill in their study details, and leave with:

1. **An editable Word worksheet (.docx)** containing everything they entered — project overview, study design, the decision pathway they took, warnings, guide links, and contact links.
2. **A guide pack** — direct links to the right guide files on GitHub for their exact pathway.
3. **Contacts** — `mailto:` links for the Psychology Technician (fixed) and their supervisor (taken from the email they type in).

No server, no build step, nothing stored anywhere except the student's own browser (`localStorage`, for resume-where-you-left-off). Host the folder anywhere static, alongside the rest of the CCTK site.

## Files

| File | What it is | Edit it? |
|---|---|---|
| `planner-data.js` | **Everything editable**: questions, branching, guides, contacts, form fields | ✅ Yes — this is the only file you need for routine updates |
| `planner.js` | The engine (rendering, navigation, autosave, docx export) | Only for behaviour changes |
| `planner.css` | Styling, layered on `../shared/cctk.css` tokens (dark mode included) | Only for visual changes |
| `index.html` | The page shell | Rarely |

The page expects the shared CCTK assets at `../shared/cctk.css` and `../shared/cctk-nav.js` (same as Q-Sort). The only external dependency is the `docx` library from jsDelivr, loaded in `index.html`, which builds the Word file entirely in the browser.

## Before going live — two placeholders to fill in

1. **Psychology Technician email** — the very first line of `planner-data.js` sets `window.TECHNICIAN_EMAIL`. Change it there once and it updates everywhere the technician is a contact (currently `c.w@universityof.ac.uk`).
2. **`meta.guideBase`** — a **relative path** to the folder holding your guide PDFs, from the app page. The planner sits one level down, so the default `../guides/` points at a `guides/` folder in the site root — a single shared location you can point other CCTK apps at too. Relative paths work wherever the site is hosted and don't need editing per environment. Keep the trailing slash. Each guide's link is `guideBase + file`.

Every guide in the `guides` block has a placeholder filename (e.g. `ms-teams-interview-guide.pdf`). Rename these to match the actual files in your repo — filenames only, the base URL is prepended automatically.

## Linking the guides (all PDFs)

Every guide link in the app — each study guide in the student's pack, and the app-guide PDF in the Help panel — is built the same way: **`meta.guideBase` + the guide's `file`**. Two things to set:

1. **`meta.guideBase`** — a relative path to your guides folder, from the app page, ending in a slash. The default is `../guides/`, i.e. a `guides/` folder in the site root (the app lives one level down in `project-planner/`, so `../` steps up to root). Put every PDF in that one folder — you can point other CCTK apps at the same location. Relative means it just works wherever you host, with no per-environment editing.
2. **Each guide's `file`** — in the `guides` block, every entry has a placeholder filename. Rename each to match the actual PDF. Filenames only; `guideBase` is prepended automatically. `label` is just the display text.

So: create one `guides/` folder in the site root, drop every PDF in it (including the app-guide PDF), and make sure each `file:` matches a real filename. Move or rename the folder later and you change only the one `guideBase` line.

**A note on the worksheet's links.** The links *inside the downloaded .docx worksheet* can't be relative — a Word file opened on someone's desktop has no web page to resolve `../guides/…` against. The app handles this automatically: at the moment a student downloads their worksheet, it converts each relative guide path into the full absolute URL of wherever the app is currently hosted, so the links in the worksheet are clickable. This means the worksheet links are only correct once the app is hosted at its real URL (not when opened from a `file://` path during local testing) — which is fine for normal use.

## The Help panel

A collapsible **Help & guides** panel sits at the top of every screen (it lives outside the part of the page that changes as students move through the planner, so it stays put and keeps its open/closed state). It's driven entirely by `meta.help` in `planner-data.js`:

```js
help: {
  intro: "New here? …",                         // a line of text, or "" to omit
  guide: "how-to-use-the-project-planner.pdf",  // app-guide PDF filename, or "" to hide the link
  video: ""                                     // a YouTube URL, or "" to hide the video
}
```

- **The PDF guide** lives in the same folder as the other guides (`guideBase + help.guide`), so you give just the filename. You still need to make this guide and add it to the folder; set `guide: ""` to hide the link until it's ready.
- **The video is optional and hidden until you add a link.** Paste any YouTube URL into `help.video` — watch links, `youtu.be/…` short links, embed links, Shorts links, or a bare 11-character id all work; the id is extracted and embedded privately via `youtube-nocookie.com`. Leave it `""` and no video appears.
- If `guide`, `video` and `intro` are all empty, the whole panel stays hidden.

## Routine updates (all in `planner-data.js`)

**Add or rename a guide:** add/edit an entry in `guides`, then reference its id from any option (`guides: ["my_new_guide"]`) or checklist item (`guide: "my_new_guide"`).

**Change question wording:** edit the node's `prompt` / `help` text. `record` is the label used for that question on the worksheet's "Decision pathway" table.

**Add a question:** add a node to `nodes` and point an existing option's `next` at it. Each option supports:

```js
{ label: "Yes", answer: "Yes",          // answer = what appears on the worksheet
  next: "some_node",                     // where to go
  guides: ["g_access"],                  // guides to add (optional)
  contacts: ["technician"],              // contacts to add (optional)
  platform: "Gorilla",                   // set recommended platform (optional)
  flag: "Warning text on worksheet" }    // add a warning (optional)
```

Node types: `question` (tap-to-answer cards), `info` (a message + Continue; `tone: "warn"` makes it amber), `checklist` (tick boxes, each can add a guide), `form` (points at an entry in `forms`), `summary` (the end screen).

## The structured IV/DV builder (`design` field)

Instead of free-text IV/DV boxes, the quant forms use a `design` field — a repeater that captures variables *structurally*, which is what makes the worksheet useful to staff at a glance. It has two modes, set per field with `designMode`:

- **`experimental`** (cognitive, vignette, eyewitness, bio) — each IV is a *factor* with a name, a list of levels (min 2), and a between/within allocation chosen in plain language ("each participant is in one level only" vs "each participant does every level"). From these the tool **derives** the design and shows it live: e.g. *"2×2 mixed design — Factors: Sleep condition (between) × Test time (within). Each participant is tested in one Sleep condition, and experiences all Time levels."* The label follows the usual rules: all-between → between-subjects, all-within → within-subjects (repeated measures), a mix → mixed; the `2×2` comes from the level counts. Students never pick the between/within/mixed label themselves — they answer the concrete allocation question and the tool works out the label, which is both more reliable and more educational.
- **`measured`** (questionnaire/psychometric, secondary data) — variables are *predictors* and *outcomes* with no allocation, because between/within is meaningless for correlational/regression work. No design label is derived; you just get clean predictor/outcome capture.

DVs in both modes carry a measurement type (continuous, score/scale, accuracy, reaction time, count, categorical, other) from `optionLists.dvTypes` — edit that list to change the choices.

The derived design is **recorded only** — it does not steer the suggested analysis method (that stays the student's choice). On the worksheet the design becomes its own section: the derived sentence, an IV/factor table (name / levels / administered) and a DV table (measure / measured-as). The questionnaire/psychometric path has its own form (`questionnaireDetails`, measured mode); the experimental paths share `quantDetails` (experimental mode); `secondaryDetails` is measured mode.

To change which mode a form uses, edit that form's `design` field: `{ id: "design", label: "…", type: "design", designMode: "experimental" | "measured" }`.

**Change worksheet fields:** edit the relevant entry in `forms` (`quantDetails`, `questionnaireDetails`, `bioDetails`, `secondaryDetails`, `qualDetails`, `preform`). Field types: `text`, `email`, `textarea`, `number`, `date`, `radio` (pick one), `checkboxes` (pick one or more — at least one is always required), `design` (the structured IV/DV builder above), `demographics`, `questionnaires`, and `stimuli` (described below). Both `radio` and `checkboxes` can use a shared list from `optionLists` (so participants/recruitment options stay consistent everywhere), and any option marked `other: true` reveals its own free-text box. Options can also carry `flag`/`contacts` — this is how ticking "Children under 18 / clinical / vulnerable" automatically adds a warning and the supervisor contact. Participants and recruitment method are `checkboxes` (studies often draw on more than one group or recruit through more than one channel); everything else that offers a fixed choice is `radio`.

Note on shared field ids: a field id (e.g. `stimuli`) can appear on several forms with slightly different labels. The worksheet uses the label from the form the student actually completed, so it's fine to word `questionnaires` as "…in the dataset" on the secondary-data form and "…used" elsewhere.

## Demographics, questionnaires and stimuli fields

Three purpose-built field types, added to the study-design forms:

- **`demographics`** — a checkbox list (`optionLists.demographics`: age, biological sex, gender, ethnicity, education, first language) plus an "add your own" row for anything not listed. It's **required** — students must tick at least one, or choose "None / not collecting demographics" (an `exclusive: true` option that clears the others when picked). To change the standard options, edit `optionLists.demographics`; add `exclusive: true` to any option that should behave like "None".
- **`questionnaires`** — a repeater of standard scales, each with a name and an **optional DOI/reference**. Optional overall (students using no validated scales just leave it blank). Appears on every details form, including qualitative, since some studies pair a scale with interviews.
- **`stimuli`** — asks whether the student has their stimuli/materials (*have them* / *still sourcing* / *not applicable*). Choosing "have them" reveals an optional URL and a description box that prompts for naming convention, file format, item count and licensing. Optional. On the qualitative form the hint reframes this as interview prompts, vignettes or elicitation materials.

All three are recorded on the worksheet and flow through JSON save/load. None of them are on the secondary-data form except `questionnaires` (relabelled for a dataset) — collecting demographics or presenting stimuli doesn't apply when you're reusing existing data.

## Saving, loading and clearing

A toolbar appears once the student is past the first screen:

- **Save plan (JSON)** downloads the full plan (answers + pathway) as a `.json` file. This is the portable save format — students can email it to a supervisor, keep it as a backup, or move between devices.
- **Load plan** re-opens a previously saved `.json`, dropping the student back exactly where they left off. Files that aren't valid JSON, or weren't exported from this planner, are rejected with a friendly message and never overwrite the current plan.
- **Clear saved data** wipes the browser's stored progress and starts fresh (with a confirm prompt that reminds them to save first).

Progress is *also* autosaved to `localStorage` continuously, so closing the tab and returning offers a "Welcome back" resume prompt without any manual save. The JSON feature is for portability and backup; `localStorage` is for convenience.

After editing, bump `meta.version` if you want; there's no cache-busting logic, it's just for your records.

## Design decisions & interpretations of the workflow diagram

A few places where the Excalidraw diagram was ambiguous — flagged here so you can change them if I guessed wrong:

- **"Not linear, and doesn't want randomisation/allocation features"** → routed to *Contact supervisor & technician* (the diagram's arrows loop back on themselves here). The student still completes the worksheet so they have something concrete to bring to that conversation.
- **No ethical approval for a non-Teams platform** → also routed to contact (the diagram implied but didn't draw this arrow).
- **In-person focus groups** aren't in the diagram at all, so choosing "in person" produces a warning flag + contacts rather than a dead end.
- **Gorilla experiment paths + Sona:** the diagram lists "Sona guide for Gorilla" as a download for cognitive/vignette/eyewitness studies. The planner adds it **automatically only if** the student selects "RPS (Sona Systems)" as their recruitment method on the details form.
- **Quant study type is single-select** (the diagram drew checkboxes). One primary method keeps the pathway, guide pack, and worksheet coherent; students doing hybrid designs can run the planner twice or raise it with staff.
- **"Planned analysis method" radio options** weren't specified in the diagram, so I've used a common set (correlation, t-tests, ANOVAs, regression, chi-square, other). Edit `optionLists.quantAnalysis`.

## The qualitative worksheet (proposed — please review)

You noted you hadn't yet decided what qual projects need on their worksheet. `forms.qualDetails` is a proposal, built to parallel the quant worksheet so staff can read both the same way:

- Analytic approach (thematic analysis / IPA / grounded theory / discourse / content / other)
- Topic guide (interview/focus-group schedule) status
- Participants group, target number, recruitment method
- Recording & transcription plan (free text — where files live, who transcribes)
- Analysis software (NVivo / Atlas.ti / Word–manual / other)
- Planned data collection dates

Delete, reword, or add fields freely — nothing else depends on the specific fields.

## The worksheet (.docx)

Generated client-side with [docx](https://docx.js.org/) — a genuine, fully editable Word file. Sections: title + generated date, project overview table, study design table, decision pathway table (every question + answer, so staff can see how the student got their recommendations), warnings ("Before you go any further"), guide pack (live hyperlinks), contacts (live `mailto:` hyperlinks), and a blank "Notes from supervision meetings" section to encourage students to keep using the document.