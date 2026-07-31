import { AppErrorCode } from '@digit/app-shared';

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
 * Optional string env: returns null when unset / empty (not an error).
 */
export function optionalEnv({ env, key }: RequireEnvArgs): string | null {
  const value = env[key];
  if (typeof value !== 'string' || value.length === 0) return null;
  return value;
}
