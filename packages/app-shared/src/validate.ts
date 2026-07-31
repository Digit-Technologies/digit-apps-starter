import { AppErrorCode } from './codes';
import { err, ok, type ParseResult } from './result';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Require a plain object (typical JSON body). */
export function asObject({ value }: { value: unknown }): ParseResult<Record<string, unknown>> {
  if (!isPlainObject(value)) {
    return err({
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'Request body must be a JSON object.',
    });
  }
  return ok({ value });
}

/**
 * Await a JSON value (e.g. `request.json()`) and require a plain object.
 * Returns a `ParseResult` — does not throw.
 *
 * @example
 * const body = await parseJsonObject({ value: request.json() });
 * if (!body.ok) return fail({ code: body.error.code, message: body.error.message });
 */
export async function parseJsonObject({
  value,
}: {
  value: Promise<unknown> | unknown;
}): Promise<ParseResult<Record<string, unknown>>> {
  let raw: unknown;
  try {
    raw = await value;
  } catch {
    return err({
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'Request body must be valid JSON.',
    });
  }
  return asObject({ value: raw });
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

export type ParseObjectArgs<T extends Record<string, unknown>> = {
  value: unknown;
  fields: { [K in keyof T]: (obj: Record<string, unknown>) => ParseResult<T[K]> };
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
  const obj = asObject({ value });
  if (!obj.ok) return obj;

  const out = {} as T;
  for (const key of Object.keys(fields) as Array<keyof T>) {
    const parsed = fields[key](obj.value);
    if (!parsed.ok) return parsed;
    out[key] = parsed.value;
  }
  return ok({ value: out });
}
