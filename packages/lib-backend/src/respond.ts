import {
  AppErrorCode,
  errResult,
  okResult,
  type AppErrorCode as AppErrorCodeType,
} from '@digit/app-shared';

export type OkArgs = { data: unknown } & ResponseInit;

/**
 * JSON success Response for Digit app Workers.
 * Result shape comes from `@digit/app-shared`.
 */
export function ok({ data, ...init }: OkArgs): Response {
  const status = init.status ?? 200;
  return Response.json(okResult({ data }), { ...init, status });
}

export type ErrArgs = {
  code: AppErrorCodeType;
  message: string;
  status?: number;
} & ResponseInit;

/**
 * JSON error Response for Digit app Workers (`{ ok: false, error }`).
 */
export function err({ code, message, status = 400, ...init }: ErrArgs): Response {
  return Response.json(errResult({ code, message }), { ...init, status });
}

export { AppErrorCode };
