/**
 * ShipStation API v2 client. Never put the API key or raw upstream bodies
 * into error messages or success payloads.
 */

import { AppErrorCode } from '@digit/lib-common';

const BASE = 'https://api.shipstation.com';

const INVALID_KEY_MESSAGE =
  'This API key was rejected by ShipStation. Create a V2 key in ShipStation → Settings → API, then try again.';

function headers({ apiKey }) {
  return {
    'api-key': apiKey,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<
 *   | { ok: true, data: unknown }
 *   | { ok: false, code: string, message: string, status: number }
 * >}
 */
async function ssFetch({ apiKey, method, path, body }) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: headers({ apiKey }),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: 'Could not reach ShipStation. Try again in a moment.',
      status: 502,
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message: INVALID_KEY_MESSAGE,
      status: 400,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: `ShipStation request failed (HTTP ${response.status}).`,
      status: 502,
    };
  }

  if (response.status === 204) {
    return { ok: true, data: null };
  }

  return { ok: true, data: await readJson(response) };
}

export async function listCarriers({ apiKey }) {
  return ssFetch({ apiKey, method: 'GET', path: '/v2/carriers' });
}

export async function listCarrierServices({ apiKey, carrierId }) {
  return ssFetch({
    apiKey,
    method: 'GET',
    path: `/v2/carriers/${encodeURIComponent(carrierId)}/services`,
  });
}

export async function createWebhook({ apiKey, name, event, url }) {
  return ssFetch({
    apiKey,
    method: 'POST',
    path: '/v2/environment/webhooks',
    body: { name, event, url },
  });
}

export async function deleteWebhook({ apiKey, webhookId }) {
  return ssFetch({
    apiKey,
    method: 'DELETE',
    path: `/v2/environment/webhooks/${encodeURIComponent(webhookId)}`,
  });
}

export { INVALID_KEY_MESSAGE };
