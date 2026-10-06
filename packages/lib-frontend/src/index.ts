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

// Errors
export { AppErrorAlert } from "./errors";
export type { AppError } from "./errors";

// Shared Digit UI (sanitized from digit-web)
export {
  Modal,
  MODAL_HORIZONTAL_PADDING,
  InputTextField,
  InputContainerDiv,
  IconWrapper,
  LUCIDE_STROKE_WIDTH,
  InvisibleButton,
  getDetailInsetProps,
  resolveDetailInsetMode,
  detailInsetGlobalStyleOverrides,
  DETAIL_INSET_FIELD_HEIGHT_SPACING,
  detailPaperSectionStackSx,
  detailPaperIconRowSx,
  detailPaperLeadingIconSx,
  detailPaperLeadingIconColor,
  detailPaperFieldStackSx,
  detailPaperDetailLinesStackSx,
  detailPaperCompactTextSx,
  detailPaperSwitchRowSx,
  detailPaperSectionLabelSx,
  detailInsetSectionStackSx,
  detailInsetFieldRowSx,
  detailInsetFieldColumnSx,
  getDetailContentHorizontalPadding,
  detailInsetSectionContainerSx,
  detailPaperColumnBoxSx,
} from "./components";
export type {
  ModalProps,
  InputTextFieldProps,
  IconWrapperProps,
  InvisibleButtonProps,
  DetailInsetMode,
} from "./components";

// Digit API + app backend (hooks only — imperative fetch helpers are internal)
export {
  useDigitApiQuery,
  useDigitApiMutation,
  useBackendQuery,
  useBackendMutation,
} from "./api";
export type { DigitResult } from "./api";
