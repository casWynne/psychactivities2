/**
 * ============================================================
 * BADGE MAKER - CONFIGURATION FILE
 * ============================================================
 * All editable presets and defaults live here.
 * Academics can modify this file to adjust the tool's
 * behaviour without touching the core application logic.
 * ============================================================
 */

const CONFIG = {

  /**
   * COLOUR PRESETS
   * ─────────────
   * Define named colour themes here. Each preset has:
   *   - label:       Display name shown in the UI dropdown
   *   - border:      Outer ring / border colour
   *   - centre:      Inner shape fill colour
   *   - text:        Text colour on the border ring
   *   - textShadow:  Optional subtle shadow behind text (hex or 'none')
   *
   * Add as many presets as you like. The first entry is the default.
   */
  colourPresets: [
    {
      label: "DigiLearn Teal",
      border: "#1a9aad",
      centre: "#ffffff",
      text: "#ffffff",
      textShadow: "rgba(0,0,0,0.4)"
    },
    {
      label: "Psychology Purple",
      border: "#4a2d6f",
      centre: "#f5f0ff",
      text: "#ffffff",
      textShadow: "rgba(0,0,0,0.4)"
    },
    {
      label: "LTU Navy",
      border: "#0e2234",
      centre: "#ffffff",
      text: "#ffffff",
      textShadow: "rgba(0,0,0,0.3)"
    },
    {
      label: "Achievement Gold",
      border: "#b8860b",
      centre: "#fffbee",
      text: "#ffffff",
      textShadow: "rgba(0,0,0,0.4)"
    },
    {
      label: "Wellbeing Green",
      border: "#2e7d32",
      centre: "#f1f8e9",
      text: "#ffffff",
      textShadow: "rgba(0,0,0,0.3)"
    },
    {
      label: "Research Red",
      border: "#c62828",
      centre: "#fff5f5",
      text: "#ffffff",
      textShadow: "rgba(0,0,0,0.3)"
    },
    {
      label: "Monochrome",
      border: "#222222",
      centre: "#f8f8f8",
      text: "#ffffff",
      textShadow: "none"
    }
  ],

  /**
   * DEFAULT BADGE SETTINGS
   * ──────────────────────
   * Initial values when the app first loads.
   * Change these to set a different starting state.
   */
  defaults: {
    shape: "circle",                      // "circle" | "square" | "triangle"
    topText: "DIGILEARN",                  // Text for the top arc (optional)
    bottomText: "PRACTITIONER",            // Text for the bottom arc (required)
    colourPresetIndex: 0,                  // Index into colourPresets above
    borderWidth: 60,                       // Thickness of the badge border/ring in px (at 400px canvas)
    fontSize: 22,                          // Font size for arc text in px
    fontFamily: "Montserrat",              // Font family for text
    fontWeight: "700",                     // Font weight for text
    letterSpacing: 3,                      // Letter-spacing for arc text (px)
    iconName: "users",                     // Default Tabler icon (empty string = no icon)
    iconScale: 1.0,                        // Icon size multiplier (0.3 – 2.0)
    iconOffsetX: 0,                        // Icon X offset in SVG px (canvas is 500px; negative = left)
    iconOffsetY: -60,                      // Icon Y offset in SVG px (negative = up, positive = down)
    showUniversityLogo: true,             // Whether to show LTU logo at bottom of centre
    universityLogoScale: 0.38,             // Logo size as fraction of centre area width
    logoOffsetX: 0,                        // Logo X offset in SVG px (negative = left)
    logoOffsetY: 50,                       // Logo Y offset in SVG px (negative = up, positive = down)
  },

  /**
   * BADGE GEOMETRY
   * ──────────────
   * Controls proportions of the rendered SVG badge.
   * Adjust these to change the visual balance.
   */
  geometry: {
    canvasSize: 500,                       // Total SVG canvas width & height in px
    borderRatio: 0.25,                     // Border thickness as fraction of canvas size
    starSize: 10,                          // Size of decorative star/dot elements
    triangleCornerRadius: 12,             // Rounded corner radius on triangle shape
    squareCornerRadius: 18,               // Rounded corner radius on square shape
  },

  /**
   * EXPORT SETTINGS
   * ───────────────
   * Controls the downloadable JPEG output for Moodle upload.
   */
  export: {
    outputSize: 500,                       // Final exported JPEG size in px (square)
    filename: "badge",                     // Default filename (without extension)
    jpegQuality: 0.92,                     // Default JPEG quality 0.0–1.0 (shown as 10–100%)
    jpegQualityMin: 0.30,                  // Lowest quality the slider allows
    fileSizeCapKb: 250,                    // Moodle maximum file size in KB
    moodleRecommendedSize: 500,            // Informational — Moodle's preferred badge size
  },

  /**
   * TABLER ICON CATEGORIES
   * ──────────────────────
   * Curated icon sets relevant to UK Psychology degree contexts.
   * Each group has a label and an array of Tabler icon names.
   * Icons are loaded from the Tabler CDN sprite.
   *
   * Full icon list: https://tabler.io/icons
   */
  iconGroups: [
    {
      label: "People & Community",
      icons: [
        { name: "users", label: "Group" },
        { name: "user", label: "Person" },
        { name: "user-check", label: "Verified" },
        { name: "user-star", label: "Star Student" },
        { name: "friends", label: "Friends" },
        { name: "people", label: "People" },
      ]
    },
    {
      label: "Learning & Research",
      icons: [
        { name: "book", label: "Book" },
        { name: "books", label: "Library" },
        { name: "brain", label: "Brain" },
        { name: "microscope", label: "Research" },
        { name: "flask", label: "Science" },
        { name: "clipboard-list", label: "Assessment" },
        { name: "notes", label: "Notes" },
        { name: "chart-bar", label: "Data" },
        { name: "search", label: "Enquiry" },
      ]
    },
    {
      label: "Achievement",
      icons: [
        { name: "award", label: "Award" },
        { name: "trophy", label: "Trophy" },
        { name: "star", label: "Star" },
        { name: "medal", label: "Medal" },
        { name: "certificate", label: "Certificate" },
        { name: "rosette", label: "Rosette" },
        { name: "hexagon-letter-a", label: "Grade A" },
      ]
    },
    {
      label: "Digital Skills",
      icons: [
        { name: "device-laptop", label: "Laptop" },
        { name: "cpu", label: "Technology" },
        { name: "code", label: "Coding" },
        { name: "database", label: "Data" },
        { name: "wifi", label: "Online" },
        { name: "chart-line", label: "Analytics" },
      ]
    },
    {
      label: "Wellbeing & Ethics",
      icons: [
        { name: "heart", label: "Wellbeing" },
        { name: "heartbeat", label: "Health" },
        { name: "shield-check", label: "Ethics" },
        { name: "scale", label: "Balance" },
        { name: "sun", label: "Positivity" },
        { name: "leaf", label: "Growth" },
      ]
    }
  ],

  /**
   * UI TEXT LABELS
   * ──────────────
   * Editable labels for the interface. Useful if you want
   * to localise or rename sections without touching HTML.
   */
  ui: {
    appTitle: "DigiLearn Badge Maker",
    appSubtitle: "Leeds Trinity University · Psychology",
    exportButtonLabel: "Download Badge (.jpg)",
    noIconLabel: "No Icon (image or logo only)",
  }

};

// Make config available globally
window.CONFIG = CONFIG;