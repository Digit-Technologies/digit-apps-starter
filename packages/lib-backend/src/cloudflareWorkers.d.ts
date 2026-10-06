// Minimal shim — this repo deliberately has no @cloudflare/workers-types dependency.
declare module 'cloudflare:workers' {
  abstract class WorkerEntrypoint {
    // Public so declaration emit can name the exported handler class.
    // Cloudflare still provides these on the instance.
    env: unknown;
    ctx: unknown;
  }
  export { WorkerEntrypoint };
}
