// Minimal shim — this repo deliberately has no @cloudflare/workers-types dependency.
declare module 'cloudflare:workers' {
  abstract class WorkerEntrypoint {
    protected env: unknown;
    protected ctx: unknown;
  }
  export { WorkerEntrypoint };
}
