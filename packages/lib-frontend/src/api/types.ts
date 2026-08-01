import type { AppError } from '../errors/types';

export type DigitResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

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
