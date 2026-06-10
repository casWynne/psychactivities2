/**
 * ============================================================
 * CPD BADGE MAKER — CONFIGURATION  (js/config.js)
 * ============================================================
 * Edit this file to change defaults, presets and icon groups.
 * No other file needs touching for basic customisation.
 * ============================================================
 */

const CONFIG = {

  defaults: {

    // ── Badge shape ──────────────────────────────────────────
    // "scallop" | "circle" | "square" | "hexagon"
    badgeShape: "scallop",

    // ── Title ────────────────────────────────────────────────
    titleMain:    "CPD",
    titleSub:     "DAY",
    showRules:    true,

    // ── Items (icon + label slots) ───────────────────────────
    // Each item: { iconName, label, colour, iconSize, labelSize, offsetX, offsetY }
    // offsetX / offsetY are in SVG px relative to the item's auto position.
    // Label supports "\n" for line breaks.
    items: [
      { iconName: "checkbox",        label: "JISC\nONLINE SURVEYS", colour: "#e05a1a", iconSize: 62, labelSize: 18, offsetX: 0, offsetY: 0 },
      { iconName: "robot-face",      label: "GORILLA.SC",           colour: "#1a8c6e", iconSize: 62, labelSize: 18, offsetX: 0, offsetY: 0 },
      { iconName: "chart-histogram", label: "JASP",                 colour: "#2a4ea0", iconSize: 62, labelSize: 18, offsetX: 0, offsetY: 0 },
    ],

    // ── Colours ──────────────────────────────────────────────
    borderGradient:     ["#ff6b35","#ffd700","#7bc67e","#1a9aad","#3b5bdb","#7048e8","#e64980","#ff6b35"],
    centreGradientFrom: "#ffffff",
    centreGradientTo:   "#ede9f8",
    titleGradientFrom:  "#ff6b35",
    titleGradientTo:    "#7048e8",
    titleSubColour:     "#2a2d5e",
    ruleColourLeft:     "#e05a1a",
    ruleColourRight:    "#3b5bdb",
    labelColour:        "#2a2d5e",

    // ── Decoratives ──────────────────────────────────────────
    // Array of decorative elements. Each has a type and properties.
    // Types: "sprig-left" | "sprig-right" | "sparkle" | "star" | "dot"
    // x, y: position in SVG px (canvas 500×500, centre = 250,250)
    // size: scale factor (1 = default)
    // colour: stroke/fill colour
    // visible: boolean
    decoratives: [
      { type: "sprig-left",  x: 142, y: 388, size: 1.0, colour: "#e05a1a", visible: true },
      { type: "sprig-right", x: 358, y: 388, size: 1.0, colour: "#3b5bdb", visible: true },
      { type: "sparkle",     x: 250, y: 398, size: 1.0, colour: "",        visible: true },
    ],

    // ── Typography ───────────────────────────────────────────
    fontFamily:    "Montserrat",
    titleMainSize: 110,
    titleSubSize:  42,
  },

  // ── Colour presets ────────────────────────────────────────
  colourPresets: [
    {
      label: "Rainbow (default)",
      borderGradient:    ["#ff6b35","#ffd700","#7bc67e","#1a9aad","#3b5bdb","#7048e8","#e64980","#ff6b35"],
      centreFrom:        "#ffffff", centreTo:    "#ede9f8",
      titleFrom:         "#ff6b35", titleTo:     "#7048e8",
      titleSubColour:    "#2a2d5e",
      ruleLeft:          "#e05a1a", ruleRight:   "#3b5bdb",
      labelColour:       "#2a2d5e",
    },
    {
      label: "DigiLearn Teal",
      borderGradient:    ["#0e7a8c","#1a9aad","#2ab8cc","#1a9aad","#0e7a8c","#0a5f6e","#1a9aad","#0e7a8c"],
      centreFrom:        "#ffffff", centreTo:    "#e8f7f9",
      titleFrom:         "#0e7a8c", titleTo:     "#2ab8cc",
      titleSubColour:    "#0e2234",
      ruleLeft:          "#1a9aad", ruleRight:   "#0e7a8c",
      labelColour:       "#0e2234",
    },
    {
      label: "Psychology Purple",
      borderGradient:    ["#4a2d6f","#6b3fa0","#9b59b6","#6b3fa0","#4a2d6f","#3a1f5f","#6b3fa0","#4a2d6f"],
      centreFrom:        "#ffffff", centreTo:    "#f5f0ff",
      titleFrom:         "#4a2d6f", titleTo:     "#9b59b6",
      titleSubColour:    "#2a1040",
      ruleLeft:          "#6b3fa0", ruleRight:   "#4a2d6f",
      labelColour:       "#2a1040",
    },
    {
      label: "Achievement Gold",
      borderGradient:    ["#b8860b","#daa520","#ffd700","#daa520","#b8860b","#8b6508","#daa520","#b8860b"],
      centreFrom:        "#ffffff", centreTo:    "#fffbee",
      titleFrom:         "#b8860b", titleTo:     "#ffd700",
      titleSubColour:    "#3d2b00",
      ruleLeft:          "#b8860b", ruleRight:   "#daa520",
      labelColour:       "#3d2b00",
    },
  ],

  // ── Scallop shape ─────────────────────────────────────────
  scallop: {
    peaks:        12,
    outerR:       230,
    peakHeight:   22,
    innerCircleR: 185,
  },

  // ── Decorative type catalogue ─────────────────────────────
  // Used to populate the "Add decorative" picker in the UI.
  decorativeTypes: [
    { type: "sprig-left",  label: "Sprig (left)",   defaultColour: "#e05a1a" },
    { type: "sprig-right", label: "Sprig (right)",  defaultColour: "#3b5bdb" },
    { type: "sparkle",     label: "4-pt Sparkle",   defaultColour: "" },
    { type: "star",        label: "6-pt Star",       defaultColour: "#ffd700" },
    { type: "dot",         label: "Circle Dot",      defaultColour: "#7048e8" },
  ],

  // ── Export ───────────────────────────────────────────────
  export: {
    outputSize:     500,
    jpegQuality:    0.93,
    jpegQualityMin: 0.30,
    fileSizeCapKb:  250,
    filename:       "cpd-badge",
  },

  // ── Tabler icon groups ────────────────────────────────────
  iconGroups: [
    {
      label: "People & Community",
      icons: [
        { name: "users",       label: "Group" },
        { name: "user",        label: "Person" },
        { name: "user-check",  label: "Verified" },
        { name: "friends",     label: "Friends" },
        { name: "user-star",   label: "Star Student" },
      ]
    },
    {
      label: "Learning & Research",
      icons: [
        { name: "book",            label: "Book" },
        { name: "books",           label: "Library" },
        { name: "brain",           label: "Brain" },
        { name: "microscope",      label: "Research" },
        { name: "flask",           label: "Lab" },
        { name: "clipboard-list",  label: "Assessment" },
        { name: "chart-histogram", label: "Stats" },
        { name: "chart-bar",       label: "Bar Chart" },
        { name: "chart-line",      label: "Line Chart" },
        { name: "notes",           label: "Notes" },
        { name: "search",          label: "Enquiry" },
      ]
    },
    {
      label: "Achievement",
      icons: [
        { name: "award",       label: "Award" },
        { name: "trophy",      label: "Trophy" },
        { name: "star",        label: "Star" },
        { name: "medal",       label: "Medal" },
        { name: "certificate", label: "Certificate" },
        { name: "rosette",     label: "Rosette" },
      ]
    },
    {
      label: "Technology",
      icons: [
        { name: "device-laptop", label: "Laptop" },
        { name: "cpu",           label: "CPU" },
        { name: "code",          label: "Code" },
        { name: "database",      label: "Database" },
        { name: "robot-face",    label: "Robot" },
        { name: "checkbox",      label: "Checkbox" },
        { name: "wifi",          label: "Online" },
        { name: "cloud",         label: "Cloud" },
      ]
    },
    {
      label: "Wellbeing & Ethics",
      icons: [
        { name: "heart",        label: "Wellbeing" },
        { name: "shield-check", label: "Ethics" },
        { name: "scale",        label: "Balance" },
        { name: "sun",          label: "Positivity" },
        { name: "leaf",         label: "Growth" },
        { name: "hand-heart",   label: "Care" },
      ]
    },
  ],

  ui: {
    appTitle:    "CPD Badge Maker",
    appSubtitle: "Leeds Trinity University · Psychology",
    exportLabel: "Download Badge (.jpg)",
  },
};

window.CONFIG = CONFIG;
