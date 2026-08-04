import {
  type AppErrorCode as AppErrorCodeType,
  type ErrorResult,
  type SuccessResult,
} from '@digit/lib-common';

export type OkArgs = { data: unknown } & ResponseInit;

/**
 * JSON success Response for Digit app Workers.
 * Result shape comes from `@digit/lib-common`.
 */
export function ok({ data, ...init }: OkArgs): Response {
  const status = init.status ?? 200;
  const body = { ok: true, data } satisfies SuccessResult;
  return Response.json(body, { ...init, status });
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
  const body = { ok: false, error: { code, message } } satisfies ErrorResult;
  return Response.json(body, { ...init, status });
}
