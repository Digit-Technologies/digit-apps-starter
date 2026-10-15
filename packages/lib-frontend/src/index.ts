/// <reference path="./css.d.ts" />
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

// Components
export { Pill } from "./components/Pill";
export type { PillColor, PillProps, PillTone } from "./components/Pill";
export { ConfirmDialog } from "./components/ConfirmDialog";
export type { ConfirmDialogProps } from "./components/ConfirmDialog";
export { Table } from "./components/Table";
export type { TableProps } from "./components/Table";

// Icons (Lucide, the same set the platform uses)
export * from "./icons";

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

// Labels designed in Sutton. The host renders them; the app previews the HTML, then prints.
export {
  LabelPreview,
  LabelPrintDialog,
  LabelPrintPanel,
  printLabel,
  useLabelPrint,
} from "./labels";
export type {
  LabelEntityType,
  LabelPreviewDocument,
  LabelPreviewProps,
  LabelPrintDialogProps,
  LabelPrintPanelProps,
  UseLabelPrintOptions,
  PrintLabelArgs,
  PrintLabelMode,
} from "./labels";
