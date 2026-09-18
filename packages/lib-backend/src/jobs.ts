// Only the platform holds the dispatch binding that can call `triggerJob`, so invocations are
// platform-originated by construction — unreachable over HTTP, no auth of their own needed.

import { AppErrorCode } from '@digit/lib-common';

import { HandlerError } from './createHandler';

export type SuttonJobKind = 'job' | 'schedule';

export type SuttonJobRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

/** A run of a submitted job or a schedule tick, as reported by the platform scheduler. */
export type SuttonJobRun = {
  runId: string;
  name: string;
  kind: SuttonJobKind;
  status: SuttonJobRunStatus;
  /** Epoch ms. */
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  /** Whatever the job handler returned (JSON-serialisable). */
  result: unknown;
  /** `CODE: detail` string for failed runs — match on the prefix, not the detail. */
  error: string | null;
};

export type SuttonSchedule = {
  name: string;
  everySeconds: number;
  /** Epoch ms of the next tick. */
  nextDueAt: number;
  running: boolean;
  /** Tripped after too many consecutive failures; fix the handler and republish to resume. */
  autoPaused: boolean;
  consecutiveFailures: number;
  lastRun: { startedAt: number; endedAt: number; ok: boolean; error?: string } | null;
};

/** The platform jobs RPC surface. All calls are scoped to this app; there is no cross-app access. */
export type SuttonJobs = {
  submit(options: {
    name: string;
    payload?: unknown;
    idempotencyKey?: string;
  }): Promise<{ runId: string }>;
  get(runId: string): Promise<SuttonJobRun | null>;
  list(options?: { limit?: number }): Promise<SuttonJobRun[]>;
  cancel(runId: string): Promise<{ cancelled: boolean }>;
  schedules(): Promise<SuttonSchedule[]>;
};

/**
 * @deprecated Use {@link SuttonJobKind}. Will be removed in a later release.
 */
export type DigitJobKind = SuttonJobKind;
/**
 * @deprecated Use {@link SuttonJobRunStatus}. Will be removed in a later release.
 */
export type DigitJobRunStatus = SuttonJobRunStatus;
/**
 * @deprecated Use {@link SuttonJobRun}. Will be removed in a later release.
 */
export type DigitJobRun = SuttonJobRun;
/**
 * @deprecated Use {@link SuttonSchedule}. Will be removed in a later release.
 */
export type DigitSchedule = SuttonSchedule;
/**
 * @deprecated Use {@link SuttonJobs}. Will be removed in a later release.
 */
export type DigitJobs = SuttonJobs;

/** The platform's __JOBS binding, typed; throws MISSING_CONFIG when absent (frontend-only app, or local dev). */
export function suttonJobs({ env }: { env: unknown }): SuttonJobs {
  const binding = (env as Record<string, unknown>).__JOBS;
  if (!binding) {
    throw new HandlerError({
      code: AppErrorCode.MISSING_CONFIG,
      message:
        '__JOBS is unavailable — it is injected into published backend apps; local dev has no scheduler.',
    });
  }
  return binding as SuttonJobs;
}

/**
 * @deprecated Use {@link suttonJobs}. Same helper; will be removed in a later release.
 */
export const digitJobs = suttonJobs;

/** Argument of the platform's `triggerJob(invocation)` RPC call, plus the Worker env/ctx. */
export type JobArgs = {
  name: string;
  kind: SuttonJobKind;
  runId: string;
  /** 1-based attempt within the run (failed attempts are retried). */
  attempt: number;
  /** `submit()` payload for jobs; the manifest `payload` for schedules. */
  payload: unknown;
  /** Per-invocation budget hint in ms — finish within it or the attempt fails. */
  deadlineMs: number;
  env: unknown;
  ctx: unknown;
};

/** The return value (JSON-serialisable) is stored as the run's result; a throw fails the attempt. */
export type JobHandler = (args: JobArgs) => unknown | Promise<unknown>;

export type JobHandlers = Record<string, JobHandler>;

/** Platform invocation shape (everything in JobArgs except env/ctx). */
export type JobInvocation = Omit<JobArgs, 'env' | 'ctx'>;

/** Body of the entrypoint's `triggerJob` — a throw (including an unregistered name) fails the attempt. */
export async function runJobHandler(options: {
  invocation: JobInvocation;
  env: unknown;
  ctx: unknown;
  jobs: JobHandlers;
}): Promise<unknown> {
  const { invocation, env, ctx, jobs } = options;
  const name = typeof invocation?.name === 'string' ? invocation.name : '';
  const handler = jobs[name];
  if (!handler) {
    throw new Error(`no handler registered for job "${name}"`);
  }
  return handler({
    name,
    kind: invocation.kind === 'schedule' ? 'schedule' : 'job',
    runId: String(invocation.runId ?? ''),
    attempt: typeof invocation.attempt === 'number' ? invocation.attempt : 1,
    payload: invocation.payload,
    deadlineMs: typeof invocation.deadlineMs === 'number' ? invocation.deadlineMs : 0,
    env,
    ctx,
  });
}
