/**
 * Data-fetching barrel for the public `@digit/lib-frontend` surface (React hooks).
 * Imperative `digitRequest` / `backendFetch` stay module-private for hook implementations.
 */
export { useDigitApiQuery, useSuttonApiQuery } from './useDigitApiQuery';
export { useDigitApiMutation, useSuttonApiMutation } from './useDigitApiMutation';
export { useBackendQuery } from './useBackendQuery';
export { useBackendMutation } from './useBackendMutation';
export type { DigitResult, SuttonResult } from './types';
