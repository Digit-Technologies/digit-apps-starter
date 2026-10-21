import { blue, neutral, neutralAlpha, stone } from "./colors"

/**
 * Shared theme extension constants used by both the actual theme
 * and test utilities to ensure consistency.
 *
 * These values are extracted from the actual theme implementation
 * to maintain a single source of truth.
 */
export const themeExtensions = {
  border: {
    default: {
      light: neutralAlpha.darken[50], // "rgba(0, 0, 0, 0.05)"
      dark: neutralAlpha.lighten[50], // "rgba(255, 255, 255, 0.05)"
    },
    strong: {
      light: neutralAlpha.darken[100], // "rgba(0, 0, 0, 0.1)"
      dark: neutralAlpha.lighten[100], // "rgba(255, 255, 255, 0.1)"
      extrastrong: {
        light: neutralAlpha.darken[200], // "rgba(0, 0, 0, 0.1)"
        dark: neutralAlpha.lighten[200], // "rgba(255, 255, 255, 0.1)"
      },
    },
    extrastrong: {
      light: neutralAlpha.darken[200], // "rgba(0, 0, 0, 0.1)"
      dark: neutralAlpha.lighten[200], // "rgba(255, 255, 255, 0.1)"
    },
    // Figma paper/border/solid/*. Solid lines for page chrome: the page header and toolbar
    // dividers, menu outlines, and the sidebar edge.
    solidStrong: {
      light: neutral[200], // #e5e5e5
      dark: neutral[600], // #525252
    },
    solidDefault: {
      light: neutral[100], // #f5f5f5
      dark: neutral[700], // #404040
    },
  },
  // Figma table/row/background/*.
  table: {
    hover: {
      light: stone[50], // #fafaf9
      dark: stone[750], // #37322f
    },
    selected: {
      light: stone[100], // #f5f5f4
      dark: stone[700], // #44403b
    },
  },
  divider: {
    light: neutralAlpha.darken[50], // "rgba(0, 0, 0, 0.05)"
    dark: neutralAlpha.lighten[50], // "rgba(255, 255, 255, 0.05)"
  },
  opacity: {
    helper: 0.6,
    disabled: 0.3,
  },
  // Figma button-iconButton/all/outline/focus.
  tabFocus: {
    light: blue[600], // #155dfc
    dark: blue[400], // #51a2ff
  },
} as const

/**
 * Helper function to get theme extension values for a specific mode
 */
export const getThemeExtensions = (
  darkMode: boolean,
): {
  border: {
    default: string
    strong: string
    extrastrong: string
    solidStrong: string
    solidDefault: string
  }
  table: { hover: string; selected: string }
  divider: string
  opacity: { helper: number; disabled: number }
  tabFocus: string
} => ({
  border: {
    default: darkMode
      ? themeExtensions.border.default.dark
      : themeExtensions.border.default.light,
    strong: darkMode
      ? themeExtensions.border.strong.dark
      : themeExtensions.border.strong.light,
    extrastrong: darkMode
      ? themeExtensions.border.extrastrong.dark
      : themeExtensions.border.extrastrong.light,
    solidStrong: darkMode
      ? themeExtensions.border.solidStrong.dark
      : themeExtensions.border.solidStrong.light,
    solidDefault: darkMode
      ? themeExtensions.border.solidDefault.dark
      : themeExtensions.border.solidDefault.light,
  },
  table: {
    hover: darkMode ? themeExtensions.table.hover.dark : themeExtensions.table.hover.light,
    selected: darkMode
      ? themeExtensions.table.selected.dark
      : themeExtensions.table.selected.light,
  },
  divider: darkMode
    ? themeExtensions.divider.dark
    : themeExtensions.divider.light,
  opacity: themeExtensions.opacity,
  tabFocus: darkMode ? themeExtensions.tabFocus.dark : themeExtensions.tabFocus.light,
})
