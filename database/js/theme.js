/**
 * THEME TOGGLE - Dark Mode Support
 * Handles dark/light mode switching with system preference detection
 * and localStorage persistence
 */

const THEME_STORAGE_KEY = 'project-db-theme';
const THEME_DARK = 'dark-mode';
const THEME_LIGHT = 'light-mode';

class ThemeManager {
  constructor() {
    this.themeToggleBtn = document.getElementById('theme-toggle');
    this.themeIcon = document.getElementById('theme-icon');
    this.init();
  }

  /**
   * Initialize theme on page load
   */
  init() {
    const savedTheme = this.getSavedTheme();
    const prefersDark = this.prefersColorSchemeDark();
    const initialTheme = savedTheme || (prefersDark ? THEME_DARK : THEME_LIGHT);

    this.setTheme(initialTheme);
    this.attachEventListeners();

    // Listen for system theme changes
    if (window.matchMedia) {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (!this.getSavedTheme()) {
            this.setTheme(e.matches ? THEME_DARK : THEME_LIGHT);
          }
        });
    }
  }

  /**
   * Get saved theme from localStorage
   */
  getSavedTheme() {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Check if system prefers dark mode
   */
  prefersColorSchemeDark() {
    if (!window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Set the theme
   * @param {string} theme - 'dark-mode' or 'light-mode'
   */
  setTheme(theme) {
    const isDark = theme === THEME_DARK;

    // Update DOM classes
    document.body.classList.remove(THEME_DARK, THEME_LIGHT);
    document.body.classList.add(theme);

    // Update button icon and label
    if (this.themeIcon) {
      this.themeIcon.textContent = isDark ? '☀️' : '🌙';
    }

    if (this.themeToggleBtn) {
      const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      this.themeToggleBtn.setAttribute('aria-label', label);
      this.themeToggleBtn.title = label;
    }

    // Save preference to localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Silently fail if localStorage is not available
    }

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      // Light: primary blue, Dark: lighter blue
      metaThemeColor.setAttribute('content', isDark ? '#A8C5E0' : '#8B9DC3');
    }

    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
  }

  /**
   * Toggle between dark and light mode
   */
  toggle() {
    const currentTheme = document.body.classList.contains(THEME_DARK)
      ? THEME_DARK
      : THEME_LIGHT;
    const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    this.setTheme(newTheme);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => this.toggle());
    }
  }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
  });
} else {
  new ThemeManager();
}
