import { useCallback, useState } from 'react';

import type { AppError } from '../errors/types';

import { digitRequest } from './digitRequest';
import type { DigitResult, MutationHookResult } from './types';

/**
 * Mutate via the Digit GraphQL API on demand.
 * Returns `[mutate, { data, error, loading, reset }]`.
 */
export function useDigitApiMutation<T = unknown>(
  mutation: string,
): [(variables?: Record<string, unknown>) => Promise<DigitResult<T>>, MutationHookResult<T>] {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setLoading(false);
  }, []);

  const mutate = useCallback(
    async (variables?: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      const result = await digitRequest<T>(mutation, variables);
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return result;
      }
      setData(result.data);
      setLoading(false);
      return result;
    },
    [mutation],
  );

  return [mutate, { data, error, loading, reset }];
}
