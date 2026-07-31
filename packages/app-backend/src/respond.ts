import {
  AppErrorCode,
  asObject,
  errResult,
  okResult,
  type AppErrorCode as AppErrorCodeType,
  type ParseResult,
} from '@digit/app-shared';

import { throwHttpError } from './httpError';

/**
 * JSON success / failure Responses for Digit app Workers.
 * Result shape comes from `@digit/app-shared`.
 */
export function ok(data: unknown, init: ResponseInit = {}): Response {
  const status = init.status ?? 200;
  return Response.json(okResult(data), { ...init, status });
}

export function fail(
  code: AppErrorCodeType,
  message: string,
  status = 400,
  init: ResponseInit = {},
): Response {
  return Response.json(errResult(code, message), { ...init, status });
}

/**
 * Unwrap a shared `ParseResult`, or throw `HttpError` (VALIDATION_ERROR by default).
 */
export function orFail<T>(result: ParseResult<T>, status = 400): T {
  if (!result.ok) {
    throwHttpError(result.error.code, result.error.message, status);
  }
  return result.value;
}

/** Read request JSON and require a plain object (throws on failure). */
export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.json().catch(() => null);
  return orFail(asObject(raw), 400);
}

export { AppErrorCode };
