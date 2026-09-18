/**
 * Public API for Sutton custom apps.
 * Only import from this package root — other files are implementation details.
 */

// Theme
export { DigitThemeProvider, SuttonThemeProvider } from "./theme";

// Host / proxy types (importing this package augments Window)
export type {
  DigitHost,
  DigitHostDownloadOptions,
  DigitHostPrintOptions,
  DigitHostSettings,
  SuttonHost,
  SuttonHostDownloadOptions,
  SuttonHostPrintOptions,
  SuttonHostSettings,
  SuttonProxyClient,
} from "./globals";
import "./globals";

// Errors
export { AppErrorAlert } from "./errors";
export type { AppError } from "./errors";

// Sutton API + app backend (hooks only — imperative fetch helpers are internal)
export {
  useDigitApiQuery,
  useDigitApiMutation,
  useSuttonApiQuery,
  useSuttonApiMutation,
  useBackendQuery,
  useBackendMutation,
} from "./api";
export type { DigitResult, SuttonResult } from "./api";
