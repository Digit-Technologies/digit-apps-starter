/**
 * Worker → Digit GraphQL using a service API token (webhooks have no iframe session).
 * Never log the token. Never call this from the frontend.
 */

import { AppErrorCode } from '@digit/lib-common';
import { HandlerError } from '@digit/lib-backend';

import { loadApiTokenDigit, shipstationDb } from './runtimeConfig.js';

const DEFAULT_API_URL_DIGIT = 'https://api.digit-software.com/graphql';

const MAX_RETRIES = 2;

export function digitApiUrl() {
  return DEFAULT_API_URL_DIGIT;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(response, attempt) {
  const header = Number(response.headers.get('retry-after'));
  if (Number.isFinite(header) && header > 0) return Math.min(header * 1000, 5000);
  return 500 * 2 ** attempt;
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
        'Add the API_TOKEN_DIGIT app secret in Digit so this app can write tracking back from ShipStation.',
      status: 503,
    });
  }

  const url = digitApiUrl();

  let response;
  for (let attempt = 0; ; attempt += 1) {
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
    if (response.status !== 429 || attempt >= MAX_RETRIES) break;
    await sleep(retryAfterMs(response, attempt));
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message:
        'The Digit API token was rejected. Create a token in Digit → Settings → API Tokens with the same permissions as this app’s manifest, then set it as the API_TOKEN_DIGIT app secret.',
      status: 400,
    };
  }

  if (response.status === 429) {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: 'Digit API rate limit reached. This run stopped early and will resume on the next sync.',
      status: 429,
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
    const raw =
      typeof first?.message === 'string' && first.message
        ? first.message
        : 'Digit GraphQL request failed.';
    const extCode =
      first?.extensions && typeof first.extensions.code === 'string' ? first.extensions.code : null;
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: extCode ? `[${extCode}] ${raw}` : raw,
      status: 502,
      detail: { graphqlCode: extCode },
    };
  }

  return { ok: true, data: payload?.data ?? null };
}
