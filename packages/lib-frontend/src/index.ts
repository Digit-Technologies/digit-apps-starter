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

// Components: the composite pieces from the Figma molecules and the product mockups. Everything
// else is a themed MUI component, imported from @mui/material.

// Page structure
export { PageHeader } from "./components/PageHeader"
export type { Crumb, PageHeaderProps } from "./components/PageHeader"
export { PageBody } from "./components/PageBody"
export type { PageBodyProps } from "./components/PageBody"
export { Section } from "./components/Section"
export type { SectionProps } from "./components/Section"
export { RecordCard } from "./components/RecordCard"
export type { RecordCardProps } from "./components/RecordCard"
export { PropertyGrid } from "./components/PropertyGrid"
export type { PropertyGridProps, PropertyGridRow } from "./components/PropertyGrid"

// Lists and records
export { DataTable } from "./components/DataTable"
export type {
  DataTableColumn,
  DataTableInset,
  DataTableProps,
  DataTableSearch,
  DataTableSelection,
  DataTableViews,
} from "./components/DataTable"
export { RecordName } from "./components/RecordName"
export type { RecordNameMeta, RecordNamePlaceholder, RecordNameProps } from "./components/RecordName"
export { StatusPill } from "./components/StatusPill"
export type { RecordStatus, StatusPillProps } from "./components/StatusPill"

// Dialogs and panels
export { Modal } from "./components/Modal"
export type { ModalFooterProps, ModalProps } from "./components/Modal"
export { SidePanel } from "./components/SidePanel"
export type { SidePanelProps } from "./components/SidePanel"
export { ConfirmDialog } from "./components/ConfirmDialog"
export type { ConfirmDialogProps } from "./components/ConfirmDialog"

// Settings and forms
export { FormField } from "./components/FormField"
export type { FormFieldProps } from "./components/FormField"
export { SwitchField } from "./components/SwitchField"
export type { SwitchFieldProps } from "./components/SwitchField"
export { SettingsSection } from "./components/SettingsSection"
export type { SettingsSectionProps } from "./components/SettingsSection"
export { SettingsRow } from "./components/SettingsRow"
export type { SettingsRowProps } from "./components/SettingsRow"
export { RadioCard } from "./components/RadioCard"
export type { RadioCardProps } from "./components/RadioCard"
export { FileDropZone } from "./components/FileDropZone"
export type { FileDropZoneProps } from "./components/FileDropZone"
export { FileUploadRow } from "./components/FileUploadRow"
export type { FileUploadRowProps, FileUploadStatus } from "./components/FileUploadRow"

// Feedback
export { EmptyState } from "./components/EmptyState"
export type { EmptyStateProps } from "./components/EmptyState"
export { ProgressBar } from "./components/ProgressBar"
export type { ProgressBarProps } from "./components/ProgressBar"
