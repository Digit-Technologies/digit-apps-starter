/**
 * Public API for Sutton custom apps.
 * Only import from this package root — other files are implementation details.
 */

// Sutton MUI theme. Design-system wrappers (Modal, InputTextField, IconWrapper,
// InvisibleButton) are intentionally not part of this package.
export { ThemeProvider } from "./theme/index.js";

// Host API + types (importing this package augments Window)
export { AppHost } from "./host/index.js";
export type {
  AppHostDownloadOptions,
  AppHostPrintOptions,
  AppHostSettings,
  DigitHost,
  DigitHostDownloadOptions,
  DigitHostPrintOptions,
  DigitHostSettings,
  HostInvokeParams,
} from "./globals.js";
import "./globals.js";

// Errors
export { AppErrorAlert } from "./errors/index.js";
export type { AppError } from "./errors/index.js";

// Platform API + app backend (hooks only — imperative fetch helpers are internal)
export {
  useApiQuery,
  useApiMutation,
  useBackendQuery,
  useBackendMutation,
} from "./api/index.js";
export type { ApiResult } from "./api/index.js";

// Labels designed in Sutton. The host renders them; the app previews the HTML, then prints.
export {
  LabelPreview,
  LabelPrintDialog,
  LabelPrintPanel,
  printLabel,
  useLabelPrint,
} from "./labels/index.js";
export type {
  LabelEntityType,
  LabelPreviewDocument,
  LabelPreviewProps,
  LabelPrintDialogProps,
  LabelPrintPanelProps,
  UseLabelPrintOptions,
  PrintLabelArgs,
  PrintLabelMode,
} from "./labels/index.js";

// Deprecated Digit* names, kept as aliases so existing apps keep working.
// (DigitHost* types above are deprecated aliases too.)
export { DigitThemeProvider } from "./theme/index.js";
export { useDigitApiQuery, useDigitApiMutation } from "./api/index.js";
export type { DigitResult } from "./api/index.js";
