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
export type { PillColor, PillProps, PillSize } from "./components/Pill";
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

// Layout (native screens: page header, settings rows, radio cards, empty states)
export { PageHeader } from "./components/PageHeader";
export type { Crumb, PageHeaderProps } from "./components/PageHeader";
export { RadioCard } from "./components/RadioCard";
export type { RadioCardProps } from "./components/RadioCard";
export { SettingsRow } from "./components/SettingsRow";
export type { SettingsRowProps } from "./components/SettingsRow";
export { SettingsSection } from "./components/SettingsSection";
export type { SettingsSectionProps } from "./components/SettingsSection";
export { EmptyState } from "./components/EmptyState";
export type { EmptyStateProps } from "./components/EmptyState";
export { Switch } from "./components/Switch";
export type { SwitchProps } from "./components/Switch";
export { FormField } from "./components/FormField";
export type { FormFieldProps } from "./components/FormField";
