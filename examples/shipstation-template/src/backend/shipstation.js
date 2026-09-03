/**
 * ShipStation API client facade. Dispatches V1 (ssapi + Basic) or V2 (api-key)
 * from credentials.apiVersion. Callers pass a credentials object, never secrets
 * to the browser.
 */

import { ssFetch, allowedShipStationUrl, INVALID_KEY_MESSAGE } from './shipstationFetch.js';

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

export async function createWebhook({ credentials, name, event, url }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    return ssFetch({
      credentials: creds,
      method: 'POST',
      path: '/webhooks/subscribe',
      body: {
        target_url: url,
        event,
        friendly_name: name,
        store_id: null,
      },
    });
  }
  return ssFetch({
    credentials: creds,
    method: 'POST',
    path: '/v2/environment/webhooks',
    body: { name, event, url },
  });
}

export async function deleteWebhook({ credentials, webhookId }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    return ssFetch({
      credentials: creds,
      method: 'DELETE',
      path: `/webhooks/${encodeURIComponent(webhookId)}`,
    });
  }
  return ssFetch({
    credentials: creds,
    method: 'DELETE',
    path: `/v2/environment/webhooks/${encodeURIComponent(webhookId)}`,
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

export async function getLabel({ credentials, labelId }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    // V1 has no standalone label GET; callers should use resource_url or getShipment.
    return getShipment({ credentials: creds, shipmentId: labelId });
  }
  return ssFetch({
    credentials: creds,
    method: 'GET',
    path: `/v2/labels/${encodeURIComponent(labelId)}`,
  });
}

export async function listShipments({ credentials, query = '' }) {
  const creds = requireCredentials(credentials);
  if (creds.apiVersion === 'v1') {
    const path = query ? `/orders?${query}` : '/orders?pageSize=25&page=1';
    const listed = await ssFetch({ credentials: creds, method: 'GET', path });
    if (!listed.ok) return listed;
    const orders = Array.isArray(listed.data?.orders) ? listed.data.orders : [];
    return { ok: true, data: { shipments: orders, orders } };
  }
  const path = query ? `/v2/shipments?${query}` : '/v2/shipments';
  return ssFetch({ credentials: creds, method: 'GET', path });
}

export async function fetchResourceUrl({ credentials, resourceUrl }) {
  return ssFetch({
    credentials: requireCredentials(credentials),
    method: 'GET',
    path: '/',
    url: resourceUrl,
  });
}
