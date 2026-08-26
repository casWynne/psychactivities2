/* ==========================================================================
   CCTK Project Planner — DATA FILE
   --------------------------------------------------------------------------
   Everything the planner shows — questions, branching, guides, contacts,
   form fields — lives in this one file. Edit this file to update the tool.
   No other file needs touching for routine updates.

   HOW THINGS FIT TOGETHER
   - meta.guideBase + guides[id].file  →  the download link for each guide
   - contacts[id]                      →  mailto links (supervisor email is
                                          taken from what the student types)
   - forms[id]                         →  the worksheet fields per study type
   - nodes[id]                         →  the decision tree. Each option can:
        next: "nodeId"          go to another node
        guides: ["id", ...]     add guides to the student's pack
        contacts: ["id", ...]   add people to contact
        platform: "..."         set the recommended platform
        flag: "..."             add a note that appears on the worksheet
   ========================================================================== */

/* ══════════════════════════════════════════════════════════════════════════
   THE ONE EMAIL YOU EDIT.
   The Psychology Technician's address — used everywhere the technician is a
   contact. Change it here and it updates across the whole tool.
   ══════════════════════════════════════════════════════════════════════════ */
window.TECHNICIAN_EMAIL = "c.w@universityof.ac.uk";   // ← EDIT ME


