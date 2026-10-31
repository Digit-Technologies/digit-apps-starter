/**
 * Sutton MUI theme. Apps import `ThemeProvider` from `@heysutton/sdk-react`.
 */
export { ThemeProvider, DigitThemeProvider } from "./DigitThemeProvider.js"

// Ensure MUI module augmentations are loaded for consumers
import "./types.js"
