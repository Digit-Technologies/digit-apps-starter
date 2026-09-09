// Minimal shim — this repo deliberately has no @cloudflare/workers-types dependency.
declare module 'cloudflare:workers' {
  abstract class WorkerEntrypoint {
    env: unknown;
    ctx: unknown;
  }
  export { WorkerEntrypoint };
}
