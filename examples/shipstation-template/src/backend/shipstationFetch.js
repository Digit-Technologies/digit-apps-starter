/**
 * Shared ShipStation HTTP helpers (V1 + V2). Never put the API key/secret or raw
 * upstream bodies into error messages or success payloads.
 */

import { AppErrorCode } from '@digit/lib-common';

export const V2_BASE = 'https://api.shipstation.com';
export const V1_BASE = 'https://ssapi.shipstation.com';

export const INVALID_KEY_MESSAGE_V2 =
  'This API key was rejected by ShipStation. Create a V2 key in ShipStation → Settings → API, then try again.';

export const INVALID_KEY_MESSAGE_V1 =
  'These API credentials were rejected by ShipStation. Check SHIPSTATION_API_KEY and SHIPSTATION_API_SECRET (V1 Basic auth), then try again.';

export const ALLOWED_RESOURCE_HOSTS = new Set([
  'api.shipstation.com',
  'api.shipengine.com',
  'ssapi.shipstation.com',
]);

export function allowedShipStationUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'https:' && ALLOWED_RESOURCE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export async function readJson(response) {
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
 */
export function formatShipStationErrorV2(json, httpStatus) {
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

export function shipStationErrorDetailV2(json, httpStatus) {
  const errors = Array.isArray(json?.errors) ? json.errors : [];
  return {
    httpStatus,
    requestId: typeof json?.request_id === 'string' ? json.request_id : null,
    errorCodes: errors
      .map((entry) => (typeof entry?.error_code === 'string' ? entry.error_code : null))
      .filter(Boolean),
  };
}

/** V1 bodies are often `{ Message }` or `{ message }`. */
export function formatShipStationErrorV1(json, httpStatus) {
  const message =
    (typeof json?.Message === 'string' && json.Message) ||
    (typeof json?.message === 'string' && json.message) ||
    (typeof json?.ExceptionMessage === 'string' && json.ExceptionMessage) ||
    null;
  return message || `ShipStation request failed (HTTP ${httpStatus}).`;
}

export function shipStationErrorDetailV1(json, httpStatus) {
  return {
    httpStatus,
    requestId: null,
    errorCodes: [],
    message:
      (typeof json?.Message === 'string' && json.Message) ||
      (typeof json?.message === 'string' && json.message) ||
      null,
  };
}

function v2Headers({ apiKey }) {
  return {
    'api-key': apiKey,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

function v1Headers({ apiKey, apiSecret }) {
  const token = btoa(`${apiKey}:${apiSecret}`);
  return {
    Authorization: `Basic ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

/**
 * @param {{
 *   credentials: { apiVersion: 'v1' | 'v2', apiKey: string, apiSecret?: string },
 *   method: string,
 *   path: string,
 *   body?: unknown,
 *   url?: string,
 * }} args
 */
export async function ssFetch({ credentials, method, path, body, url: absoluteUrl }) {
  const isV1 = credentials.apiVersion === 'v1';
  const base = isV1 ? V1_BASE : V2_BASE;
  const target = absoluteUrl || `${base}${path}`;

  if (absoluteUrl && !allowedShipStationUrl(absoluteUrl)) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'Refusing to fetch a non-ShipStation URL.',
      status: 400,
    };
  }

  const headers = isV1
    ? v1Headers({ apiKey: credentials.apiKey, apiSecret: credentials.apiSecret || '' })
    : v2Headers({ apiKey: credentials.apiKey });

  let response;
  try {
    response = await fetch(target, {
      method,
      headers,
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
      message: isV1 ? INVALID_KEY_MESSAGE_V1 : INVALID_KEY_MESSAGE_V2,
      status: 400,
      detail: isV1
        ? shipStationErrorDetailV1(json, response.status)
        : shipStationErrorDetailV2(json, response.status),
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: isV1
        ? formatShipStationErrorV1(json, response.status)
        : formatShipStationErrorV2(json, response.status),
      status: 502,
      detail: isV1
        ? shipStationErrorDetailV1(json, response.status)
        : shipStationErrorDetailV2(json, response.status),
    };
  }

  if (response.status === 204) {
    return { ok: true, data: null };
  }

  return { ok: true, data: json };
}

/** @deprecated Use INVALID_KEY_MESSAGE_V2 */
export const INVALID_KEY_MESSAGE = INVALID_KEY_MESSAGE_V2;
