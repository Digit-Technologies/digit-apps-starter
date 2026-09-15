/**
 * Map a ShipStation carrier_code / friendly name onto a Digit shippingCarriers option.
 * Never creates Digit options. Manual D1 maps always win over aliases and fuzzy.
 */

import { digitGraphql } from './digitGraphql.js';
import { appendActivity } from './activity.js';
import { SHIPPING_CARRIERS_QUERY } from './digitQueries.js';

const FUZZY_MIN = 0.85;
const FUZZY_GAP = 0.15;

/** Normalized key → canonical brand used to match Digit option values. */
const ALIASES = {
  stampscom: 'usps',
  stampsendicia: 'usps',
  endicia: 'usps',
  usps: 'usps',
  pitneybowes: 'usps',
  stamps: 'usps',
  ups: 'ups',
  upswalleted: 'ups',
  fedex: 'fedex',
  fedexwalleted: 'fedex',
  dhl: 'dhl',
  dhlexpress: 'dhl',
  dhlexpressworldwide: 'dhl',
  amazon: 'amazon',
  amazonshipping: 'amazon',
};

export function normalizeCarrierKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function canonicalCarrierKey(value) {
  const key = normalizeCarrierKey(value);
  return ALIASES[key] || key;
}

function tokens(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((part) => ALIASES[part] || part)
    .filter((part) => part.length >= 2);
}

function bigrams(value) {
  const s = String(value || '');
  if (s.length < 2) return s ? [s] : [];
  const grams = [];
  for (let i = 0; i < s.length - 1; i += 1) grams.push(s.slice(i, i + 2));
  return grams;
}

function diceCoefficient(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const left = bigrams(a);
  const right = bigrams(b);
  if (left.length === 0 || right.length === 0) return 0;
  const counts = new Map();
  for (const gram of left) counts.set(gram, (counts.get(gram) || 0) + 1);
  let overlap = 0;
  for (const gram of right) {
    const n = counts.get(gram) || 0;
    if (n > 0) {
      overlap += 1;
      counts.set(gram, n - 1);
    }
  }
  return (2 * overlap) / (left.length + right.length);
}

function tokenOverlap(ssTokens, digitTokens) {
  if (digitTokens.length === 0 || ssTokens.length === 0) return 0;
  const ss = new Set(ssTokens);
  const hits = digitTokens.filter((token) => ss.has(token)).length;
  return hits / Math.max(digitTokens.length, 1);
}

function liveOptions(options) {
  return (options ?? []).filter((option) => option && option.id && option.value && !option.deleted);
}

/**
 * @returns {{ option: { id: string, value: string }, method: 'exact' | 'alias' | 'fuzzy' } | null}
 */
