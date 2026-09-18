/**
 * Public API for Digit custom apps.
 * Only import from this package root — other files are implementation details.
 */

// Theme
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

// Label print HTML for DigitHost.print (composer layoutJson + record → snapshot)
export {
  renderLabelPrintHtml,
  printLabel,
  labelPrintTitle,
  parseLabelLayout,
  bindRecordValue,
  LabelPreview,
} from "./labels";
export type {
  LabelPrintConfig,
  LabelPrintRecord,
  LabelLayoutObject,
  ParsedLabelLayout,
  RenderLabelPrintHtmlArgs,
  PrintLabelArgs,
  LabelPreviewProps,
} from "./labels";
