export { DigitThemeProvider } from "./DigitThemeProvider"
export { themeOptions, mobileScaleFactor } from "./themeOptions"
export { palette } from "./palette"
export { typography } from "./typography"
export { applyThemeCssVariables } from "./cssVariables"
export { isDarkMode } from "./helpers/isDarkMode"
export { isLightMode } from "./helpers/isLightMode"
export { getThemeExtensions, themeExtensions } from "./theme-extensions"
export * from "./colors"
export type { ThemeProps } from "./types"

// Ensure MUI module augmentations are loaded for consumers
import "./types"
