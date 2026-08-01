import { AppErrorCode } from '@digit/app-shared';

import type { AppError } from './types';

const PLATFORM_USER_MESSAGES: Record<string, string> = {
  NO_SESSION: 'No active session. Re-open the app from Digit.',
  SESSION_EXPIRED: 'Your session expired. Re-open the app from Digit.',
  SESSION_APP_MISMATCH: 'Session does not match this app. Reload the app from Digit.',
  INVALID_ORIGIN:
    'Request was rejected by Digit. Use DigitProxyClient (do not call /proxy/* with a bare fetch).',
  RATE_LIMITED: 'Too many requests. Wait a moment and try again.',
  APP_UNAVAILABLE: 'This app is not currently available.',
  NO_BACKEND: 'This app has no backend configured.',
  BACKEND_UNAVAILABLE: 'The app backend is temporarily unavailable. Try again shortly.',
  OPERATION_NOT_ALLOWED: 'This operation is not allowed for this app or user.',
  QUERY_TOO_DEEP: 'The GraphQL query is too deeply nested.',
  QUERY_TOO_EXPENSIVE: 'The GraphQL query exceeds the allowed cost.',
  REDEEM_FAILED: 'Could not start a session. Re-open the app from Digit.',
};

const BACKEND_USER_MESSAGES: Record<string, string> = {
  [AppErrorCode.MISSING_CONFIG]:
    'This app is missing required configuration. Set the env var or secret in Digit.',
  [AppErrorCode.VALIDATION_ERROR]: 'Check the form fields and try again.',
  [AppErrorCode.UPSTREAM_ERROR]: 'An upstream service failed. Try again shortly.',
  [AppErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [AppErrorCode.SERVER_ERROR]: 'Something went wrong on the server. Try again shortly.',
};

/**
 * Prefer a short, user-facing sentence. Falls back to the error's own message.
 */
export function userMessage(error: AppError): string {
  if (error.code) {
    if (error.kind === 'platform' && PLATFORM_USER_MESSAGES[error.code]) {
      return PLATFORM_USER_MESSAGES[error.code];
    }
    if (error.kind === 'backend' && BACKEND_USER_MESSAGES[error.code]) {
      return BACKEND_USER_MESSAGES[error.code];
    }
  }
  if (error.kind === 'unavailable') {
    return error.message;
  }
  if (error.kind === 'graphql') {
    return error.message || 'The request could not be completed.';
  }
  return error.message || 'Something went wrong.';
}

export function isRetryable(error: AppError): boolean {
  if (error.code === 'RATE_LIMITED' || error.code === 'BACKEND_UNAVAILABLE') return true;
  if (error.code === AppErrorCode.UPSTREAM_ERROR) return true;
  if (error.code === AppErrorCode.SERVER_ERROR) return true;
  if (error.status !== null && error.status >= 500) return true;
  return false;
}
