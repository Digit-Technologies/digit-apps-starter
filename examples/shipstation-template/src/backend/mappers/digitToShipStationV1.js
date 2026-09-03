/**
 * Digit sales order → ShipStation V1 order body (POST /orders/createorder).
 */

import { skuForLine } from './digitToShipStation.js';

function countryCode(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'US';
  if (raw.length === 2) return raw.toUpperCase();
  const lower = raw.toLowerCase();
  if (lower === 'united states' || lower === 'usa' || lower === 'us') return 'US';
  if (lower === 'canada' || lower === 'ca') return 'CA';
  if (lower === 'mexico' || lower === 'mx') return 'MX';
  return raw.slice(0, 2).toUpperCase() || 'US';
}

function v1Address(address, { name, companyName, phone }) {
  return {
    name: name || address?.title || companyName || 'Ship to',
    company: companyName || null,
    street1: address?.addressLineOne || '—',
    street2: address?.addressLineTwo || null,
    street3: null,
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.zip || '',
    country: countryCode(address?.country),
    phone: phone || '000-000-0000',
    residential: null,
  };
}

/**
 * @param {{ order: object, shipFrom: object }} args
 */
export function digitOrderToV1Order({ order }) {
  const customerName = order?.customer?.name || '';
  const shipToName =
    order?.customerContact?.fullName || order?.shippingAddress?.title || customerName;
  const orderKey = String(order.id).slice(0, 50);
  const orderNumber = String(order.documentNumber || order.orderNumber || orderKey).slice(0, 50);
  const orderDate =
    order.orderDate || order.createdAt || order.created_at || new Date().toISOString();

  const items = (order?.items ?? [])
    .filter((line) => line?.item)
    .map((line) => ({
      lineItemKey: String(line.id),
      sku: skuForLine(line) || undefined,
      name: line.item.name || skuForLine(line) || 'Item',
      quantity: Math.max(1, Math.round(Number(line.quantity) || 1)),
      unitPrice: Number(line.unitPrice ?? line.price ?? 0) || 0,
    }));

  return {
    orderNumber,
    orderKey,
    orderDate,
    orderStatus: 'awaiting_shipment',
    customerEmail: order?.customerContact?.email || order?.customer?.email || undefined,
    billTo: v1Address(order.billingAddress || order.shippingAddress, {
      name: customerName || shipToName,
      companyName: customerName,
    }),
    shipTo: v1Address(order.shippingAddress, {
      name: shipToName,
      companyName: customerName,
    }),
    items,
    internalNotes: order.notes ? String(order.notes).slice(0, 1000) : undefined,
  };
}
