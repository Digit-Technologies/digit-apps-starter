/**
 * Data-fetching barrel. All of these are part of the public `@digit/app-frontend`
 * surface (hooks preferred; `digitRequest` / `backendFetch` for non-React sites).
 */
export { digitRequest } from './digitRequest';
export type { DigitRequestArgs } from './digitRequest';
export { backendFetch } from './backendFetch';
export type { BackendFetchArgs } from './backendFetch';
export { useDigitApiQuery } from './useDigitApiQuery';
export type { UseDigitApiQueryArgs } from './useDigitApiQuery';
export { useDigitApiMutation } from './useDigitApiMutation';
export type { UseDigitApiMutationArgs, DigitApiMutateArgs } from './useDigitApiMutation';
export { useBackendQuery } from './useBackendQuery';
export type { UseBackendQueryArgs } from './useBackendQuery';
export { useBackendMutation } from './useBackendMutation';
export type {
  DigitResult,
  BackendFetchOptions,
  QueryHookResult,
  MutationHookResult,
} from './types';
