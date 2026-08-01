import type { AppError, BackendErrorBody, BackendSuccessBody, PlatformErrorBody } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readRequestId(body: unknown, headerId: string | null): string | null {
  if (headerId) return headerId;
  if (!isRecord(body) || !isRecord(body.error)) return null;
  const id = body.error.requestId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function isPlatformErrorBody(body: unknown): body is PlatformErrorBody {
  if (!isRecord(body) || !isRecord(body.error)) return false;
  return typeof body.error.code === 'string' && typeof body.error.message === 'string';
}

function isBackendErrorBody(body: unknown): body is BackendErrorBody {
  if (!isRecord(body) || body.ok !== false || !isRecord(body.error)) return false;
  return typeof body.error.code === 'string' && typeof body.error.message === 'string';
}

function isBackendSuccessBody(body: unknown): body is BackendSuccessBody {
  return isRecord(body) && body.ok === true && 'data' in body;
}

/**
 * Normalize the JSON body returned by `DigitProxyClient.callProxy`.
 * Platform failures arrive as `{ error: { code, message } }` (any HTTP status).
 * GraphQL field errors arrive as HTTP 200 with `{ data?, errors: [...] }`.
 */
export function parseProxyBody(body: unknown):
  | { ok: true; data: unknown }
  | { ok: false; error: AppError } {
  if (isPlatformErrorBody(body)) {
    return {
      ok: false,
      error: {
        kind: 'platform',
        code: body.error.code,
        message: body.error.message,
        requestId: typeof body.error.requestId === 'string' ? body.error.requestId : null,
        status: null,
      },
    };
  }

  if (isRecord(body) && Array.isArray(body.errors) && body.errors.length > 0) {
    const messages = body.errors
      .map((entry) => (isRecord(entry) && typeof entry.message === 'string' ? entry.message : null))
      .filter((m): m is string => Boolean(m));
    return {
      ok: false,
      error: {
        kind: 'graphql',
        code: null,
        message: messages.join('; ') || 'GraphQL request failed.',
        requestId: null,
        status: 200,
      },
    };
  }

  return { ok: true, data: body };
}

/**
 * Normalize a `DigitProxyClient.callBackend` Response into success data or AppError.
 * Expects the app Worker result `{ ok: true, data }` / `{ ok: false, error: { code, message } }`.
 * Also recognizes platform proxy error bodies when the platform rejects the call.
 */
export async function parseBackendResponse(
  response: Response,
): Promise<{ ok: true; data: unknown } | { ok: false; error: AppError }> {
  const headerId = response.headers.get('x-request-id');
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    return {
      ok: false,
      error: {
        kind: 'unknown',
        code: 'INVALID_RESPONSE',
        message: `Backend returned non-JSON (HTTP ${response.status}).`,
        requestId: headerId,
        status: response.status,
      },
    };
  }

  if (isBackendSuccessBody(body)) {
    return { ok: true, data: body.data };
  }

  if (isBackendErrorBody(body)) {
    return {
      ok: false,
      error: {
        kind: 'backend',
        code: body.error.code,
        message: body.error.message,
        requestId: readRequestId(body, headerId),
        status: response.status,
      },
    };
  }

  if (isPlatformErrorBody(body)) {
    return {
      ok: false,
      error: {
        kind: 'platform',
        code: body.error.code,
        message: body.error.message,
        requestId: readRequestId(body, headerId),
        status: response.status,
      },
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: {
        kind: 'unknown',
        code: null,
        message: `Request failed (HTTP ${response.status}).`,
        requestId: headerId,
        status: response.status,
      },
    };
  }

  // Legacy workers that return bare JSON without the result shape — treat as data.
  return { ok: true, data: body };
}

export function fromThrown(error: unknown): AppError {
  if (error instanceof Error) {
    return {
      kind: 'unknown',
      code: null,
      message: error.message,
      requestId: null,
      status: null,
    };
  }
  return {
    kind: 'unknown',
    code: null,
    message: 'Request failed.',
    requestId: null,
    status: null,
  };
}

export function unavailableClient(message?: string): AppError {
  return {
    kind: 'unavailable',
    code: 'CLIENT_UNAVAILABLE',
    message:
      message ??
      'DigitProxyClient is unavailable. This page only works inside the Digit app harness.',
    requestId: null,
    status: null,
  };
}
