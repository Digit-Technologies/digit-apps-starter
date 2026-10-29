/**
 * Public API for Sutton custom app Cloudflare Workers.
 * Only import from this package root — other files are implementation details.
 *
 * Codes, validation, and result types come from `@heysutton/sdk` — this package
 * does not re-export them.
 */

// Result Responses
export { ok, err } from './respond.js';

// Worker entry wrapper (always returns structured JSON)
export { createHandler, HandlerError } from './createHandler.js';

export { backendPath } from './backendPath.js';

// Env / bindings
export { requireEnv, optionalEnv } from './env.js';

// The platform API (platform-brokered, manifest-scoped)
export type { PlatformApi, GraphqlResult } from './platformApi.js';

// Jobs & schedules (platform scheduler)
export { appJobs } from './jobs.js';
export type {
  AppJobs,
  AppJobRun,
  AppJobRunStatus,
  AppJobKind,
  AppSchedule,
  JobArgs,
  JobHandler,
  JobHandlers,
  JobInvocation,
} from './jobs.js';

// Inbound webhooks (platform-delivered, app-verified)
export { verifyWebhookSignature } from './webhooks.js';
export type {
  WebhookArgs,
  WebhookHandler,
  WebhookHandlers,
  WebhookInvocation,
  WebhookResponse,
} from './webhooks.js';

// Deprecated Digit* names, kept as aliases so existing apps keep working.
export { digitJobs } from './jobs.js';
export type { DigitJobs, DigitJobRun, DigitJobRunStatus, DigitJobKind, DigitSchedule } from './jobs.js';
