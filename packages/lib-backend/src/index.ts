/**
 * Public API for Digit app Cloudflare Workers.
 * Only import from this package root — other files are implementation details.
 *
 * Codes, validation, and result types come from `@digit/lib-common` — this package
 * does not re-export them.
 */

// Result Responses
export { ok, err } from './respond';

// Worker entry wrapper (always returns structured JSON)
export { createHandler, HandlerError } from './createHandler';

export { backendPath } from './backendPath';

// Env / bindings
export { requireEnv, optionalEnv } from './env';

// Jobs & schedules (platform scheduler)
export { digitJobs } from './jobs';
export type {
  DigitJobs,
  DigitJobRun,
  DigitJobRunStatus,
  DigitJobKind,
  DigitSchedule,
  JobArgs,
  JobHandler,
  JobHandlers,
  JobInvocation,
} from './jobs';

// Inbound webhooks (platform-delivered, app-verified)
export { verifyWebhookSignature } from './webhooks';
export type {
  WebhookArgs,
  WebhookHandler,
  WebhookHandlers,
  WebhookInvocation,
  WebhookResponse,
} from './webhooks';
