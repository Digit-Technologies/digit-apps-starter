import { AppErrorCode } from '@digit/lib-common';

import { HandlerError } from './createHandler';

type EnvLike = Record<string, unknown>;

export type RequireEnvArgs = {
  env: EnvLike;
  key: string;
};

/**
 * Read a required value from Worker `env` (string env/secret or a binding).
 * Missing / nullish / empty string → throws `HandlerError` (MISSING_CONFIG).
 * Use inside `createHandler` so the throw becomes a structured `{ ok: false, error }` Response.
 * Never put the value into error messages (secrets are bindings too).
 */
export function requireEnv<T = string>({ env, key }: RequireEnvArgs): T {
  const value = env[key];
  if (value === undefined || value === null || value === '') {
    throw new HandlerError({
      code: AppErrorCode.MISSING_CONFIG,
      message: `Set ${key} on the Digit app, then republish.`,
      status: 500,
    });
  }
  return value as T;
}

/**
 * Optional env / binding: returns null when unset (not an error).
 * Empty string → null. Prefer `requireEnv` when the handler cannot run without the value.
 */
export function optionalEnv<T = string>({ env, key }: RequireEnvArgs): T | null {
  const value = env[key];
  if (value === undefined || value === null) return null;
  if (value === '') return null;
  return value as T;
}
