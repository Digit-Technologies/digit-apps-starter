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

export type FailArgs = {
  code: AppErrorCodeType;
  message: string;
  status?: number;
} & ResponseInit;

export function fail({ code, message, status = 400, ...init }: FailArgs): Response {
  return Response.json(errResult({ code, message }), { ...init, status });
}

export { AppErrorCode };
