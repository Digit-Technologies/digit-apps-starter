/**
 * App-owned error codes (Worker / shared validation).
 * Keep these distinct from platform codes (NO_SESSION, RATE_LIMITED, …).
 */
export const AppErrorCode = {
  MISSING_CONFIG: 'MISSING_CONFIG',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode] | (string & {});

export type AppErrorDetail = {
  code: AppErrorCode;
  message: string;
};
