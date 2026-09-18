/**
 * Public API for Sutton custom apps.
 * Only import from this package root — other files are implementation details.
 */

// Theme
export { SuttonThemeProvider, DigitThemeProvider } from "./theme";

// Host / proxy types (importing this package augments Window)
export type {
  SuttonHost,
  SuttonHostDownloadOptions,
  SuttonHostPrintOptions,
  SuttonHostSettings,
  SuttonProxyClient,
  DigitHost,
  DigitHostDownloadOptions,
  DigitHostPrintOptions,
  DigitHostSettings,
} from "./globals";
import "./globals";

// Errors
export { AppErrorAlert } from "./errors";
export type { AppError } from "./errors";

// Sutton API + app backend (hooks only — imperative fetch helpers are internal)
export {
  useSuttonApiQuery,
  useSuttonApiMutation,
  useDigitApiQuery,
  useDigitApiMutation,
  useBackendQuery,
  useBackendMutation,
} from "./api";
export type { SuttonResult, DigitResult } from "./api";
