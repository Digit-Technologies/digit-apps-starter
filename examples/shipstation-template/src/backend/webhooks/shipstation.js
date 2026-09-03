/**
 * Inbound ShipStation webhooks (V2 RSA-SHA256 or V1 token query).
 * Do not log `body` (addresses / tracking).
 */

import { optionalEnv, requireEnv } from '@digit/lib-backend';

import { processSsWebhook } from '../jobs.js';
import { loadShipStationWebhookToken, shipstationDb } from '../runtimeConfig.js';
import { createWebhookHandler, parseJsonBody } from './pipeline.js';

const JWKS_URLS = [
  'https://api.shipstation.com/jwks',
  'https://api.shipengine.com/jwks',
];

let jwksCache = { keys: [], fetchedAt: 0 };

function header(headers, name) {
  return headers[name] || headers[name.toLowerCase()] || '';
}

function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function tokenFromQuery(query) {
  if (!query) return '';
  try {
    const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
    return params.get('token') || '';
  } catch {
    return '';
  }
}

async function loadJwks() {
  if (jwksCache.keys.length && Date.now() - jwksCache.fetchedAt < 6 * 60 * 60 * 1000) {
    return jwksCache.keys;
  }
  const keys = [];
  for (const url of JWKS_URLS) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const body = await response.json();
      if (Array.isArray(body?.keys)) keys.push(...body.keys);
    } catch {
      /* try next */
    }
  }
  if (keys.length) jwksCache = { keys, fetchedAt: Date.now() };
  return jwksCache.keys;
}

function jwkToImport(jwk) {
  return {
    kty: jwk.kty,
    n: jwk.n,
    e: jwk.e,
    alg: jwk.alg || 'RS256',
    ext: true,
  };
}

async function verifyWithJwk({ jwk, signatureB64, timestamp, body }) {
  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      jwkToImport(jwk),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const rawBody = typeof body === 'string' ? body : new TextDecoder().decode(body);
    const signed = new TextEncoder().encode(`${timestamp}.${rawBody}`);
    const binary = atob(signatureB64);
    const signature = new Uint8Array(binary.length);
    for (let i = 0; i < signature.length; i += 1) signature[i] = binary.charCodeAt(i);
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signed);
  } catch {
    return false;
  }
}

async function verifyRsaSha256({ headers, body }) {
  const keyId = header(headers, 'x-shipengine-rsa-sha256-key-id');
  const signatureB64 = header(headers, 'x-shipengine-rsa-sha256-signature');
  const timestamp = header(headers, 'x-shipengine-timestamp');
  if (!keyId || !signatureB64 || !timestamp) return false;

  const ageMs = Math.abs(Date.now() - Date.parse(timestamp));
  if (Number.isNaN(ageMs) || ageMs > 5 * 60 * 1000) return false;

  const keys = await loadJwks();
  const jwk = keys.find((key) => key.kid === keyId);
  if (!jwk) {
    jwksCache = { keys: [], fetchedAt: 0 };
    const retry = await loadJwks();
    const again = retry.find((key) => key.kid === keyId);
    if (!again) return false;
    return verifyWithJwk({ jwk: again, signatureB64, timestamp, body });
  }
  return verifyWithJwk({ jwk, signatureB64, timestamp, body });
}

async function verifyV1Token({ env, query }) {
  const db = shipstationDb({ env }) || optionalEnv({ env, key: 'SHIPSTATION_DB' }) || null;
  const expected = await loadShipStationWebhookToken({ env, db });
  if (!expected) return false;
  const provided = tokenFromQuery(query || '');
  return timingSafeEqualString(provided, expected);
}

async function verifyShipStationWebhook({ headers, body, env, query }) {
  const hasRsa =
    Boolean(header(headers, 'x-shipengine-rsa-sha256-key-id')) &&
    Boolean(header(headers, 'x-shipengine-rsa-sha256-signature')) &&
    Boolean(header(headers, 'x-shipengine-timestamp'));
  if (hasRsa) {
    return verifyRsaSha256({ headers, body });
  }
  return verifyV1Token({ env, query });
}

function extractIds(payload) {
  const record = payload?.data || payload || {};
  const orders = Array.isArray(payload?.orders)
    ? payload.orders
    : Array.isArray(record?.orders)
      ? record.orders
      : null;
  const firstOrder = orders?.[0];
  const rawShipmentId =
    record.shipment_id ||
    record.shipmentId ||
    payload?.shipment_id ||
    firstOrder?.orderId ||
    record.orderId ||
    null;
  const rawLabelId = record.label_id || record.labelId || payload?.label_id || null;
  return {
    event: String(payload?.event || payload?.resource_type || record.event || record.resource_type || ''),
    resourceUrl: payload?.resource_url || payload?.resourceUrl || record.resource_url || null,
    ssShipmentId: rawShipmentId != null ? String(rawShipmentId) : null,
    labelId: rawLabelId != null ? String(rawLabelId) : null,
  };
}

async function organizationIdForWebhook({ env }) {
  const db = requireEnv({ env, key: 'SHIPSTATION_DB' });
  const row = await db
    .prepare(
      `SELECT organization_id FROM shipstation_connection WHERE deleted = 0 LIMIT 1`,
    )
    .first();
  return row?.organization_id || null;
}

export const shipstationWebhook = createWebhookHandler({
  verify: verifyShipStationWebhook,
  parsePayload: parseJsonBody,
  extractIds,
  jobName: 'process-ss-webhook',
  idempotencyKey: (_headers, ids) =>
    `${ids.event}:${ids.ssShipmentId || ids.labelId || ids.resourceUrl || 'none'}`,
  resolveOrganizationId: organizationIdForWebhook,
  runInline: async (payload, env) => {
    await processSsWebhook({ payload, env });
  },
});
