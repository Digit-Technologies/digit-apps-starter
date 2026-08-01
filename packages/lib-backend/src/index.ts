/**
 * Public API for Digit app Cloudflare Workers.
 * Only import from this package root — other files are implementation details.
 */

// Result Responses
export { ok, err, AppErrorCode } from './respond';

// Worker entry wrapper (always returns structured JSON)
export { createHandler, HandlerError } from './createHandler';
export type { FetchHandler, CreateHandlerArgs, HandlerFetchArgs } from './createHandler';

// Env / bindings
export { requireEnv, optionalEnv } from './env';
export type { RequireEnvArgs } from './env';

// Validation (from `@digit/app-shared`)
export {
  parseJsonResponse,
  requiredString,
  optionalString,
  parseObject,
} from '@digit/app-shared';
export type {
  AppErrorDetail,
  ParseResult,
  SuccessResult,
  ErrorResult,
  Result,
} from '@digit/app-shared';
