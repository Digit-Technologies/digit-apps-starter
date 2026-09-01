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
 * ShipStation V2 / ShipEngine error body: `{ request_id, errors: [{ error_code, message, field_name }] }`.
 * Confirmed from docs.shipstation.com error guide. Do not include field_value (may be PII).
 */
function formatShipStationError(json, httpStatus) {
  const errors = Array.isArray(json?.errors) ? json.errors : [];
  const parts = errors
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return '';
      const code = typeof entry.error_code === 'string' && entry.error_code ? `[${entry.error_code}] ` : '';
      const message = typeof entry.message === 'string' ? entry.message : '';
      const field =
        typeof entry.field_name === 'string' && entry.field_name ? ` (${entry.field_name})` : '';
      return `${code}${message}${field}`.trim();
    })
    .filter(Boolean);
  const requestId = typeof json?.request_id === 'string' && json.request_id ? json.request_id : null;
  const base = parts.length
    ? parts.join('; ')
    : `ShipStation request failed (HTTP ${httpStatus}).`;
  return requestId ? `${base} Request ${requestId}.` : base;
}

function shipStationErrorDetail(json, httpStatus) {
  const errors = Array.isArray(json?.errors) ? json.errors : [];
  return {
    httpStatus,
    requestId: typeof json?.request_id === 'string' ? json.request_id : null,
    errorCodes: errors
      .map((entry) => (typeof entry?.error_code === 'string' ? entry.error_code : null))
      .filter(Boolean),
  };
}

/**
 * @returns {Promise<
 *   | { ok: true, data: unknown }
 *   | { ok: false, code: string, message: string, status: number }
 * >}
 */
const ALLOWED_RESOURCE_HOSTS = new Set(['api.shipstation.com', 'api.shipengine.com']);

export function allowedShipStationUrl(urlString) {
  try {
    const url = new URL(urlString);
    return (url.protocol === 'https:' && ALLOWED_RESOURCE_HOSTS.has(url.hostname));
  } catch {
    return false;
  }
}

async function ssFetch({ apiKey, method, path, body, url: absoluteUrl }) {
  const target = absoluteUrl || `${BASE}${path}`;
  if (absoluteUrl && !allowedShipStationUrl(absoluteUrl)) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'Refusing to fetch a non-ShipStation URL.',
      status: 400,
    };
  }

  let response;
  try {
    response = await fetch(target, {
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

  const json = response.status === 204 ? null : await readJson(response);

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message: INVALID_KEY_MESSAGE,
      status: 400,
      detail: shipStationErrorDetail(json, response.status),
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: formatShipStationError(json, response.status),
      status: 502,
      detail: shipStationErrorDetail(json, response.status),
    };
  }

  if (response.status === 204) {
    return { ok: true, data: null };
  }

  return { ok: true, data: json };
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

export async function createShipments({ apiKey, shipments }) {
  return ssFetch({
    apiKey,
    method: 'POST',
    path: '/v2/shipments',
    body: { shipments },
  });
}

export async function getShipment({ apiKey, shipmentId }) {
  return ssFetch({
    apiKey,
    method: 'GET',
    path: `/v2/shipments/${encodeURIComponent(shipmentId)}`,
  });
}

export async function getShipmentByExternalId({ apiKey, externalShipmentId }) {
  return ssFetch({
    apiKey,
    method: 'GET',
    path: `/v2/shipments/external_shipment_id/${encodeURIComponent(externalShipmentId)}`,
  });
}

export async function getLabel({ apiKey, labelId }) {
  return ssFetch({
    apiKey,
    method: 'GET',
    path: `/v2/labels/${encodeURIComponent(labelId)}`,
  });
}

export async function listShipments({ apiKey, query = '' }) {
  const path = query ? `/v2/shipments?${query}` : '/v2/shipments';
  return ssFetch({ apiKey, method: 'GET', path });
}

export async function fetchResourceUrl({ apiKey, resourceUrl }) {
  return ssFetch({ apiKey, method: 'GET', path: '/', url: resourceUrl });
}

export { INVALID_KEY_MESSAGE };
