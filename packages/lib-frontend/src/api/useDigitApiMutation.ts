import { useCallback, useState } from 'react';

import type { AppError } from '../errors/types';

import { digitRequest } from './digitRequest';
import type { SuttonResult, MutationHookResult } from './types';

export type UseSuttonApiMutationArgs = {
  mutation: string;
};

export type SuttonApiMutateArgs = {
  variables?: Record<string, unknown>;
};

/**
 * @deprecated Use {@link UseSuttonApiMutationArgs}. Will be removed in a later release.
 */
export type UseDigitApiMutationArgs = UseSuttonApiMutationArgs;

/**
 * @deprecated Use {@link SuttonApiMutateArgs}. Will be removed in a later release.
 */
export type DigitApiMutateArgs = SuttonApiMutateArgs;

/**
 * Mutate via the Sutton GraphQL API on demand.
 * Returns `[mutate, { data, error, loading, reset }]`.
 */
export function useSuttonApiMutation<T = unknown>({
  mutation,
}: UseSuttonApiMutationArgs): [
  (args?: SuttonApiMutateArgs) => Promise<SuttonResult<T>>,
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
    async (args: SuttonApiMutateArgs = {}) => {
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

/**
 * @deprecated Use {@link useSuttonApiMutation}. Same hook; will be removed in a later release.
 */
export const useDigitApiMutation = useSuttonApiMutation;
