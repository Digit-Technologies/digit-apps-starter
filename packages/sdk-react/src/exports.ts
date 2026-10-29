/**
 * Public API for Sutton custom apps.
 * Only import from this package root — other files are implementation details.
 */

// Sutton MUI theme, built from the Figma design system. The digit-web wrappers (InputTextField,
// IconWrapper, InvisibleButton) are not part of this package; the composite components below are.
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

// Icons (Lucide, the same set the platform uses)
export * from "./icons.js";

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

// Components: the composite pieces from the Figma molecules and the product mockups. Everything
// else is a themed MUI component, imported from @mui/material.

// Page structure
export { PageHeader } from "./components/PageHeader.js"
export type { Crumb, PageHeaderProps } from "./components/PageHeader.js"
export { PageBody } from "./components/PageBody.js"
export type { PageBodyProps } from "./components/PageBody.js"
export { Section } from "./components/Section.js"
export type { SectionProps } from "./components/Section.js"
export { RecordCard } from "./components/RecordCard.js"
export type { RecordCardProps } from "./components/RecordCard.js"
export { PropertyGrid } from "./components/PropertyGrid.js"
export type { PropertyGridProps, PropertyGridRow } from "./components/PropertyGrid.js"

// Lists and records
export { DataTable } from "./components/DataTable.js"
export type {
  DataTableColumn,
  DataTableInset,
  DataTableProps,
  DataTableSearch,
  DataTableSelection,
  DataTableViews,
} from "./components/DataTable.js"
export { RecordName } from "./components/RecordName.js"
export type { RecordNameMeta, RecordNamePlaceholder, RecordNameProps } from "./components/RecordName.js"
export { StatusPill } from "./components/StatusPill.js"
export type { RecordStatus, StatusPillProps } from "./components/StatusPill.js"

// Dialogs and panels
export { Modal } from "./components/Modal.js"
export type { ModalFooterProps, ModalProps } from "./components/Modal.js"
export { SidePanel } from "./components/SidePanel.js"
export type { SidePanelProps } from "./components/SidePanel.js"
export { ConfirmDialog } from "./components/ConfirmDialog.js"
export type { ConfirmDialogProps } from "./components/ConfirmDialog.js"

// Settings and forms
export { FormField } from "./components/FormField.js"
export type { FormFieldProps } from "./components/FormField.js"
export { SwitchField } from "./components/SwitchField.js"
export type { SwitchFieldProps } from "./components/SwitchField.js"
export { SettingsSection } from "./components/SettingsSection.js"
export type { SettingsSectionProps } from "./components/SettingsSection.js"
export { SettingsRow } from "./components/SettingsRow.js"
export type { SettingsRowProps } from "./components/SettingsRow.js"
export { RadioCard } from "./components/RadioCard.js"
export type { RadioCardProps } from "./components/RadioCard.js"
export { FileDropZone } from "./components/FileDropZone.js"
export type { FileDropZoneProps } from "./components/FileDropZone.js"
export { FileUploadRow } from "./components/FileUploadRow.js"
export type { FileUploadRowProps, FileUploadStatus } from "./components/FileUploadRow.js"

// Feedback
export { EmptyState } from "./components/EmptyState.js"
export type { EmptyStateProps } from "./components/EmptyState.js"
export { ProgressBar } from "./components/ProgressBar.js"
export type { ProgressBarProps } from "./components/ProgressBar.js"

// Deprecated Digit* names, kept as aliases so existing apps keep working.
// (DigitHost* types above are deprecated aliases too.)
export { DigitThemeProvider } from "./theme/index.js";
export { useDigitApiQuery, useDigitApiMutation } from "./api/index.js";
export type { DigitResult } from "./api/index.js";
