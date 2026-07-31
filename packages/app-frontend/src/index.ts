/**
 * Public API for Digit custom apps.
 * Only import from this package root — other files are implementation details.
 */

// Theme
export { DigitThemeProvider } from "./theme"

// Host / proxy types (importing this package augments Window)
export type { DigitHost, DigitHostSettings, DigitProxyClient } from "./globals"
import "./globals"

// Errors
export { AppErrorAlert } from "./errors"
export type { AppError, AppErrorKind, AppErrorAlertProps } from "./errors"

// Digit API + app backend
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
  BackendFetchArgs,
  QueryHookResult,
  MutationHookResult,
  UseDigitApiQueryArgs,
  UseDigitApiMutationArgs,
  UseBackendQueryArgs,
} from "./api"

// Shared error codes (handy when branching on `error.code`)
export { AppErrorCode } from "@digit/app-shared"
export type { AppErrorDetail } from "@digit/app-shared"
