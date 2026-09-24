/**
 * Normalize ShipStation package-type catalogs (V2 custom, V2 carrier, V1 carrier)
 * into one shape the queue and push path share.
 */

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function normalizeDimensionUnit(unit) {
  const token = String(unit || '')
    .trim()
    .toLowerCase();
  if (!token) return 'inch';
  if (token.startsWith('cm') || token.startsWith('cent')) return 'centimeter';
  if (token.startsWith('in')) return 'inch';
  return 'inch';
}

export function normalizeWeightUnit(unit) {
  const token = String(unit || '')
    .trim()
    .toLowerCase();
  if (token.startsWith('lb') || token.startsWith('pound')) return 'pound';
  if (token.startsWith('kg') || token.startsWith('kilogram')) return 'kilogram';
  if (token.startsWith('g')) return 'gram';
  if (token.startsWith('oz') || token.startsWith('ounce')) return 'ounce';
  return token || null;
}

export function normalizePackageDimensions(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const length = positiveNumber(raw.length);
  const width = positiveNumber(raw.width);
  const height = positiveNumber(raw.height);
  if (length == null || width == null || height == null) return null;
  return {
    length,
    width,
    height,
    unit: normalizeDimensionUnit(raw.unit || raw.units),
  };
}

export function normalizePackageWeight(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const value = positiveNumber(raw.value);
  if (value == null) return null;
  const unit = normalizeWeightUnit(raw.unit || raw.units);
  if (!unit) return null;
  return { value, unit };
}

export function normalizeListedPackage(raw, { source, carrierId = null, carrierCode = null }) {
  const packageCode = String(raw?.package_code || raw?.packageCode || raw?.code || '').trim();
  if (!packageCode || packageCode.length > 50) return null;
  const packageId = String(raw?.package_id || raw?.packageId || '').trim() || null;
  return {
    source,
    packageCode,
    packageId,
    name: String(raw?.name || packageCode).trim() || packageCode,
    description: raw?.description ? String(raw.description) : null,
    carrierId: carrierId || null,
    carrierCode: String(raw?.carrierCode || carrierCode || '').trim() || null,
    dimensions: normalizePackageDimensions(raw?.dimensions),
  };
}

function listedPackages(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.packages)) return data.packages;
  return [];
}

export function normalizePackageList(data, context) {
  return listedPackages(data)
    .map((raw) => normalizeListedPackage(raw, context))
    .filter(Boolean);
}

export function packageSeenKey(pkg) {
  const source = pkg?.source === 'custom' ? 'custom' : 'carrier';
  const carrier = String(
    pkg?.carrierId || pkg?.ssCarrierId || pkg?.carrierCode || pkg?.ssCarrierCode || '',
  ).trim();
  const code = String(pkg?.packageCode || pkg?.package_code || '').trim();
  if (!code) return '';
  return `${source}\0${carrier}\0${code}`;
}

/** Packages in this pull whose code this connection has not already recorded. */
export function unseenPackages(knownKeys, packages) {
  const seen = new Set(knownKeys);
  const added = [];
  for (const pkg of packages ?? []) {
    const key = packageSeenKey(pkg);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    added.push(pkg);
  }
  return added;
}

export function catalogPullMessage({ kind, items }) {
  const count = items?.length ?? 0;
  const noun = kind === 'carriers' ? 'carrier' : 'package';
  const label = count === 1 ? noun : `${noun}s`;
  const names = (items ?? []).map((item) => {
    const name = String(item?.name || item?.packageCode || item?.carrierCode || 'Unknown').trim();
    if (kind === 'packages' && item?.carrierName) return `${name} (${item.carrierName})`;
    return name;
  });
  const shown = names.slice(0, 8);
  const rest = names.length - shown.length;
  const list = rest > 0 ? `${shown.join(', ')}, and ${rest} more` : shown.join(', ');
  return `Pulled ${count} new ${label} from ShipStation: ${list}.`;
}

export async function recordNewPackages({ db, connectionId, packages }) {
  const { results } = await db
    .prepare(
      `SELECT source, ss_carrier_id, package_code
       FROM shipstation_seen_package
       WHERE connection_id = ?`,
    )
    .bind(connectionId)
    .all();
  const known = (results ?? []).map((row) =>
    packageSeenKey({
      source: row.source,
      carrierId: row.ss_carrier_id,
      packageCode: row.package_code,
    }),
  );
  const added = unseenPackages(known, packages);
  for (const pkg of added) {
    const source = pkg.source === 'custom' ? 'custom' : 'carrier';
    const carrierId = String(pkg.carrierId || pkg.carrierCode || '').trim();
    await db
      .prepare(
        `INSERT INTO shipstation_seen_package
           (connection_id, source, ss_carrier_id, package_code, package_name, deleted)
         VALUES (?, ?, ?, ?, ?, 0)`,
      )
      .bind(
        connectionId,
        source,
        carrierId,
        String(pkg.packageCode).trim(),
        String(pkg.name || pkg.packageCode).trim(),
      )
      .run();
  }
  return added;
}

/**
 * V2 lists packages by carrier id (`GET /v2/carriers/{carrier_id}/packages`).
 * The queue often only knows the carrier code, so resolve those codes through the
 * stored carrier catalog. V1 lists by carrier code.
 */
