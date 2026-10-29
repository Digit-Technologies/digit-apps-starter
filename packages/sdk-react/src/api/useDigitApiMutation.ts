import { useCallback, useState } from 'react';

import type { AppError } from '../errors/types.js';

import { digitRequest } from './digitRequest.js';
import type { ApiResult, MutationHookResult } from './types.js';

export type UseDigitApiMutationArgs = {
  mutation: string;
};

export type DigitApiMutateArgs = {
  variables?: Record<string, unknown>;
};

/**
 * Mutate via the Digit GraphQL API on demand.
 * Returns `[mutate, { data, error, loading, reset }]`.
 */
export function useApiMutation<T = unknown>({
  mutation,
}: UseDigitApiMutationArgs): [
  (args?: DigitApiMutateArgs) => Promise<ApiResult<T>>,
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

  const mutate = useCallback(
    async (args: DigitApiMutateArgs = {}) => {
      setLoading(true);
      setError(null);
      const result = await digitRequest<T>({ query: mutation, variables: args.variables });
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

/** @deprecated Use `useApiMutation`. Kept so existing apps keep working. */
export const useDigitApiMutation = useApiMutation;
