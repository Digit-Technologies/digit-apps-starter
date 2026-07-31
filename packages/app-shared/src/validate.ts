import { AppErrorCode } from './codes';
import { err, ok, type ParseResult } from './result';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Require a plain object (typical JSON body). */
export function asObject(value: unknown): ParseResult<Record<string, unknown>> {
  if (!isPlainObject(value)) {
    return err(AppErrorCode.VALIDATION_ERROR, 'Request body must be a JSON object.');
  }
  return ok(value);
}

export type StringFieldOptions = {
  /** Trim whitespace (default true for required strings). */
  trim?: boolean;
  /** Allow empty string after trim (default false for required). */
  allowEmpty?: boolean;
};

/** Required string field on an object. */
export function requiredString(
  obj: Record<string, unknown>,
  key: string,
  options: StringFieldOptions = {},
): ParseResult<string> {
  const trim = options.trim ?? true;
  const allowEmpty = options.allowEmpty ?? false;
  const raw = obj[key];
  if (typeof raw !== 'string') {
    return err(AppErrorCode.VALIDATION_ERROR, `${key} is required.`);
  }
  const value = trim ? raw.trim() : raw;
  if (!allowEmpty && value.length === 0) {
    return err(AppErrorCode.VALIDATION_ERROR, `${key} is required.`);
  }
  return ok(value);
}

export type OptionalStringOptions = StringFieldOptions & {
  /** Used when the key is missing or null/undefined. */
  default?: string;
};

/**
 * Optional string field. Missing → default (or empty string if default omitted).
 * Present but wrong type → VALIDATION_ERROR.
 */
export function optionalString(
  obj: Record<string, unknown>,
  key: string,
  options: OptionalStringOptions = {},
): ParseResult<string> {
  const trim = options.trim ?? true;
  const fallback = options.default ?? '';
  if (!(key in obj) || obj[key] === undefined || obj[key] === null) {
    return ok(fallback);
  }
  const raw = obj[key];
  if (typeof raw !== 'string') {
    return err(AppErrorCode.VALIDATION_ERROR, `${key} must be a string.`);
  }
  return ok(trim ? raw.trim() : raw);
}

/**
 * Run field parsers against a value that must be an object.
 * Stops at the first failure.
 *
 * @example
 * parseObject(body, {
 *   title: (o) => requiredString(o, 'title'),
 *   body: (o) => optionalString(o, 'body', { default: '' }),
 * })
 */
export function parseObject<T extends Record<string, unknown>>(
  value: unknown,
  fields: { [K in keyof T]: (obj: Record<string, unknown>) => ParseResult<T[K]> },
): ParseResult<T> {
  const obj = asObject(value);
  if (!obj.ok) return obj;

  const out = {} as T;
  for (const key of Object.keys(fields) as Array<keyof T>) {
    const parsed = fields[key](obj.value);
    if (!parsed.ok) return parsed;
    out[key] = parsed.value;
  }
  return ok(out);
}
