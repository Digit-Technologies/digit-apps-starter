import { neutralAlpha, purple } from "./colors"

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
  },
  divider: {
    light: neutralAlpha.darken[50], // "rgba(0, 0, 0, 0.05)"
    dark: neutralAlpha.lighten[50], // "rgba(255, 255, 255, 0.05)"
  },
  opacity: {
    helper: 0.6,
    disabled: 0.4,
  },
  tabFocus: purple[500], // "#a855f7"
} as const

/**
 * Helper function to get theme extension values for a specific mode
 */
export const getThemeExtensions = (
  darkMode: boolean,
): {
  border: { default: string; strong: string; extrastrong: string }
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
  },
  divider: darkMode
    ? themeExtensions.divider.dark
    : themeExtensions.divider.light,
  opacity: themeExtensions.opacity,
  tabFocus: themeExtensions.tabFocus,
})