window.PLANNER_DATA = {

  meta: {
    appTitle: "Project Planner",
    appTagline: "Plan your dissertation study step by step and leave with an editable worksheet, the right guides, and the right people to contact.",
    // ── EDIT ME ─────────────────────────────────────────────────────────
    // Where the guide PDFs live. This is a RELATIVE path from the app page,
    // so it works wherever the site is hosted and can be shared across apps.
    // The planner sits one level down (e.g. /project-planner/), so "../guides/"
    // points at a "guides" folder in the site root. Keep the trailing slash.
    // Each guide link is built as: guideBase + the guide's filename.
    guideBase: "../guides/",
    storageKey: "cctk_planner_v1",
    version: "1.0",

    /* ── Help panel (collapsible, top of every screen) ──────────────────
       help.guide : filename of the "how to use this app" PDF. It lives in
                    the same guides folder (guideBase), so just the filename.
                    Leave "" to hide the guide link.
       help.video : full YouTube URL (watch, share, or embed form all work).
                    Leave "" and the video area stays hidden until you add one.
       help.intro : a line of text shown at the top of the panel.           */
    help: {
      intro: "New here? These walk you through planning your project with this tool.",
      guide: "how-to-use-the-project-planner.pdf",   // ← the app guide PDF (or "" to hide)
      video: ""                                        // ← paste a YouTube URL when ready
    }
  },

  /* ── People. Supervisor email is captured in the pre-form and injected
        automatically, so only fixed roles live here. ─────────────────── */
  contacts: {
    technician: {
      name: "Psychology Technician",
      email: window.TECHNICIAN_EMAIL,              // set once, at the top of this file
      note: "Technical set-up: Gorilla, JISC, equipment, RPS/Sona."
    },
    supervisor: {
      name: "Your Supervisor",
      email: null,                                 // filled from pre-form answer
      note: "Design, ethics and academic decisions."
    }
  },

  /* ── Guide library. label = display text, file = filename in guideBase.
        Add a guide here, reference its id anywhere in the tree. ───────── */
  guides: {
    // JISC Online Surveys
    jisc_access:      { label: "Access to JISC Online Surveys Guide",              file: "jisc-access-guide.pdf" },
    jisc_survey:      { label: "JISC Survey Guide",                                 file: "jisc-survey-guide.pdf" },
    jisc_sona:        { label: "JISC + Sona Guide",                                 file: "jisc-sona-guide.pdf" },
    jos_qbuild:       { label: "Questionnaire Building in JISC Online Surveys",     file: "jos-questionnaire-building-guide.pdf" },
    jos_sona_link:    { label: "Linking JISC Online Surveys and Sona Systems",      file: "jos-sona-linking-guide.pdf" },

    // Gorilla
    g_access:         { label: "Access to Gorilla Guide",                           file: "gorilla-access-guide.pdf" },
    g_task_builder:   { label: "Gorilla Task Builder Guide",                        file: "gorilla-task-builder-guide.pdf" },
    g_vignette:       { label: "Gorilla Vignette Task Guide",                       file: "gorilla-vignette-task-guide.pdf" },
    g_exp_builder:    { label: "Gorilla Experiment Builder Guide",                  file: "gorilla-experiment-builder-guide.pdf" },
    g_q_builder:      { label: "Gorilla Questionnaire Builder Guide",               file: "gorilla-questionnaire-builder-guide.pdf" },
    g_rand_order:     { label: "Randomising Survey Question Order (Gorilla)",       file: "gorilla-randomise-question-order-guide.pdf" },
    g_rand_alloc:     { label: "Randomly Allocating to Groups on Arrival (Gorilla)",file: "gorilla-random-group-allocation-guide.pdf" },
    g_resp_alloc:     { label: "Allocating to Groups from Survey Responses (Gorilla)", file: "gorilla-response-based-allocation-guide.pdf" },
    g_auto_score:     { label: "Automatic Scoring for Questionnaires (Gorilla)",    file: "gorilla-automatic-scoring-guide.pdf" },
    g_sona_gorilla:   { label: "Setting Up Your Gorilla Study on Sona",             file: "gorilla-sona-guide.pdf" },

    // Interviews
    ms_teams_int:        { label: "MS Teams Interview Guide",                       file: "ms-teams-interview-guide.pdf" },
    ms_teams_int_sona:   { label: "MS Teams Interview + Sona Guide",                file: "ms-teams-interview-sona-guide.pdf" },
    generic_online_int:  { label: "Generic Online Interview Guidance",              file: "generic-online-interview-guide.pdf" },
    generic_online_int_sona: { label: "Generic Online Interview + Sona Guide",      file: "generic-online-interview-sona-guide.pdf" },
    oncampus_int:        { label: "In-Person On-Campus Interview Guidance",         file: "inperson-oncampus-interview-guide.pdf" },
    oncampus_int_sona:   { label: "In-Person On-Campus Interview + Sona Guide",     file: "inperson-oncampus-interview-sona-guide.pdf" },
    offcampus_int:       { label: "In-Person Off-Campus Interview Guide",           file: "inperson-offcampus-interview-guide.pdf" },

    // Focus groups
    ms_teams_fg:         { label: "MS Teams Focus Group Guide",                     file: "ms-teams-focus-group-guide.pdf" },
    generic_online_fg:   { label: "Generic Online Focus Group Guidance",            file: "generic-online-focus-group-guide.pdf" }
  },

  /* ── Reusable option lists ──────────────────────────────────────────── */
  optionLists: {
    participants: [
      { value: "General population", },
      { value: "University students (RPS / Sona Systems)" },
      { value: "Children / young people (under 18)", flag: "Working with under-18s: discuss safeguarding and ethics with your supervisor before proceeding.", contacts: ["supervisor"] },
      { value: "Clinical population", flag: "Clinical populations need enhanced ethical approval. Discuss with your supervisor before proceeding.", contacts: ["supervisor"] },
      { value: "Vulnerable population", flag: "Vulnerable populations need enhanced ethical approval. Discuss with your supervisor before proceeding.", contacts: ["supervisor"] }
    ],
    recruitment: [
      { value: "RPS (Sona Systems)" },
      { value: "Social media" },
      { value: "Convenience sampling" },
      { value: "Snowball sampling" },
      { value: "Other", other: true }
    ],
    quantAnalysis: [
      { value: "Correlation" },
      { value: "t-test (independent or paired)" },
      { value: "One-way ANOVA" },
      { value: "Factorial / mixed ANOVA" },
      { value: "Regression / multiple regression" },
      { value: "Chi-square" },
      { value: "Other", other: true }
    ],
    quantSoftware: [
      { value: "SPSS" }, { value: "JASP" }, { value: "R" }, { value: "Other", other: true }
    ],
    /* DV / outcome measurement types, used by the design repeater. */
    dvTypes: [
      { value: "Continuous (e.g. time, height, temperature)" },
      { value: "Score or scale total (e.g. questionnaire score)" },
      { value: "Accuracy / percentage correct" },
      { value: "Reaction time" },
      { value: "Count / frequency" },
      { value: "Categorical (e.g. correct/incorrect, choice A/B)" },
      { value: "Other", other: true }
    ],
    qualApproach: [
      { value: "Thematic analysis" },
      { value: "Interpretative Phenomenological Analysis (IPA)" },
      { value: "Grounded theory" },
      { value: "Discourse analysis" },
      { value: "Content analysis" },
      { value: "Other / not decided yet", other: true }
    ],
    qualSoftware: [
      { value: "NVivo" }, { value: "Word / manual coding" }, { value: "Other", other: true }
    ],
    /* Standard demographic variables. "None" lets students satisfy the
       required tick when they genuinely collect no demographics. */
    demographics: [
      { value: "Age" },
      { value: "Biological sex" },
      { value: "Gender" },
      { value: "Ethnicity" },
      { value: "Education level" },
      { value: "First language" },
      { value: "None / not collecting demographics", exclusive: true }
    ]
  },

  /* ── Forms. Field types: text, email, textarea, number, date, radio.
        radio fields use either inline `options` or `optionList: "name"`.  ── */
  forms: {

    preform: {
      title: "About your project",
      intro: "A few basics first. Everything you type ends up on your worksheet.",
      fields: [
        { id: "supervisorEmail", label: "Supervisor email", type: "email", required: true, placeholder: "name@university.ac.uk" },
        { id: "workingTitle", label: "Project working title", type: "text", required: true, placeholder: "e.g. The effect of sleep on recognition memory" },
        { id: "yearOfStudy", label: "Year of study", type: "radio", required: true, options: [
          { value: "Level 6 (Undergraduate)" },
          { value: "MSc Conversion" },
          { value: "MSc Forensic" },
          { value: "Master's by Research" }
        ]},
        { id: "studyAbout", label: "In one or two sentences, what is your study about?", type: "textarea", required: true },
        { id: "researchQuestion", label: "Primary research question", type: "textarea", required: true }
      ]
    },

    quantDetails: {
      title: "Your study design",
      intro: "Be as specific as you can — vague answers here mean vague feedback later.",
      fields: [
        { id: "design", label: "Variables and design", type: "design", designMode: "experimental" },
        { id: "stimuli", label: "Stimuli or materials", type: "stimuli" },
        { id: "questionnaires", label: "Standard questionnaires / scales used", type: "questionnaires" },
        { id: "hypotheses", label: "Specific hypotheses", type: "textarea", hint: "Directional if possible: \"Participants in X will score higher on Y than…\"" },
        { id: "analysisMethod", label: "Planned analysis method", type: "radio", optionList: "quantAnalysis" },
        { id: "software", label: "Analysis software", type: "radio", optionList: "quantSoftware" },
        { id: "participants", label: "Participants (tick all that apply)", type: "checkboxes", optionList: "participants" },
        { id: "demographics", label: "Demographics collected (tick all that apply)", type: "demographics", optionList: "demographics" },
        { id: "sampleSize", label: "Target sample size", type: "number", min: 1, hint: "Ideally justified by a power analysis — ask your supervisor if unsure." },
        { id: "recruitment", label: "Recruitment method (tick all that apply)", type: "checkboxes", optionList: "recruitment" },
        { id: "startDate", label: "Planned data collection start date", type: "date" },
        { id: "endDate", label: "Planned data collection end date", type: "date" }
      ]
    },

    /* Questionnaire / psychometric: correlational, not experimental — so it
       uses the "measured" design mode (predictors & outcomes, no allocation). */
    questionnaireDetails: {
      title: "Your study design",
      intro: "Set out your predictor and outcome variables — what predicts what, and how each is measured.",
      fields: [
        { id: "design", label: "Variables", type: "design", designMode: "measured" },
        { id: "questionnaires", label: "Standard questionnaires / scales used", type: "questionnaires" },
        { id: "stimuli", label: "Stimuli or materials", type: "stimuli" },
        { id: "hypotheses", label: "Specific hypotheses", type: "textarea", hint: "e.g. \"Higher trait anxiety will predict lower sleep quality.\"" },
        { id: "analysisMethod", label: "Planned analysis method", type: "radio", optionList: "quantAnalysis" },
        { id: "software", label: "Analysis software", type: "radio", optionList: "quantSoftware" },
        { id: "participants", label: "Participants (tick all that apply)", type: "checkboxes", optionList: "participants" },
        { id: "demographics", label: "Demographics collected (tick all that apply)", type: "demographics", optionList: "demographics" },
        { id: "sampleSize", label: "Target sample size", type: "number", min: 1, hint: "Ideally justified by a power analysis — ask your supervisor if unsure." },
        { id: "recruitment", label: "Recruitment method (tick all that apply)", type: "checkboxes", optionList: "recruitment" },
        { id: "startDate", label: "Planned data collection start date", type: "date" },
        { id: "endDate", label: "Planned data collection end date", type: "date" }
      ]
    },

    bioDetails: {
      title: "Your study design",
      intro: "Physiological studies need extra planning around equipment — be specific about measurements.",
      fields: [
        { id: "design", label: "Variables and design", type: "design", designMode: "experimental" },
        { id: "measurements", label: "Planned measurements", type: "textarea", hint: "e.g. HRV via ECG at rest and during task; EDA during stimulus presentation." },
        { id: "stimuli", label: "Stimuli or materials", type: "stimuli" },
        { id: "questionnaires", label: "Standard questionnaires / scales used", type: "questionnaires" },
        { id: "hypotheses", label: "Specific hypotheses", type: "textarea" },
        { id: "analysisMethod", label: "Planned analysis method", type: "radio", optionList: "quantAnalysis" },
        { id: "software", label: "Analysis software", type: "radio", optionList: "quantSoftware" },
        { id: "participants", label: "Participants (tick all that apply)", type: "checkboxes", optionList: "participants" },
        { id: "demographics", label: "Demographics collected (tick all that apply)", type: "demographics", optionList: "demographics" },
        { id: "sampleSize", label: "Target sample size", type: "number", min: 1 },
        { id: "recruitment", label: "Recruitment method (tick all that apply)", type: "checkboxes", optionList: "recruitment" },
        { id: "startDate", label: "Planned data collection start date", type: "date" },
        { id: "endDate", label: "Planned data collection end date", type: "date" }
      ]
    },

    secondaryDetails: {
      title: "Your study design",
      intro: "Secondary data analysis: tell us where the data comes from and what you'll do with it.",
      fields: [
        { id: "dataSources", label: "Data source(s)", type: "textarea", hint: "Name the dataset(s) and where they're held, e.g. UK Data Service, OSF, published supplementary data." },
        { id: "design", label: "Variables", type: "design", designMode: "measured" },
        { id: "questionnaires", label: "Standard questionnaires / scales in the dataset", type: "questionnaires" },
        { id: "hypotheses", label: "Specific hypotheses", type: "textarea" },
        { id: "analysisMethod", label: "Analysis type", type: "radio", optionList: "quantAnalysis" },
        { id: "software", label: "Analysis software", type: "radio", optionList: "quantSoftware" }
      ]
    },

    /* Qualitative worksheet — parallel structure to the quant one so staff
       can read both the same way. Edit freely; nothing else depends on it. */
    qualDetails: {
      title: "Your study design",
      intro: "Qualitative projects still need a concrete plan — approach, people, and practicalities.",
      fields: [
        { id: "qualApproach", label: "Analytic approach", type: "radio", optionList: "qualApproach" },
        { id: "topicGuide", label: "Interview / focus group schedule (topic guide)", type: "radio", options: [
          { value: "Drafted" }, { value: "In progress" }, { value: "Not started yet" }
        ]},
        { id: "participants", label: "Participants (tick all that apply)", type: "checkboxes", optionList: "participants" },
        { id: "demographics", label: "Demographics collected (tick all that apply)", type: "demographics", optionList: "demographics" },
        { id: "sampleSize", label: "Target number of participants", type: "number", min: 1, hint: "Discuss what is realistic and defensible for your approach with your supervisor." },
        { id: "recruitment", label: "Recruitment method (tick all that apply)", type: "checkboxes", optionList: "recruitment" },
        { id: "stimuli", label: "Stimuli or materials", type: "stimuli", hint: "e.g. interview prompts, vignettes, images or elicitation materials shown to participants." },
        { id: "questionnaires", label: "Standard questionnaires / scales used", type: "questionnaires", hint: "Some qualitative studies also collect a validated scale — list any here." },
        { id: "recordingPlan", label: "Recording and transcription plan", type: "textarea", hint: "How will sessions be recorded, where will files be stored, and who transcribes?" },
        { id: "software", label: "Analysis software", type: "radio", optionList: "qualSoftware" },
        { id: "startDate", label: "Planned data collection start date", type: "date" },
        { id: "endDate", label: "Planned data collection end date", type: "date" }
      ]
    }
  },

  /* ── The decision tree ──────────────────────────────────────────────── */
  startNode: "preform",

  nodes: {

    preform: { type: "form", form: "preform", next: "study_type" },

    study_type: {
      type: "question",
      prompt: "What type of study are you planning?",
      record: "Study type",
      options: [
        { label: "Quantitative", sub: "Numbers, measurement, statistical analysis", next: "quant_type", answer: "Quantitative" },
        { label: "Qualitative", sub: "Interviews, focus groups, open-ended surveys", next: "qual_method", answer: "Qualitative" }
      ]
    },

    /* ================= QUANTITATIVE ================= */

    quant_type: {
      type: "question",
      prompt: "What type of quantitative study are you planning?",
      help: "Tap a card to choose the option that best describes your primary method. Open \"What's this?\" if you're unsure.",
      record: "Quantitative study type",
      options: [
        {
          label: "Computerised cognitive task",
          sub: "e.g. Stroop, lexical decision, n-back, go/no-go, visual search",
          definition: "A computerised cognitive task is a highly controlled experimental procedure delivered via digital software to isolate and objectively measure specific human mental processes. Rather than relying on self-reported feelings or subjective opinions, these tasks force the participant to interact with standardised digital stimuli under strict constraints to generate hard, quantifiable data.",
          answer: "Computerised cognitive task",
          platform: "Gorilla",
          guides: ["g_access", "g_task_builder", "g_exp_builder", "g_q_builder"],
          next: "gorilla_suited"
        },
        {
          label: "Vignette study",
          sub: "e.g. between-groups scenario manipulation, jury simulation",
          definition: "A research method where participants are presented with short, structured, hypothetical scenarios to evaluate how specific manipulated variables influence human judgment, decision-making, or bias. Rather than observing real-world behaviour, which is difficult to control and ethically complex, this method simulates reality within a highly controlled questionnaire format to isolate specific social, psychological, or legal factors.",
          answer: "Vignette study",
          platform: "Gorilla",
          guides: ["g_access", "g_task_builder", "g_vignette", "g_exp_builder", "g_q_builder"],
          next: "gorilla_suited"
        },
        {
          label: "Questionnaire / psychometric",
          sub: "e.g. does X and Y predict Z, or pre/post-test intervention",
          definition: "A non-experimental research design that uses structured, statistically validated self-report scales to quantify and map the relationships between stable psychological traits, states or behaviours. Instead of manipulating an environment or measuring a physical reaction, this methodology converts abstract human internal experiences (like anxiety, motivation, or personality) into precise numerical data, allowing researchers to build mathematical models of the human mind.",
          answer: "Questionnaire / psychometric",
          next: "q_upload"
        },
        {
          label: "Eyewitness / memory",
          sub: "e.g. misinformation effect, DRM paradigm",
          definition: "A controlled experimental procedure designed to systematically manipulate the conditions under which information is learned, distorted, or retrieved in order to objectively measure the flaws, biases, and boundaries of human memory. These paradigms treat memory as a malleable process, altering variables during the encoding, storage, or retrieval phases to quantify exactly how and why people forget or misremember events.",
          answer: "Eyewitness / memory",
          platform: "Gorilla",
          guides: ["g_access", "g_task_builder", "g_exp_builder", "g_q_builder"],
          next: "gorilla_suited"
        },
        {
          label: "Biological / physiological",
          sub: "e.g. CPT, HRV, ECG, EDA — psychophysiology",
          definition: "A controlled experimental setup that uses specialised hardware to record real-time, involuntary bodily responses to investigate the underlying organic mechanisms behind human thoughts, emotions, and behaviours. Rather than relying on what a participant says they feel (subjective data) or what they consciously do (behavioural data), this method bypasses conscious control entirely, intercepting somatic and autonomic nervous system activity to gather direct, objective data.",
          answer: "Biological / physiological",
          contacts: ["technician", "supervisor"],
          flag: "Physiological studies use lab equipment. You MUST contact the Psychology Technician and your supervisor before booking anything.",
          next: "bio_details"
        },
        {
          label: "Secondary data analysis",
          sub: "Analysing existing datasets rather than collecting new data",
          answer: "Secondary data analysis",
          next: "sec_details"
        }
      ]
    },

    gorilla_suited: {
      type: "info",
      title: "Your study is best suited to Gorilla",
      body: "Gorilla is the university's platform for building and running online experiments — it handles precise timing, stimulus presentation, randomisation, and group allocation. The guides in your pack will walk you through access, building your task, and putting your experiment together.",
      next: "quant_details"
    },

    /* --- Questionnaire / psychometric sub-flow --- */

    q_upload: {
      type: "question",
      prompt: "Are you asking participants to upload a file?",
      help: "e.g. a photo, document, audio recording or any other file as part of their response.",
      record: "Participants upload a file?",
      options: [
        { label: "Yes", answer: "Yes", platform: "JISC Online Surveys", next: "q_upload_note" },
        { label: "No", answer: "No", next: "q_linear" }
      ]
    },

    q_upload_note: {
      type: "info",
      title: "Use JISC Online Surveys",
      body: "For file upload please use JISC Online Surveys. Be aware: JISC Online Surveys does not allow you to randomise question order or randomly allocate participants to groups at the start of the survey. If you need those features as well as file upload, talk to your supervisor and the Psychology Technician.",
      next: "q_rps"
    },

    q_linear: {
      type: "question",
      prompt: "Are you doing a \u201clinear\u201d survey?",
      help: "A standard set of questions that all participants complete in the same order.",
      record: "Linear survey?",
      options: [
        { label: "Yes", answer: "Yes", platform: "JISC Online Surveys", next: "q_use_jisc" },
        { label: "No", answer: "No", next: "q_features" }
      ]
    },

    q_use_jisc: {
      type: "info",
      title: "Use JISC Online Surveys",
      body: "A linear questionnaire is exactly what JISC Online Surveys is built for. It's simple, university-approved, and quick to set up.",
      next: "q_rps"
    },

    q_rps: {
      type: "question",
      prompt: "Do you want to recruit from the RPS (Sona Systems)?",
      help: "The Research Participation Scheme — students take part in your study in exchange for credits.",
      record: "Recruiting via RPS (Sona)?",
      options: [
        { label: "Yes", answer: "Yes", guides: ["jisc_access", "jos_qbuild", "jos_sona_link"], next: "questionnaire_details" },
        { label: "No", answer: "No", guides: ["jisc_access", "jos_qbuild"], next: "questionnaire_details" }
      ]
    },

    q_features: {
      type: "question",
      prompt: "Do you want to apply any of: question order randomisation, random group allocation, or group allocation based on participant responses?",
      record: "Needs randomisation / allocation features?",
      options: [
        { label: "Yes", answer: "Yes", platform: "Gorilla", next: "q_gorilla_suited" },
        { label: "No", answer: "No", contacts: ["supervisor", "technician"],
          flag: "Your survey isn't linear but doesn't need randomisation or allocation features — talk this design through with your supervisor and the Psychology Technician before building anything.",
          next: "q_contact" }
      ]
    },

    q_gorilla_suited: {
      type: "info",
      title: "Your study is best suited to Gorilla",
      body: "Gorilla's Questionnaire Builder handles question order randomisation, random allocation to groups, allocation based on responses, and automatic scoring.",
      next: "q_gorilla_features"
    },

    q_contact: {
      type: "info",
      title: "Contact your supervisor and the Psychology Technician",
      body: "Your design doesn't fit the standard survey routes, which usually just means it needs a quick conversation. Both contacts have been added to your worksheet — carry on and complete your study details so you have something concrete to show them.",
      tone: "warn",
      next: "questionnaire_details"
    },

    q_gorilla_features: {
      type: "checklist",
      prompt: "Tick the features you plan to use",
      help: "A guide for each ticked feature is added to your pack.",
      record: "Gorilla features",
      baseGuides: ["g_access"],
      items: [
        { id: "randOrder", label: "Randomising survey question order across participants", guide: "g_rand_order" },
        { id: "randAlloc", label: "Randomly allocating participants to groups on arrival", guide: "g_rand_alloc" },
        { id: "respAlloc", label: "Allocating to groups based on within-survey question responses", guide: "g_resp_alloc" },
        { id: "autoScore", label: "Automatic scorer to calculate participant scores on scales and questionnaires", guide: "g_auto_score" },
        { id: "sona", label: "Recruiting from the RPS (Sona Systems)", guide: "g_sona_gorilla" }
      ],
      next: "questionnaire_details"
    },

    quant_details: { type: "form", form: "quantDetails", next: "summary" },
    questionnaire_details: { type: "form", form: "questionnaireDetails", next: "summary" },
    bio_details:   { type: "form", form: "bioDetails",   next: "summary" },
    sec_details:   { type: "form", form: "secondaryDetails", next: "summary" },

    /* ================= QUALITATIVE ================= */

    qual_method: {
      type: "question",
      prompt: "How will you collect your data?",
      record: "Qualitative method",
      options: [
        { label: "Online survey", sub: "Open-ended questions completed online", answer: "Online survey", next: "s_upload" },
        { label: "Interviews", sub: "One-to-one conversations, online or in person", answer: "Interviews", next: "int_mode" },
        { label: "Focus group", sub: "Facilitated group discussion", answer: "Focus group", next: "fg_mode" }
      ]
    },

    /* --- Qual online survey (mirrors the questionnaire flow, survey guides) --- */

    s_upload: {
      type: "question",
      prompt: "Are you asking participants to upload a file?",
      help: "e.g. a photo, document, audio recording or any other file as part of their response.",
      record: "Participants upload a file?",
      options: [
        { label: "Yes", answer: "Yes", platform: "JISC Online Surveys", next: "s_upload_note" },
        { label: "No", answer: "No", next: "s_linear" }
      ]
    },

    s_upload_note: {
      type: "info",
      title: "Use JISC Online Surveys",
      body: "For file upload please use JISC Online Surveys. Be aware: JISC Online Surveys does not allow you to randomise question order or randomly allocate participants to groups at the start of the survey. If you need those features as well as file upload, talk to your supervisor and the Psychology Technician.",
      next: "s_rps"
    },

    s_linear: {
      type: "question",
      prompt: "Are you doing a \u201clinear\u201d survey?",
      help: "A standard set of questions that all participants complete in the same order.",
      record: "Linear survey?",
      options: [
        { label: "Yes", answer: "Yes", platform: "JISC Online Surveys", next: "s_use_jisc" },
        { label: "No", answer: "No", next: "s_features" }
      ]
    },

    s_use_jisc: {
      type: "info",
      title: "Use JISC Online Surveys",
      body: "A linear survey is exactly what JISC Online Surveys is built for. It's simple, university-approved, and quick to set up.",
      next: "s_rps"
    },

    s_rps: {
      type: "question",
      prompt: "Are you planning on recruiting via the RPS (Sona Systems)?",
      help: "The Research Participation Scheme — students take part in your study in exchange for credits.",
      record: "Recruiting via RPS (Sona)?",
      options: [
        { label: "Yes", answer: "Yes", guides: ["jisc_access", "jisc_survey", "jisc_sona"], next: "qual_details" },
        { label: "No", answer: "No", guides: ["jisc_access", "jisc_survey"], next: "qual_details" }
      ]
    },

    s_features: {
      type: "question",
      prompt: "Do you want to apply any of: question order randomisation, random group allocation, or group allocation based on participant responses?",
      record: "Needs randomisation / allocation features?",
      options: [
        { label: "Yes", answer: "Yes", platform: "Gorilla", next: "s_gorilla_suited" },
        { label: "No", answer: "No", contacts: ["supervisor", "technician"],
          flag: "Your survey isn't linear but doesn't need randomisation or allocation features — talk this design through with your supervisor and the Psychology Technician before building anything.",
          next: "s_contact" }
      ]
    },

    s_gorilla_suited: {
      type: "info",
      title: "Your study is best suited to Gorilla",
      body: "Gorilla handles question order randomisation, random allocation to groups, and allocation based on responses.",
      next: "s_gorilla_features"
    },

    s_contact: {
      type: "info",
      title: "Contact your supervisor and the Psychology Technician",
      body: "Your design doesn't fit the standard survey routes, which usually just means it needs a quick conversation. Both contacts have been added to your worksheet — carry on and complete your study details so you have something concrete to show them.",
      tone: "warn",
      next: "qual_details"
    },

    s_gorilla_features: {
      type: "checklist",
      prompt: "Tick the features you plan to use",
      help: "A guide for each ticked feature is added to your pack.",
      record: "Gorilla features",
      baseGuides: ["g_access"],
      items: [
        { id: "randOrder", label: "Randomising survey question order across participants", guide: "g_rand_order" },
        { id: "randAlloc", label: "Randomly allocating participants to groups on arrival", guide: "g_rand_alloc" },
        { id: "respAlloc", label: "Allocating to groups based on within-survey question responses", guide: "g_resp_alloc" },
        { id: "sona", label: "Recruiting from the RPS (Sona Systems)", guide: "g_sona_gorilla" }
      ],
      next: "qual_details"
    },

    /* --- Interviews --- */

    int_mode: {
      type: "question",
      prompt: "How will your interviews take place?",
      record: "Interview format",
      options: [
        { label: "Online", answer: "Online", next: "int_teams" },
        { label: "In person / offline", answer: "In person / offline", next: "int_campus" }
      ]
    },

    int_teams: {
      type: "question",
      prompt: "Via MS Teams?",
      help: "MS Teams is the university-approved platform for online interviews.",
      record: "Via MS Teams?",
      options: [
        { label: "Yes", answer: "Yes", next: "int_teams_sona" },
        { label: "No — a different platform", answer: "No", next: "int_alt_ethics" }
      ]
    },

    int_teams_sona: {
      type: "question",
      prompt: "Are you planning on collecting data via the RPS and Sona Systems?",
      record: "Recruiting via RPS (Sona)?",
      options: [
        { label: "Yes", answer: "Yes", guides: ["ms_teams_int_sona"], next: "qual_details" },
        { label: "No", answer: "No", guides: ["ms_teams_int"], next: "qual_details" }
      ]
    },

    int_alt_ethics: {
      type: "question",
      prompt: "Do you have ethical approval for a different platform, e.g. Zoom?",
      record: "Ethical approval for alternative platform?",
      options: [
        { label: "Yes", answer: "Yes", next: "int_platform_ok" },
        { label: "No", answer: "No", contacts: ["supervisor", "technician"],
          flag: "You need ethical approval before interviewing on a non-standard platform. Speak to your supervisor and the Psychology Technician.",
          next: "int_contact" }
      ]
    },

    int_platform_ok: {
      type: "question",
      prompt: "Do you know if that platform has been approved for university use?",
      record: "Platform approved for university use?",
      options: [
        { label: "Yes — it's approved", answer: "Yes", next: "int_generic_sona" },
        { label: "No / I'm not sure", answer: "No / not sure", contacts: ["supervisor", "technician"],
          flag: "Check platform approval before collecting any data. Speak to your supervisor and the Psychology Technician.",
          next: "int_contact" }
      ]
    },

    int_generic_sona: {
      type: "question",
      prompt: "Are you planning on collecting data via the RPS and Sona Systems?",
      record: "Recruiting via RPS (Sona)?",
      options: [
        { label: "Yes", answer: "Yes", guides: ["generic_online_int_sona"], next: "qual_details" },
        { label: "No", answer: "No", guides: ["generic_online_int"], next: "qual_details" }
      ]
    },

    int_contact: {
      type: "info",
      title: "Contact your supervisor and the Psychology Technician",
      body: "Don't collect any data until this is resolved. Both contacts have been added to your worksheet — carry on and complete your study details so you have something concrete to show them.",
      tone: "warn",
      next: "qual_details"
    },

    int_campus: {
      type: "question",
      prompt: "Will you be conducting your study on university property?",
      record: "On university property?",
      options: [
        { label: "Yes", answer: "Yes", next: "int_campus_sona" },
        { label: "No — off campus", answer: "No", next: "int_permission" }
      ]
    },

    int_campus_sona: {
      type: "question",
      prompt: "Are you planning on collecting data via the RPS and Sona Systems?",
      record: "Recruiting via RPS (Sona)?",
      options: [
        { label: "Yes", answer: "Yes", guides: ["oncampus_int_sona"], next: "qual_details" },
        { label: "No", answer: "No", guides: ["oncampus_int"], next: "qual_details" }
      ]
    },

    int_permission: {
      type: "question",
      prompt: "Do you have permission from the property owner and ethical approval for that location?",
      record: "Off-campus permission and ethical approval?",
      options: [
        { label: "Yes — both", answer: "Yes", guides: ["offcampus_int"], next: "qual_details" },
        { label: "No / not yet", answer: "No", contacts: ["supervisor", "technician"],
          flag: "Off-campus data collection needs the property owner's permission AND ethical approval for that location before you start.",
          next: "int_contact" }
      ]
    },

    /* --- Focus groups --- */

    fg_mode: {
      type: "question",
      prompt: "Will your focus group run online?",
      record: "Focus group format",
      options: [
        { label: "Yes — online", answer: "Online", next: "fg_teams" },
        { label: "No — in person", answer: "In person", contacts: ["supervisor", "technician"],
          flag: "In-person focus groups aren't covered by the standard guides yet — plan the room, recording and consent process with your supervisor and the Psychology Technician.",
          next: "fg_contact" }
      ]
    },

    fg_teams: {
      type: "question",
      prompt: "Via MS Teams?",
      help: "MS Teams is the university-approved platform for online focus groups.",
      record: "Via MS Teams?",
      options: [
        { label: "Yes", answer: "Yes", guides: ["ms_teams_fg"], next: "qual_details" },
        { label: "No — a different platform", answer: "No", next: "fg_alt_ethics" }
      ]
    },

    fg_alt_ethics: {
      type: "question",
      prompt: "Do you have ethical approval for a different platform, e.g. Zoom?",
      record: "Ethical approval for alternative platform?",
      options: [
        { label: "Yes", answer: "Yes", next: "fg_platform_ok" },
        { label: "No", answer: "No", contacts: ["supervisor", "technician"],
          flag: "You need ethical approval before running focus groups on a non-standard platform.",
          next: "fg_contact" }
      ]
    },

    fg_platform_ok: {
      type: "question",
      prompt: "Do you know if that platform has been approved for university use?",
      record: "Platform approved for university use?",
      options: [
        { label: "Yes — it's approved", answer: "Yes", guides: ["generic_online_fg"], next: "qual_details" },
        { label: "No / I'm not sure", answer: "No / not sure", contacts: ["supervisor", "technician"],
          flag: "Check platform approval before collecting any data.",
          next: "fg_contact" }
      ]
    },

    fg_contact: {
      type: "info",
      title: "Contact your supervisor and the Psychology Technician",
      body: "Don't collect any data until this is resolved. Both contacts have been added to your worksheet — carry on and complete your study details so you have something concrete to show them.",
      tone: "warn",
      next: "qual_details"
    },

    qual_details: { type: "form", form: "qualDetails", next: "summary" },

    /* ================= END ================= */

    summary: { type: "summary" }
  }
};