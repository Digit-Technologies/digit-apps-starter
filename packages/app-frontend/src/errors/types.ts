import type { FailureResult, SuccessResult } from '@digit/app-shared';

/** Kind of failure after normalizing a Digit proxy / backend / GraphQL result. */
export type AppErrorKind = 'platform' | 'graphql' | 'backend' | 'unavailable' | 'unknown';

export type AppError = {
  kind: AppErrorKind;
  /** Stable machine code when available (platform or app-backend). */
  code: string | null;
  /** Safe-to-show explanation (may still be technical). Prefer userMessage(). */
  message: string;
  /** Correlation id from platform body or x-request-id header. */
  requestId: string | null;
  /** HTTP status when known. */
  status: number | null;
};

export type PlatformErrorBody = {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
};

export type BackendErrorBody = FailureResult;
export type BackendSuccessBody<T = unknown> = SuccessResult<T>;
