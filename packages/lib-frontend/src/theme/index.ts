/**
 * Temporary vendored theme. Public starter apps import `DigitThemeProvider`
 * from `@heysutton/lib-frontend` until they depend on `@heysutton/ui`.
 * Do not add design-system wrappers here. `@heysutton/ui` (digit-web) is the
 * source of truth and is not published from this repo.
 */
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
