/**
 * Digit sales order → ShipStation V2 shipment body.
 * Override skuForLine in a customer clone for branded SKUs (CS-04).
 */

export function skuForLine(line) {
  return String(line?.customerSku || line?.item?.sku || '').trim();
}

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

function addressFromDigit(address, { name, companyName, phone, email }) {
  return {
    name: name || address?.title || companyName || 'Ship to',
    phone: phone || '000-000-0000',
    email: email || undefined,
    company_name: companyName || undefined,
    address_line1: address?.addressLineOne || '—',
    address_line2: address?.addressLineTwo || undefined,
    city_locality: address?.city || '',
    state_province: address?.state || '',
    postal_code: address?.zip || '',
    country_code: countryCode(address?.country),
    address_residential_indicator: 'unknown',
  };
}

function billToNote({ billingAddress, customerName }) {
  if (!billingAddress) return customerName ? `Bill-to: ${customerName}` : '';
  const parts = [
    customerName,
    billingAddress.title,
    billingAddress.addressLineOne,
    billingAddress.addressLineTwo,
    [billingAddress.city, billingAddress.state, billingAddress.zip].filter(Boolean).join(', '),
    billingAddress.country,
  ].filter(Boolean);
  return parts.length ? `Bill-to: ${parts.join(' · ')}` : '';
}

/**
 * @param {{ order: object, shipFrom: object }} args
 */
export function digitOrderToShipment({ order, shipFrom }) {
  const customerName = order?.customer?.name || '';
  const shipToName =
    order?.customerContact?.fullName || order?.shippingAddress?.title || customerName;
  const billingDiffers =
    order?.billingAddress?.id &&
    order?.shippingAddress?.id &&
    order.billingAddress.id !== order.shippingAddress.id;

  const items = (order?.items ?? [])
    .filter((line) => line?.item)
    .map((line) => ({
      name: line.item.name || skuForLine(line) || 'Item',
      sku: skuForLine(line) || undefined,
      quantity: Math.max(1, Math.round(Number(line.quantity) || 1)),
      external_order_id: order.id,
      external_order_item_id: line.id,
    }));

  const externalId = String(order.id).slice(0, 50);
  const note = billToNote({
    billingAddress: order?.billingAddress,
    customerName,
  });

  return {
    external_shipment_id: externalId,
    shipment_number: order.documentNumber || order.orderNumber || externalId,
    create_sales_order: true,
    ship_to: addressFromDigit(order.shippingAddress, {
      name: shipToName,
      companyName: billingDiffers ? customerName : customerName,
    }),
    ship_from: shipFrom,
    items,
    internal_notes: [order.notes, note].filter(Boolean).join('\n').slice(0, 1000) || undefined,
  };
}

export function orgShipFrom({ organization }) {
  const addresses = organization?.addresses ?? [];
  const shipFrom =
    addresses.find((address) => address.isShipFromDefault) ||
    addresses.find((address) => address.isManufacturingDefault) ||
    addresses[0];
  return addressFromDigit(shipFrom, {
    name: organization?.name || 'Warehouse',
    companyName: organization?.name,
    email: organization?.replyToEmail,
  });
}
