/**
 * Compatibility shim, never published. Apps packed before the rename import `@digit/lib-common`
 * through their vendored `@digit/lib-frontend` without vendoring it, so this resolves it from the
 * starter. `sutton studio pack` vendors it (and `@heysutton/sdk`) so a re-pack is self-contained.
 * New code imports `@heysutton/sdk`.
 */
export * from '@heysutton/sdk';
