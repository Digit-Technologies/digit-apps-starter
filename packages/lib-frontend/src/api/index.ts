/**
 * Data-fetching barrel for the public `@digit/lib-frontend` surface (React hooks).
 * Imperative `digitRequest` / `backendFetch` stay module-private for hook implementations.
 */
export { useSuttonApiQuery, useDigitApiQuery } from './useDigitApiQuery';
export { useSuttonApiMutation, useDigitApiMutation } from './useDigitApiMutation';
export { useBackendQuery } from './useBackendQuery';
export { useBackendMutation } from './useBackendMutation';
export type { SuttonResult, DigitResult } from './types';
