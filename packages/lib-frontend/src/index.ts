/// <reference path="./css.d.ts" />
/**
 * Public API for Digit custom apps.
 * Only import from this package root — other files are implementation details.
 */

// Temporary re-export. Theme and UI source of truth is `@heysutton/ui`
// (published from digit-web). This package does not publish that design
// system, and it does not export Modal / InputTextField / IconWrapper /
// InvisibleButton. Remove this export once starter apps depend on
// `@heysutton/ui`.
export { DigitThemeProvider } from "./theme";

// Host API + types (importing this package augments Window)
export { AppHost } from "./host";
export type {
  AppHostDownloadOptions,
  AppHostPrintOptions,
  AppHostSettings,
  DigitHost,
  DigitHostDownloadOptions,
  DigitHostPrintOptions,
  DigitHostSettings,
  HostInvokeParams,
} from "./globals";
import "./globals";

// Errors
export { AppErrorAlert } from "./errors";
export type { AppError } from "./errors";

// Digit API + app backend (hooks only — imperative fetch helpers are internal)
export {
  useDigitApiQuery,
  useDigitApiMutation,
  useBackendQuery,
  useBackendMutation,
} from "./api";
export type { DigitResult } from "./api";
