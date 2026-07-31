import { AppErrorCode } from '@digit/app-shared';

import { throwHttpError } from './httpError';

type EnvLike = Record<string, unknown>;

/**
 * Read a required env var / secret. Missing or empty → throws HttpError (MISSING_CONFIG).
 * Never put the value into error messages (secrets are bindings too).
 */
export function requireEnv(env: EnvLike, key: string): string {
  const value = env[key];
  if (typeof value !== 'string' || value.length === 0) {
    throwHttpError(
      AppErrorCode.MISSING_CONFIG,
      `Set ${key} on the Digit app (env var or secret), then republish.`,
      500,
    );
  }
  return value;
}

/**
 * Optional env: returns null when unset (not an error).
 */
export function optionalEnv(env: EnvLike, key: string): string | null {
  const value = env[key];
  if (typeof value !== 'string' || value.length === 0) return null;
  return value;
}

/** Resource kinds that live on Worker `env` (extend as the platform grows). */
export type AssertExistsVariant = 'database';

const VARIANT_LABEL: Record<AssertExistsVariant, string> = {
  database: 'Database',
};

export type AssertExistsArgs = {
  env: EnvLike;
  variant: AssertExistsVariant;
  /** Name of the handle on `env` (from the app manifest). */
  key: string;
};

/**
 * Assert a required resource handle is present on `env`.
 * Missing / nullish → throws HttpError (MISSING_CONFIG).
 */
export function assertExists<T = unknown>({ env, variant, key }: AssertExistsArgs): T {
  const value = env[key];
  if (value === undefined || value === null) {
    throwHttpError(
      AppErrorCode.MISSING_CONFIG,
      `${VARIANT_LABEL[variant]} ${key} is not configured on this app.`,
      500,
    );
  }
  return value as T;
}
