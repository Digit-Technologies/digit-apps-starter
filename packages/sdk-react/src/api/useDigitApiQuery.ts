import { useCallback, useEffect, useRef, useState } from 'react';

import type { AppError } from '../errors/types.js';

import { digitRequest } from './digitRequest.js';
import type { QueryHookResult } from './types.js';

export type UseApiQueryArgs = {
  query: string;
  variables?: Record<string, unknown>;
  /** When true, do not fetch until `refetch()` is called. */
  skip?: boolean;
};

/**
 * Query the Digit GraphQL API. Returns `{ data, error, loading, refetch }`.
 */
export function useApiQuery<T = unknown>({
  query,
  variables,
  skip = false,
}: UseApiQueryArgs): QueryHookResult<T> {
  const variablesKey = JSON.stringify(variables ?? null);
  const variablesRef = useRef(variables);
  variablesRef.current = variables;

  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(!skip);
  const requestId = useRef(0);

  const refetch = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    const result = await digitRequest<T>({ query, variables: variablesRef.current });
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

/** @deprecated Use `useApiQuery`. Kept so existing apps keep working. */
export const useDigitApiQuery = useApiQuery;