export function matchDigitCarrierOptions({
  carrierCode,
  carrierName,
  serviceCode,
  options,
}) {
  const list = liveOptions(options);
  if (list.length === 0) return null;

  const candidates = [carrierName, carrierCode].filter(Boolean);
  const ssKeys = candidates.map(normalizeCarrierKey).filter(Boolean);
  const ssCanonical = candidates.map(canonicalCarrierKey).filter(Boolean);
  const ssTokens = [
    ...tokens(carrierName),
    ...tokens(carrierCode),
    ...tokens(serviceCode),
  ];

  for (const option of list) {
    const key = normalizeCarrierKey(option.value);
    if (ssKeys.includes(key)) {
      return { option, method: 'exact' };
    }
  }

  for (const option of list) {
    const canon = canonicalCarrierKey(option.value);
    if (ssCanonical.includes(canon) && canon) {
      return { option, method: 'alias' };
    }
  }

  const scored = list.map((option) => {
    const optKey = normalizeCarrierKey(option.value);
    const optCanon = canonicalCarrierKey(option.value);
    const nameDice = Math.max(
      ...ssKeys.map((key) => diceCoefficient(key, optKey)),
      0,
    );
    const canonDice = Math.max(
      ...ssCanonical.map((key) => diceCoefficient(key, optCanon)),
      0,
    );
    const overlap = tokenOverlap(ssTokens, tokens(option.value));
    const score = Math.max(nameDice, canonDice, overlap);
    return { option, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const second = scored[1];
  if (!best || best.score < FUZZY_MIN) return null;
  if (second && best.score - second.score < FUZZY_GAP) return null;
  return { option: best.option, method: 'fuzzy' };
}

export async function fetchDigitShippingCarriers({ env }) {
  let result;
  try {
    result = await digitGraphql({
      env,
      query: SHIPPING_CARRIERS_QUERY,
    });
  } catch (error) {
    return {
      ok: false,
      code: error?.code || 'MISSING_CONFIG',
      message: error?.message || 'Could not load Digit shipping carriers.',
      status: error?.status || 503,
    };
  }
  if (!result.ok) return result;
  const options = result.data?.organizationDynamicFields?.shippingCarriers?.options ?? [];
  return { ok: true, data: liveOptions(options) };
}

export async function lookupSsCarrierRow({ db, connectionId, carrierCode }) {
  if (!connectionId || !carrierCode) return null;
  const code = String(carrierCode).trim();
  return db
    .prepare(
      `SELECT shipstation_carrier_id, carrier_code, name
       FROM shipstation_carrier
       WHERE connection_id = ? AND deleted = 0
         AND (
           shipstation_carrier_id = ?
           OR carrier_code = ?
           OR lower(name) = lower(?)
         )
       LIMIT 1`,
    )
    .bind(connectionId, code, code, code)
    .first();
}

async function loadMapRow({ db, connectionId, ssCarrierCode }) {
  return db
    .prepare(
      `SELECT ss_carrier_code, digit_option_id, source
       FROM carrier_digit_map
       WHERE connection_id = ? AND ss_carrier_code = ?
       LIMIT 1`,
    )
    .bind(connectionId, ssCarrierCode)
    .first();
}

async function upsertMapRow({ db, connectionId, ssCarrierCode, digitOptionId, source }) {
  await db
    .prepare(
      `INSERT INTO carrier_digit_map (connection_id, ss_carrier_code, digit_option_id, source, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(connection_id, ss_carrier_code) DO UPDATE SET
         digit_option_id = excluded.digit_option_id,
         source = excluded.source,
         updated_at = excluded.updated_at`,
    )
    .bind(connectionId, ssCarrierCode, digitOptionId, source)
    .run();
}

export async function saveManualCarrierMaps({ db, connectionId, mappings }) {
  for (const mapping of mappings) {
    const ssCarrierCode = String(mapping.ssCarrierCode || '').trim();
    if (!ssCarrierCode) continue;
    if (mapping.digitOptionId == null || mapping.digitOptionId === '') {
      await db
        .prepare(
          `DELETE FROM carrier_digit_map
           WHERE connection_id = ? AND ss_carrier_code = ?`,
        )
        .bind(connectionId, ssCarrierCode)
        .run();
      continue;
    }
    await upsertMapRow({
      db,
      connectionId,
      ssCarrierCode,
      digitOptionId: String(mapping.digitOptionId),
      source: 'manual',
    });
  }
}

/**
 * Resolve a Digit shipping-carrier option id for a ShipStation carrier.
 * @returns {Promise<{
 *   ok: true,
 *   data: {
 *     digitOptionId: string | null,
 *     method: string | null,
 *     carrierCode: string | null,
 *     carrierName: string | null,
 *     digitValue: string | null,
 *   }
 * } | { ok: false, code: string, message: string, status: number }>}
 */
export async function resolveDigitCarrier({
  env,
  db,
  organizationId,
  connectionId,
  carrierCode,
  carrierName,
  serviceCode,
  actor = 'system',
  digitOrderId = null,
  ssShipmentId = null,
  recordActivity = true,
}) {
  const code = carrierCode ? String(carrierCode).trim() : '';
  const catalog = await lookupSsCarrierRow({ db, connectionId, carrierCode: code });
  const friendly = (carrierName && String(carrierName).trim()) || catalog?.name || null;
  const resolvedCode = catalog?.carrier_code || code || catalog?.shipstation_carrier_id || null;

  if (!resolvedCode && !friendly) {
    return {
      ok: true,
      data: {
        digitOptionId: null,
        method: null,
        carrierCode: null,
        carrierName: null,
        digitValue: null,
      },
    };
  }

  const fetched = await fetchDigitShippingCarriers({ env });
  if (!fetched.ok) return fetched;
  const options = fetched.data;
  const optionById = new Map(options.map((option) => [option.id, option]));

  if (connectionId && resolvedCode) {
    const mapped = await loadMapRow({ db, connectionId, ssCarrierCode: resolvedCode });
    if (mapped?.digit_option_id && optionById.has(mapped.digit_option_id)) {
      if (mapped.source === 'manual' || mapped.source === 'fuzzy') {
        const option = optionById.get(mapped.digit_option_id);
        return {
          ok: true,
          data: {
            digitOptionId: mapped.digit_option_id,
            method: mapped.source,
            carrierCode: resolvedCode,
            carrierName: friendly,
            digitValue: option?.value ?? null,
          },
        };
      }
    }
  }

  const matched = matchDigitCarrierOptions({
    carrierCode: resolvedCode,
    carrierName: friendly,
    serviceCode,
    options,
  });

  if (matched && connectionId && resolvedCode && matched.method === 'fuzzy') {
    const existing = await loadMapRow({ db, connectionId, ssCarrierCode: resolvedCode });
    if (!existing || existing.source !== 'manual') {
      await upsertMapRow({
        db,
        connectionId,
        ssCarrierCode: resolvedCode,
        digitOptionId: matched.option.id,
        source: 'fuzzy',
      });
    }
  }

  if (matched) {
    return {
      ok: true,
      data: {
        digitOptionId: matched.option.id,
        method: matched.method,
        carrierCode: resolvedCode,
        carrierName: friendly,
        digitValue: matched.option.value,
      },
    };
  }

  if (recordActivity && organizationId) {
    await appendActivity({
      db,
      organizationId,
      actor,
      action: 'carrier_unmapped',
      status: 'warning',
      digitOrderId,
      ssShipmentId,
      message: `ShipStation carrier ${resolvedCode || friendly} did not match a Digit shipping carrier. Map it in Settings.`,
      detail: { carrierCode: resolvedCode, carrierName: friendly },
    });
  }

  return {
    ok: true,
    data: {
      digitOptionId: null,
      method: null,
      carrierCode: resolvedCode,
      carrierName: friendly,
      digitValue: null,
    },
  };
}

export async function loadCarrierMapPayload({ env, db, organizationId, connectionId }) {
  const fetched = await fetchDigitShippingCarriers({ env });
  const digitCarriers = fetched.ok
    ? fetched.data.map((option) => ({ id: option.id, value: option.value }))
    : [];

  let ssCarriers = [];
  let mappings = [];
  if (connectionId) {
    const { results: carrierRows } = await db
      .prepare(
        `SELECT carrier_code, name
         FROM shipstation_carrier
         WHERE connection_id = ? AND deleted = 0
         ORDER BY name COLLATE NOCASE, id`,
      )
      .bind(connectionId)
      .all();
    ssCarriers = (carrierRows ?? [])
      .filter((row) => row.carrier_code)
      .map((row) => ({
        carrierCode: row.carrier_code,
        name: row.name,
      }));

    const { results: mapRows } = await db
      .prepare(
        `SELECT ss_carrier_code, digit_option_id, source
         FROM carrier_digit_map
         WHERE connection_id = ?`,
      )
      .bind(connectionId)
      .all();
    mappings = (mapRows ?? []).map((row) => ({
      ssCarrierCode: row.ss_carrier_code,
      digitOptionId: row.digit_option_id,
      source: row.source,
    }));
  }

  const mappedCodes = new Set(
    mappings.filter((row) => row.digitOptionId).map((row) => row.ssCarrierCode),
  );
  const ssCodes = new Set(ssCarriers.map((row) => row.carrierCode));

  const { results: activityRows } = await db
    .prepare(
      `SELECT detail, message, created_at
       FROM activity_log
       WHERE organization_id = ? AND action = 'carrier_unmapped'
       ORDER BY id DESC
       LIMIT 25`,
    )
    .bind(organizationId)
    .all();

  const unmapped = [];
  const seen = new Set();
  for (const row of activityRows ?? []) {
    let detail = null;
    try {
      detail = row.detail ? JSON.parse(row.detail) : null;
    } catch {
      detail = null;
    }
    const code = detail?.carrierCode || null;
    const name = detail?.carrierName || null;
    const key = code || name;
    if (!key || seen.has(key)) continue;
    if (code && mappedCodes.has(code)) continue;
    seen.add(key);
    unmapped.push({
      carrierCode: code,
      carrierName: name,
      inCatalog: Boolean(code && ssCodes.has(code)),
    });
  }

  return {
    digitCarriers,
    ssCarriers,
    carrierMappings: mappings,
    unmappedCarriers: unmapped,
    digitCarriersError: fetched.ok
      ? null
      : fetched.message || 'Could not load Digit shipping carriers.',
  };
}
