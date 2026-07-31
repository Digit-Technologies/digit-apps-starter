import type { AppErrorCode, AppErrorDetail } from './codes';

/** Standard JSON success body returned by app Workers. */
export type SuccessResult<T = unknown> = {
  ok: true;
  data: T;
};

/** Standard JSON failure body returned by app Workers. */
export type FailureResult = {
  ok: false;
  error: AppErrorDetail;
};

/** Discriminated `{ ok, data }` / `{ ok, error }` result for Worker JSON responses. */
export type Result<T = unknown> = SuccessResult<T> | FailureResult;

export function okResult<T>({ data }: { data: T }): SuccessResult<T> {
  return { ok: true, data };
}

export function errResult({
  code,
  message,
}: {
  code: AppErrorCode;
  message: string;
}): FailureResult {
  return { ok: false, error: { code, message } };
}

/** Parse-time result (uses `value`, not `data`) for validation helpers. */
export type ParseOk<T> = { ok: true; value: T };
export type ParseErr = { ok: false; error: AppErrorDetail };
export type ParseResult<T> = ParseOk<T> | ParseErr;

export function ok<T>({ value }: { value: T }): ParseOk<T> {
  return { ok: true, value };
}

export function err({
  code,
  message,
}: {
  code: AppErrorDetail['code'];
  message: string;
}): ParseErr {
  return { ok: false, error: { code, message } };
}
