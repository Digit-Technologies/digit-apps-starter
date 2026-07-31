import { useCallback, useState } from 'react';

import type { AppError } from '../errors/types';

import { backendFetch } from './backendFetch';
import type { BackendFetchOptions, DigitResult, MutationHookResult } from './types';

/**
 * Call the app Worker on demand (POST/PUT/DELETE/…).
 * Returns `[mutate, { data, error, loading, reset }]`.
 *
 * `mutate(path, options?)` — path is required per call so CRUD can target `/notes/:id`.
 */
export function useBackendMutation<T = unknown>(): [
  (path: string, options?: BackendFetchOptions) => Promise<DigitResult<T>>,
  MutationHookResult<T>,
] {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setLoading(false);
  }, []);

  const mutate = useCallback(async (path: string, options?: BackendFetchOptions) => {
    setLoading(true);
    setError(null);
    const result = await backendFetch<T>(path, options);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return result;
    }
    setData(result.data);
    setLoading(false);
    return result;
  }, []);

  return [mutate, { data, error, loading, reset }];
}
