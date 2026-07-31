import { useCallback, useEffect, useRef, useState } from 'react';

import type { AppError } from '../errors/types';

import { digitRequest } from './digitRequest';
import type { QueryHookResult } from './types';

export type UseDigitApiQueryOptions = {
  variables?: Record<string, unknown>;
  /** When true, do not fetch until `refetch()` is called. */
  skip?: boolean;
};

/**
 * Query the Digit GraphQL API. Returns `{ data, error, loading, refetch }`.
 */
export function useDigitApiQuery<T = unknown>(
  query: string,
  options?: UseDigitApiQueryOptions,
): QueryHookResult<T> {
  const skip = options?.skip ?? false;
  const variablesKey = JSON.stringify(options?.variables ?? null);
  const variablesRef = useRef(options?.variables);
  variablesRef.current = options?.variables;

  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(!skip);
  const requestId = useRef(0);

  const refetch = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    const result = await digitRequest<T>(query, variablesRef.current);
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
  }, [query]);

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }
    void refetch();
  }, [skip, refetch, variablesKey]);

  return { data, error, loading, refetch };
}
