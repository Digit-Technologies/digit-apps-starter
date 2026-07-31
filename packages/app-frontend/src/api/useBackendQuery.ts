import { useCallback, useEffect, useRef, useState } from 'react';

import type { AppError } from '../errors/types';

import { backendFetch } from './backendFetch';
import type { BackendFetchOptions, QueryHookResult } from './types';

export type UseBackendQueryOptions = BackendFetchOptions & {
  /** When true, do not fetch until `refetch()` is called. */
  skip?: boolean;
};

/**
 * GET (or otherwise fetch) from the app Worker. Returns `{ data, error, loading, refetch }`.
 */
export function useBackendQuery<T = unknown>(
  path: string,
  options?: UseBackendQueryOptions,
): QueryHookResult<T> {
  const skip = options?.skip ?? false;
  const method = options?.method;
  const bodyKey = JSON.stringify(options?.body ?? null);
  const optionsRef = useRef<BackendFetchOptions>({
    method: options?.method,
    body: options?.body,
  });
  optionsRef.current = { method: options?.method, body: options?.body };

  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(!skip);
  const requestId = useRef(0);

  const refetch = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    const result = await backendFetch<T>(path, optionsRef.current);
    if (id !== requestId.current) return;
    if (!result.ok) {
      setData(undefined);
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setError(null);
    setLoading(false);
  }, [path]);

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }
    void refetch();
  }, [skip, refetch, method, bodyKey]);

  return { data, error, loading, refetch };
}
