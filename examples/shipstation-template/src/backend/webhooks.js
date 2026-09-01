/**
 * Inbound ShipStation V2 webhooks. Verify RSA-SHA256 over raw bytes, then enqueue.
 * Do not log `body` (addresses / tracking).
 */

import { digitJobs, requireEnv } from '@digit/lib-backend';

import { jobsUnavailable, processSsWebhook } from './jobs.js';

const JWKS_URLS = [
  'https://api.shipstation.com/jwks',
  'https://api.shipengine.com/jwks',
];

let jwksCache = { keys: [], fetchedAt: 0 };

function header(headers, name) {
  return headers[name] || headers[name.toLowerCase()] || '';
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
    for (let i = 0; i < binary.length; i += 1) signature[i] = binary.charCodeAt(i);
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signed);
  } catch {
    return false;
  }
}

function extractIds(payload) {
  const record = payload?.data || payload || {};
  return {
    event: String(payload?.event || payload?.resource_type || record.event || ''),
    resourceUrl: payload?.resource_url || payload?.resourceUrl || record.resource_url || null,
    ssShipmentId:
      record.shipment_id ||
      record.shipmentId ||
      payload?.shipment_id ||
      null,
    labelId: record.label_id || record.labelId || payload?.label_id || null,
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

export async function shipstationWebhook({ headers, body, env }) {
  const valid = await verifyRsaSha256({ headers, body });
  if (!valid) {
    return { status: 401, headers: { 'content-type': 'text/plain' }, body: 'invalid signature' };
  }

  let payload = {};
  try {
    payload = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return { status: 200, headers: { 'content-type': 'text/plain' }, body: 'ok' };
  }

  const ids = extractIds(payload);
  const organizationId = await organizationIdForWebhook({ env });
  const jobPayload = { ...ids, organizationId };

  try {
    await digitJobs({ env }).submit({
      name: 'process-ss-webhook',
      payload: jobPayload,
      idempotencyKey: `${ids.event}:${ids.ssShipmentId || ids.labelId || ids.resourceUrl || 'none'}`.slice(
        0,
        128,
      ),
    });
  } catch (error) {
    if (jobsUnavailable(error)) {
      await processSsWebhook({ payload: jobPayload, env });
    }
  }

  return { status: 200, headers: { 'content-type': 'text/plain' }, body: 'ok' };
}
