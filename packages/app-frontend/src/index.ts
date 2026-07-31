export {
  DigitThemeProvider,
  themeOptions,
  mobileScaleFactor,
  palette,
  typography,
  applyThemeCssVariables,
  isDarkMode,
  isLightMode,
  getThemeExtensions,
  themeExtensions,
} from "./theme"
export * from "./theme/colors"
export type { ThemeProps } from "./theme"

export type { DigitHost, DigitHostSettings, DigitProxyClient } from "./globals"
// Ensure Window.DigitHost / Window.DigitProxyClient are in scope for consumers.
import "./globals"

export {
  AppErrorAlert,
  parseProxyBody,
  parseBackendResponse,
  fromThrown,
  unavailableClient,
  userMessage,
  isRetryable,
} from "./errors"
export type {
  AppError,
  AppErrorKind,
  AppErrorAlertProps,
  BackendErrorBody,
  BackendSuccessBody,
  PlatformErrorBody,
} from "./errors"

export {
  digitRequest,
  backendFetch,
  useDigitApiQuery,
  useDigitApiMutation,
  useBackendQuery,
  useBackendMutation,
} from "./api"
export type {
  DigitResult,
  BackendFetchOptions,
  QueryHookResult,
  MutationHookResult,
  UseDigitApiQueryOptions,
  UseBackendQueryOptions,
} from "./api"

// Shared contracts (codes, results, pure validation)
export {
  AppErrorCode,
  asObject,
  requiredString,
  optionalString,
  parseObject,
  okResult,
  errResult,
} from "@digit/app-shared"
export type {
  AppErrorDetail,
  ParseResult,
  SuccessResult,
  FailureResult,
  Result,
} from "@digit/app-shared"
