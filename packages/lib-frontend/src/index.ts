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
export type { TableColumn, TableInset, TableProps, TableSelection, TableView } from "./components/Table";

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
export { RecordName } from "./components/RecordName";
export type { RecordNameMeta, RecordNameProps } from "./components/RecordName";
export { FileDropZone } from "./components/FileDropZone";
export type { FileDropZoneProps } from "./components/FileDropZone";
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
export { PropertyGrid } from "./components/PropertyGrid";
export type { PropertyGridProps, PropertyGridRow } from "./components/PropertyGrid";
export { RecordCard, RecordCardSection } from "./components/RecordCard";
export type { RecordCardProps, RecordCardSectionProps } from "./components/RecordCard";
export { Section } from "./components/Section";
export type { SectionProps } from "./components/Section";
export { FileUploadRow } from "./components/FileUploadRow";
export type { FileUploadRowProps, FileUploadStatus } from "./components/FileUploadRow";
export { Modal, ModalFooter, ModalHeader, ModalSection } from "./components/Modal";
export type { ModalFooterProps, ModalHeaderProps, ModalProps, ModalSectionProps } from "./components/Modal";
export { SidePanel } from "./components/SidePanel";
export type { SidePanelProps } from "./components/SidePanel";
export { ProgressBar } from "./components/ProgressBar";
export type { ProgressBarProps } from "./components/ProgressBar";
export { PageBody } from "./components/PageBody";
export type { PageBodyProps } from "./components/PageBody";
