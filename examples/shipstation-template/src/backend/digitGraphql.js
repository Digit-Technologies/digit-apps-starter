/**
 * Worker → Digit GraphQL using a service API token (webhooks have no iframe session).
 * Never log the token. Never call this from the frontend.
 */

import { AppErrorCode } from '@digit/lib-common';
import { HandlerError } from '@digit/lib-backend';

import { loadApiTokenDigit, shipstationDb } from './runtimeConfig.js';

const DEFAULT_API_URL_DIGIT = 'https://api.digit-software.com/graphql';

export function digitApiUrl() {
  return DEFAULT_API_URL_DIGIT;
}

/**
 * @returns {Promise<
 *   | { ok: true, data: unknown }
 *   | { ok: false, code: string, message: string, status: number }
 * >}
 */
export async function digitGraphql({ env, query, variables }) {
  const db = shipstationDb({ env });
  const token = await loadApiTokenDigit({ env, db });
  if (!token) {
    throw new HandlerError({
      code: AppErrorCode.MISSING_CONFIG,
      message:
        'Paste a Digit API token on the setup screen (API_TOKEN_DIGIT) so this app can write tracking back from ShipStation.',
      status: 503,
    });
  }

  const url = digitApiUrl();

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: 'Could not reach the Digit API. Try again in a moment.',
      status: 502,
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message:
        'The Digit API token was rejected. Create a token in Digit → Settings → API Tokens with the same permissions as this app’s manifest, then paste it as API_TOKEN_DIGIT.',
      status: 400,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: `Digit API request failed (HTTP ${response.status}).`,
      status: 502,
    };
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: 'Digit API returned a non-JSON body.',
      status: 502,
    };
  }

  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    const message =
      typeof first?.message === 'string' && first.message
        ? first.message
        : 'Digit GraphQL request failed.';
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message,
      status: 502,
    };
  }

  return { ok: true, data: payload?.data ?? null };
}
