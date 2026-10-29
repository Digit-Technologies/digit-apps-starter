/**
 * Sutton MUI theme. Apps import `ThemeProvider` from `@heysutton/sdk-react`.
 * Do not add design-system wrappers here.
 */
export { ThemeProvider, DigitThemeProvider } from "./DigitThemeProvider.js"
export { themeOptions, mobileScaleFactor } from "./themeOptions.js"
export { palette } from "./palette.js"
export { typography } from "./typography.js"
export { applyThemeCssVariables } from "./cssVariables.js"
export { isDarkMode } from "./helpers/isDarkMode.js"
export { isLightMode } from "./helpers/isLightMode.js"
export { getThemeExtensions, themeExtensions } from "./theme-extensions.js"
export * from "./colors.js"
export type { ThemeProps } from "./types.js"

// Ensure MUI module augmentations are loaded for consumers
import "./types.js"
