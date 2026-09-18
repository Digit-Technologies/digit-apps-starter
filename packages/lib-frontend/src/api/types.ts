import type { AppError } from '../errors/types';

export type SuttonResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

/**
 * @deprecated Use {@link SuttonResult}. Same shape; will be removed in a later release.
 */
export type DigitResult<T = unknown> = SuttonResult<T>;

export type BackendFetchOptions = {
  method?: string;
  body?: unknown;
};

export type QueryHookResult<T> = {
  data: T | undefined;
  error: AppError | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

export type MutationHookResult<T> = {
  data: T | undefined;
  error: AppError | null;
  loading: boolean;
  reset: () => void;
};
