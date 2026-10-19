/**
 * Compatibility shim, never published. Apps packed before the rename import `@digit/lib-common`
 * through their vendored `@digit/lib-frontend` without vendoring it, so this resolves it from the
 * starter. New code imports `@heysutton/sdk`.
 */
export * from '@heysutton/sdk';
