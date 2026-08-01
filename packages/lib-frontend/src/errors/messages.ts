import { AppErrorCode } from '@digit/lib-common';

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

/** Fallback when the Worker did not send a specific message. */
const BACKEND_USER_MESSAGES: Record<string, string> = {
  [AppErrorCode.MISSING_CONFIG]:
    'This app is missing required configuration. Set the env var or secret in Digit.',
  [AppErrorCode.VALIDATION_ERROR]: 'Check the form fields and try again.',
  [AppErrorCode.UPSTREAM_ERROR]: 'An upstream service failed. Try again shortly.',
  [AppErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [AppErrorCode.SERVER_ERROR]: 'Something went wrong on the server. Try again shortly.',
};

const CODE_TITLES: Record<string, string> = {
  NO_SESSION: 'Sign-in required',
  SESSION_EXPIRED: 'Session expired',
  SESSION_APP_MISMATCH: 'Wrong app session',
  RATE_LIMITED: 'Too many requests',
  APP_UNAVAILABLE: 'App unavailable',
  NO_BACKEND: 'Backend not configured',
  BACKEND_UNAVAILABLE: 'Backend unavailable',
  OPERATION_NOT_ALLOWED: 'Not allowed',
  [AppErrorCode.MISSING_CONFIG]: 'Configuration needed',
  [AppErrorCode.VALIDATION_ERROR]: 'Check your input',
  [AppErrorCode.UPSTREAM_ERROR]: 'Upstream error',
  [AppErrorCode.NOT_FOUND]: 'Not found',
  [AppErrorCode.SERVER_ERROR]: 'Server error',
  CLIENT_UNAVAILABLE: 'Unavailable',
};

/** Extra next-step copy shown under the main message for known codes. */
const CODE_GUIDANCE: Record<string, string> = {
  NO_SESSION: 'Close this view and open the app again from Digit.',
  SESSION_EXPIRED: 'Close this view and open the app again from Digit.',
  SESSION_APP_MISMATCH: 'Reload the app from Digit so the session matches this app.',
  NO_BACKEND:
    'Publish a bundle whose manifest declares backend.kind: "cloudflare-worker".',
  [AppErrorCode.MISSING_CONFIG]:
    'In Digit, open the app → Env vars / Secrets, set the missing key, then republish.',
  CLIENT_UNAVAILABLE:
    'This screen only works inside the Digit app harness (not plain local Vite alone).',
};

export type ErrorPresentation = {
  title: string;
  message: string;
  /** Optional next-step guidance for known codes — baked into AppErrorAlert. */
  guidance: string | null;
  retryable: boolean;
};

function kindTitle(error: AppError): string {
  switch (error.kind) {
    case 'platform':
      return 'Platform error';
    case 'graphql':
      return 'GraphQL error';
    case 'backend':
      return 'Backend error';
    case 'unavailable':
      return 'Unavailable';
    default:
      return 'Error';
  }
}

/**
 * Prefer a short, user-facing sentence. For backend codes, prefer the Worker’s
 * message when present (often names the field or env key).
 */
export function userMessage(error: AppError): string {
  if (error.code) {
    if (error.kind === 'platform' && PLATFORM_USER_MESSAGES[error.code]) {
      return PLATFORM_USER_MESSAGES[error.code];
    }
    if (error.kind === 'backend' && BACKEND_USER_MESSAGES[error.code]) {
      if (error.message?.trim()) return error.message;
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

export function errorTitle(error: AppError): string {
  if (error.code && CODE_TITLES[error.code]) return CODE_TITLES[error.code];
  return kindTitle(error);
}

export function errorGuidance(error: AppError): string | null {
  if (error.code && CODE_GUIDANCE[error.code]) return CODE_GUIDANCE[error.code];
  return null;
}

export function isRetryable(error: AppError): boolean {
  if (error.code === 'RATE_LIMITED' || error.code === 'BACKEND_UNAVAILABLE') return true;
  if (error.code === AppErrorCode.UPSTREAM_ERROR) return true;
  if (error.code === AppErrorCode.SERVER_ERROR) return true;
  if (error.status !== null && error.status >= 500) {
    // Config mistakes are 500 from requireEnv but are not transient.
    if (error.code === AppErrorCode.MISSING_CONFIG) return false;
    return true;
  }
  return false;
}

/** Title, message, guidance, and retryability for AppErrorAlert. */
export function presentError(error: AppError): ErrorPresentation {
  return {
    title: errorTitle(error),
    message: userMessage(error),
    guidance: errorGuidance(error),
    retryable: isRetryable(error),
  };
}