export function packageListTargets({ apiVersion, carrierIds = [], carrierCodes = [], storedCarriers = [] }) {
  if (apiVersion === 'v1') {
    return carrierCodes.map((carrierCode) => ({ carrierId: null, carrierCode }));
  }
  const targets = new Map();
  const rows = storedCarriers ?? [];
  const idOf = (row) => String(row?.shipstationCarrierId || row?.shipstation_carrier_id || '').trim();
  const codeOf = (row) => String(row?.carrierCode || row?.carrier_code || '').trim();
  const add = (id, carrierCode) => {
    const carrierId = String(id || '').trim();
    if (!carrierId || targets.has(carrierId)) return;
    targets.set(carrierId, {
      carrierId,
      carrierCode: String(carrierCode || '').trim() || null,
    });
  };
  for (const id of carrierIds) {
    const row = rows.find((entry) => idOf(entry) === id);
    add(id, codeOf(row));
  }
  for (const code of carrierCodes) {
    const row = rows.find((entry) => codeOf(entry) === code || idOf(entry) === code);
    if (row) add(idOf(row), codeOf(row) || code);
  }
  return [...targets.values()];
}

export function createPackageCatalogCache() {
  return { custom: undefined, carriers: new Map() };
}

async function loadCustomPackages({ credentials, cache, listCustomPackageTypes }) {
  if (cache.custom) return cache.custom;
  if (credentials.apiVersion === 'v1') {
    cache.custom = { ok: true, packages: [] };
    return cache.custom;
  }
  const listed = await listCustomPackageTypes({ credentials });
  cache.custom = listed.ok
    ? { ok: true, packages: normalizePackageList(listed.data, { source: 'custom' }) }
    : { ok: false, message: listed.message || 'Could not list custom packages.', packages: [] };
  return cache.custom;
}

async function loadCarrierPackages({ credentials, carrierId, carrierCode, cache, listCarrierPackageTypes }) {
  const key =
    credentials.apiVersion === 'v1'
      ? `v1:${String(carrierCode || '').trim()}`
      : `v2:${String(carrierId || '').trim()}`;
  if (cache.carriers.has(key)) return cache.carriers.get(key);
  const listed = await listCarrierPackageTypes({ credentials, carrierId, carrierCode });
  const entry = listed.ok
    ? {
        ok: true,
        packages: normalizePackageList(listed.data, {
          source: 'carrier',
          carrierId,
          carrierCode,
        }),
      }
    : {
        ok: false,
        message: listed.message || 'Could not list carrier packages.',
        packages: [],
      };
  cache.carriers.set(key, entry);
  return entry;
}

export async function loadAccountCustomPackages({ credentials, cache }) {
  const { listCustomPackageTypes } = await import('./shipstation.js');
  const store = cache || createPackageCatalogCache();
  return loadCustomPackages({ credentials, cache: store, listCustomPackageTypes });
}

/** Custom packages plus one carrier's packages. Cache is per push batch. */
export async function loadPushCatalog({ credentials, carrierId, carrierCode, cache }) {
  const { listCarrierPackageTypes, listCustomPackageTypes } = await import('./shipstation.js');
  const store = cache || createPackageCatalogCache();
  const custom = await loadCustomPackages({ credentials, cache: store, listCustomPackageTypes });
  if (!custom.ok) {
    return { ok: false, message: custom.message, customPackages: [], carrierPackages: [] };
  }
  const carrier = await loadCarrierPackages({
    credentials,
    carrierId,
    carrierCode,
    cache: store,
    listCarrierPackageTypes,
  });
  if (!carrier.ok) {
    return { ok: false, message: carrier.message, customPackages: custom.packages, carrierPackages: [] };
  }
  return { ok: true, customPackages: custom.packages, carrierPackages: carrier.packages };
}

/**
 * V2 shipment packages, or the single V1 order package.
 * `record` is a shipment, a label-less order, or a create envelope.
 */
export function pulledPackagesFromRecord(record, apiVersion) {
  if (!record || typeof record !== 'object') return [];
  if (apiVersion === 'v1') {
    const order =
      record.packageCode || record.weight || record.dimensions ? record : record.order || record;
    if (!order?.packageCode && !order?.weight && !order?.dimensions) return [];
    return [
      {
        packageCode: String(order.packageCode || 'package').trim() || 'package',
        packageName: null,
        packageId: null,
        externalPackageId: null,
        dimensions: normalizePackageDimensions(order.dimensions),
        weight: normalizePackageWeight(order.weight),
      },
    ];
  }
  const shipment = Array.isArray(record.shipments) ? record.shipments[0] : record;
  const packages = Array.isArray(shipment?.packages) ? shipment.packages : [];
  return packages.map((pkg) => ({
    packageCode: String(pkg?.package_code || pkg?.packageCode || 'package').trim() || 'package',
    packageName: String(pkg?.package_name || pkg?.packageName || pkg?.name || '').trim() || null,
    packageId: String(pkg?.package_id || pkg?.packageId || '').trim() || null,
    externalPackageId:
      String(pkg?.external_package_id || pkg?.externalPackageId || '').trim() || null,
    dimensions: normalizePackageDimensions(pkg?.dimensions),
    weight: normalizePackageWeight(pkg?.weight),
  }));
}
