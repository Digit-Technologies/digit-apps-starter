import { useCallback, useEffect, useRef, useState } from 'react';

import type { AppError } from '../errors/types';

import { digitRequest } from './digitRequest';
import type { QueryHookResult } from './types';

export type UseSuttonApiQueryArgs = {
  query: string;
  variables?: Record<string, unknown>;
  /** When true, do not fetch until `refetch()` is called. */
  skip?: boolean;
};

/**
 * @deprecated Use {@link UseSuttonApiQueryArgs}. Will be removed in a later release.
 */
export type UseDigitApiQueryArgs = UseSuttonApiQueryArgs;

/**
 * Query the Sutton GraphQL API. Returns `{ data, error, loading, refetch }`.
 */
export function useSuttonApiQuery<T = unknown>({
  query,
  variables,
  skip = false,
}: UseSuttonApiQueryArgs): QueryHookResult<T> {
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

/**
 * @deprecated Use {@link useSuttonApiQuery}. Same hook; will be removed in a later release.
 */
export const useDigitApiQuery = useSuttonApiQuery;
