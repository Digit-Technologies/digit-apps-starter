/**
 * Theme module. Public apps should import `DigitThemeProvider` from
 * `@digit/lib-frontend` only.
 */
export { DigitThemeProvider } from "./DigitThemeProvider"

// Ensure MUI module augmentations are loaded for consumers
import "./types"
