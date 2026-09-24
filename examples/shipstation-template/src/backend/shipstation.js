/**
 * ShipStation API client facade. Dispatches V1 (ssapi + Basic) or V2 (api-key)
 * from credentials.apiVersion. Callers pass a credentials object, never secrets
 * to the browser.
 */

import { ssFetch, ssFetchBytes, allowedShipStationUrl, INVALID_KEY_MESSAGE } from './shipstationFetch.js';

export { allowedShipStationUrl, INVALID_KEY_MESSAGE };

function requireCredentials(credentials) {
  if (!credentials?.apiKey || !credentials?.apiVersion) {
    throw new Error('ShipStation credentials are required.');
  }
  if (credentials.apiVersion === 'v1' && !credentials.apiSecret) {
    throw new Error('ShipStation V1 credentials require apiSecret.');
  }
  return credentials;
}

export async function listCarriers({ credentials }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    return ssFetch({ credentials: creds, method: 'GET', path: '/carriers' });
  }
  return ssFetch({ credentials: creds, method: 'GET', path: '/v2/carriers' });
}

/** Every connected carrier. V2 follows `links.next` so a refresh does not keep only the first page. */
export async function listAllCarriers({ credentials }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') return listCarriers({ credentials: creds });

  const carriers = [];
  let path = '/v2/carriers?page_size=100';
  let absoluteUrl;
  let truncated = false;
  for (let page = 0; page < 20; page += 1) {
    const listed = await ssFetch({
      credentials: creds,
      method: 'GET',
      path: absoluteUrl ? '/v2/carriers' : path,
      url: absoluteUrl,
    });
    if (!listed.ok) return listed;
    const pageCarriers = Array.isArray(listed.data?.carriers) ? listed.data.carriers : [];
    carriers.push(...pageCarriers);
    const next = listed.data?.links?.next?.href;
    if (typeof next !== 'string' || !next) break;
    if (page === 19) {
      truncated = true;
      break;
    }
    absoluteUrl = next;
  }
  return { ok: true, data: { carriers }, truncated };
}

/** Account custom packages. V1 has no list endpoint; returns an empty list. */
export async function listCustomPackageTypes({ credentials }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    return { ok: true, data: { packages: [] } };
  }
  return ssFetch({ credentials: creds, method: 'GET', path: '/v2/packages' });
}

/** V2: GET /v2/carriers/{carrier_id}/packages. V1: GET /carriers/listpackages?carrierCode=. */
export async function listCarrierPackageTypes({ credentials, carrierId, carrierCode }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    const code = String(carrierCode || '').trim();
    if (!code) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'carrierCode is required to list V1 carrier packages.',
        status: 400,
      };
    }
    return ssFetch({
      credentials: creds,
      method: 'GET',
      path: `/carriers/listpackages?carrierCode=${encodeURIComponent(code)}`,
    });
  }
  const id = String(carrierId || '').trim();
  if (!id) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'carrierId is required to list V2 carrier packages.',
      status: 400,
    };
  }
  return ssFetch({
    credentials: creds,
    method: 'GET',
    path: `/v2/carriers/${encodeURIComponent(id)}/packages`,
  });
}

export async function listCarrierServices({ credentials, carrierId, carrierCode }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    const code = encodeURIComponent(carrierCode || carrierId || '');
    return ssFetch({
      credentials: creds,
      method: 'GET',
      path: `/carriers/listservices?carrierCode=${code}`,
    });
  }
  return ssFetch({
    credentials: creds,
    method: 'GET',
    path: `/v2/carriers/${encodeURIComponent(carrierId)}/services`,
  });
}

/**
 * V2: POST /v2/shipments. V1: POST /orders/createorder (one order).
 * Returns a V2-shaped envelope `{ shipments: [{ shipment_id, ... }] }` so callers
 * can share firstCreatedShipment.
 */
export async function createShipments({ credentials, shipments, order }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    const body = order || (Array.isArray(shipments) ? null : shipments);
    if (!body) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'V1 push requires an order body.',
        status: 400,
      };
    }
    const created = await ssFetch({
      credentials: creds,
      method: 'POST',
      path: '/orders/createorder',
      body,
    });
    if (!created.ok) return created;
    const orderId = created.data?.orderId ?? created.data?.order_id;
    return {
      ok: true,
      data: {
        shipments: [
          {
            shipment_id: orderId != null ? String(orderId) : null,
            external_shipment_id: created.data?.orderKey || body.orderKey || null,
            order: created.data,
          },
        ],
      },
    };
  }
  return ssFetch({
    credentials: creds,
    method: 'POST',
    path: '/v2/shipments',
    body: { shipments },
  });
}

export async function getShipment({ credentials, shipmentId }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    return ssFetch({
      credentials: creds,
      method: 'GET',
      path: `/orders/${encodeURIComponent(shipmentId)}`,
    });
  }
  return ssFetch({
    credentials: creds,
    method: 'GET',
    path: `/v2/shipments/${encodeURIComponent(shipmentId)}`,
  });
}

export async function getShipmentByExternalId({ credentials, externalShipmentId }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    const listed = await ssFetch({
      credentials: creds,
      method: 'GET',
      path: `/orders?orderNumber=${encodeURIComponent(externalShipmentId)}&pageSize=50&page=1`,
    });
    if (!listed.ok) return listed;
    const orders = Array.isArray(listed.data?.orders) ? listed.data.orders : [];
    const match =
      orders.find(
        (entry) =>
          String(entry.orderKey || '') === String(externalShipmentId) ||
          String(entry.orderNumber || '') === String(externalShipmentId),
      ) || orders[0] || null;
    return { ok: true, data: match };
  }
  return ssFetch({
    credentials: creds,
    method: 'GET',
    path: `/v2/shipments/external_shipment_id/${encodeURIComponent(externalShipmentId)}`,
  });
}

export async function getLabel({ credentials, labelId, downloadType = 'url', format = 'pdf' }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    // V1 has no standalone label GET; callers should use resource_url or getShipment.
    return getShipment({ credentials: creds, shipmentId: labelId });
  }
  const params = new URLSearchParams({
    label_download_type: downloadType,
    label_format: format,
  });
  return ssFetch({
    credentials: creds,
    method: 'GET',
    path: `/v2/labels/${encodeURIComponent(labelId)}?${params.toString()}`,
  });
}

/**
 * V2: GET /v2/labels. V1 has no standalone label list — use getShipment.
 */
export async function listLabels({ credentials, query = '' }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'V1 has no label list. Use getShipment for the V1 order.',
      status: 400,
    };
  }
  const path = query ? `/v2/labels?${query}` : '/v2/labels';
  return ssFetch({ credentials: creds, method: 'GET', path });
}

export async function fetchLabelPdfBytes({ credentials, url }) {
  return ssFetchBytes({
    credentials: requireCredentials(credentials),
    method: 'GET',
    path: '/',
    url,
  });
}

