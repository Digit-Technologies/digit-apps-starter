import { AppErrorCode } from './codes';
import { err, ok, type ParseResult } from './result';

/** Require a non-null, non-array object. Returns a typed `ParseResult`. */
function parsePlainObject({
  value,
}: {
  value: unknown;
}): ParseResult<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return err({
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'Request body must be a JSON object.',
    });
  }
  return ok({ value: value as Record<string, unknown> });
}

export type StringFieldOptions = {
  /** Trim whitespace (default true for required strings). */
  trim?: boolean;
  /** Allow empty string after trim (default false for required). */
  allowEmpty?: boolean;
};

export type RequiredStringArgs = StringFieldOptions & {
  obj: Record<string, unknown>;
  key: string;
};

/** Required string field on an object. */
export function requiredString({
  obj,
  key,
  trim = true,
  allowEmpty = false,
}: RequiredStringArgs): ParseResult<string> {
  const raw = obj[key];
  if (typeof raw !== 'string') {
    return err({ code: AppErrorCode.VALIDATION_ERROR, message: `${key} is required.` });
  }
  const value = trim ? raw.trim() : raw;
  if (!allowEmpty && value.length === 0) {
    return err({ code: AppErrorCode.VALIDATION_ERROR, message: `${key} is required.` });
  }
  return ok({ value });
}

export type OptionalStringArgs = StringFieldOptions & {
  obj: Record<string, unknown>;
  key: string;
  /** Used when the key is missing or null/undefined. */
  default?: string;
};

/**
 * Optional string field. Missing → default (or empty string if default omitted).
 * Present but wrong type → VALIDATION_ERROR.
 */
export function optionalString({
  obj,
  key,
  trim = true,
  default: fallback = '',
}: OptionalStringArgs): ParseResult<string> {
  if (!(key in obj) || obj[key] === undefined || obj[key] === null) {
    return ok({ value: fallback });
  }
  const raw = obj[key];
  if (typeof raw !== 'string') {
    return err({ code: AppErrorCode.VALIDATION_ERROR, message: `${key} must be a string.` });
  }
  return ok({ value: trim ? raw.trim() : raw });
}

export type ParseFields<T extends Record<string, unknown>> = {
  [K in keyof T]: (obj: Record<string, unknown>) => ParseResult<T[K]>;
};

export type ParseObjectArgs<T extends Record<string, unknown>> = {
  value: unknown;
  fields: ParseFields<T>;
};

/**
 * Run field parsers against a value that must be an object.
 * Stops at the first failure.
 *
 * @example
 * parseObject({
 *   value: body,
 *   fields: {
 *     title: (obj) => requiredString({ obj, key: 'title' }),
 *     body: (obj) => optionalString({ obj, key: 'body', default: '' }),
 *   },
 * })
 */
export function parseObject<T extends Record<string, unknown>>({
  value,
  fields,
}: ParseObjectArgs<T>): ParseResult<T> {
  const obj = parsePlainObject({ value });
  if (!obj.ok) return obj;

  const out = {} as T;
  for (const key of Object.keys(fields) as Array<keyof T>) {
    const parsed = fields[key](obj.value);
    if (!parsed.ok) return parsed;
    out[key] = parsed.value;
  }
  return ok({ value: out });
}

export type ParseJsonResponseArgs<T extends Record<string, unknown>> = {
  /** `request.json()`, a `Response.json()` promise, or an already-parsed value. */
  value: Promise<unknown> | unknown;
  /** Same field parsers as `parseObject`. Omit to keep a plain object. */
  fields?: ParseFields<T>;
};

/**
 * Await JSON (e.g. `request.json()`), require a plain object, optionally parse `fields`.
 * Returns a typed `ParseResult` — does not throw.
 *
 * @example With fields (typed)
 * const parsed = await parseJsonResponse({
 *   value: request.json(),
 *   fields: {
 *     title: (obj) => requiredString({ obj, key: 'title' }),
 *     body: (obj) => optionalString({ obj, key: 'body', default: '' }),
 *   },
 * });
 * if (!parsed.ok) {
 *   return err({ code: parsed.error.code, message: parsed.error.message, status: 400 });
 * }
 * // parsed.value.title: string
 *
 * @example Object only
 * const body = await parseJsonResponse({ value: request.json() });
 * if (!body.ok) {
 *   return err({ code: body.error.code, message: body.error.message, status: 400 });
 * }
 */
export async function parseJsonResponse<T extends Record<string, unknown> = Record<string, unknown>>({
  value,
  fields,
}: ParseJsonResponseArgs<T>): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await value;
  } catch {
    return err({
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'Request body must be valid JSON.',
    });
  }

  if (fields) {
    return parseObject({ value: raw, fields });
  }

  const obj = parsePlainObject({ value: raw });
  if (!obj.ok) return obj;
  return ok({ value: obj.value as T });
}
