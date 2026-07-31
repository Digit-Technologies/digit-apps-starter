import { AppErrorCode } from '@digit/app-shared';

import { throwHttpError } from './httpError';

/**
 * Fetch JSON from an upstream URL.
 * Network / non-OK / non-JSON → throws HttpError (UPSTREAM_ERROR).
 * Never includes request headers, secrets, or raw upstream bodies in the error message.
 */
export async function fetchJson(url: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throwHttpError(AppErrorCode.UPSTREAM_ERROR, 'Upstream request failed.', 502);
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    throwHttpError(
      AppErrorCode.UPSTREAM_ERROR,
      `Upstream returned non-JSON (HTTP ${response.status}).`,
      502,
    );
  }

  if (!response.ok) {
    throwHttpError(
      AppErrorCode.UPSTREAM_ERROR,
      `Upstream request failed (HTTP ${response.status}).`,
      502,
    );
  }

  return data;
}
