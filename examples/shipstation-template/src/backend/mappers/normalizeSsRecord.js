/**
 * Normalize V1 order / V2 shipment / label payloads into one fulfillment shape
 * used by sync writeback and inbound import.
 */

/**
 * @returns {{
 *   ssShipmentId: string | null,
 *   externalId: string | null,
 *   labelId: string | null,
 *   trackingNumber: string | null,
 *   carrierCode: string | null,
 *   shipDate: string | null,
 *   costAmount: number | null,
 *   costCurrency: string | null,
 *   shipmentNumber: string | null,
 *   items: Array<{ sku: string, name?: string, quantity: number }>,
 *   shipTo: object | null,
 *   billTo: object | null,
 *   raw: object,
 * }}
 */
export function normalizeSsRecord(record) {
  if (!record || typeof record !== 'object') {
    return emptyNormalized(record);
  }

  // V1 order (orderId / orderKey)
  if (record.orderId != null || record.orderKey != null || record.orderNumber != null) {
    const tracking =
      record.trackingNumber ||
      (Array.isArray(record.shipments) && record.shipments[0]?.trackingNumber) ||
      null;
    const shipDate =
      record.shipDate ||
      (Array.isArray(record.shipments) && record.shipments[0]?.shipDate) ||
      record.orderDate ||
      null;
    return {
      ssShipmentId: record.orderId != null ? String(record.orderId) : null,
      externalId: record.orderKey ? String(record.orderKey) : null,
      labelId: null,
      trackingNumber: tracking ? String(tracking) : null,
      carrierCode: record.carrierCode || record.serviceCode || null,
      shipDate: shipDate ? String(shipDate) : null,
      costAmount:
        typeof record.shippingAmount === 'number'
          ? record.shippingAmount
          : record.shippingAmount != null
            ? Number(record.shippingAmount)
            : null,
      costCurrency: null,
      shipmentNumber: record.orderNumber ? String(record.orderNumber) : null,
      items: (record.items ?? [])
        .map((item) => ({
          sku: String(item.sku || item.fulfillmentSku || '').trim(),
          name: item.name,
          quantity: Number(item.quantity) || 1,
        }))
        .filter((item) => item.sku),
      shipTo: normalizeV1Address(record.shipTo),
      billTo: normalizeV1Address(record.billTo || record.shipTo),
      raw: record,
    };
  }

  // V2 shipment / label
  const cost = record.shipment_cost || record.shipmentCost;
  const tracking =
    record.tracking_number ||
    record.trackingNumber ||
    record.packages?.[0]?.tracking_number ||
    null;

  return {
    ssShipmentId:
      record.shipment_id != null
        ? String(record.shipment_id)
        : record.shipmentId != null
          ? String(record.shipmentId)
          : null,
    externalId:
      record.external_shipment_id ||
      record.externalShipmentId ||
      null,
    labelId:
      record.label_id != null
        ? String(record.label_id)
        : record.labelId != null
          ? String(record.labelId)
          : null,
    trackingNumber: tracking ? String(tracking) : null,
    carrierCode: record.carrier_code || record.carrierCode || record.service_code || null,
    shipDate: record.ship_date || record.shipDate || record.created_at || null,
    costAmount: cost?.amount ?? null,
    costCurrency: cost?.currency ?? null,
    shipmentNumber: record.shipment_number || record.shipmentNumber || null,
    items: (record.items ?? [])
      .map((item) => ({
        sku: String(item.sku || item.fullfilment_sku || '').trim(),
        name: item.name,
        quantity: Number(item.quantity) || 1,
      }))
      .filter((item) => item.sku),
    shipTo: normalizeV2Address(record.ship_to || record.shipTo),
    billTo: normalizeV2Address(record.bill_to || record.billTo || record.ship_to),
    raw: record,
  };
}

function emptyNormalized(raw) {
  return {
    ssShipmentId: null,
    externalId: null,
    labelId: null,
    trackingNumber: null,
    carrierCode: null,
    shipDate: null,
    costAmount: null,
    costCurrency: null,
    shipmentNumber: null,
    items: [],
    shipTo: null,
    billTo: null,
    raw: raw || null,
  };
}

function normalizeV1Address(address) {
  if (!address) return null;
  return {
    name: address.name,
    company_name: address.company,
    address_line1: address.street1,
    address_line2: address.street2,
    city_locality: address.city,
    state_province: address.state,
    postal_code: address.postalCode,
    country_code: address.country,
  };
}

function normalizeV2Address(address) {
  if (!address) return null;
  return {
    name: address.name,
    company_name: address.company_name || address.companyName,
    address_line1: address.address_line1 || address.addressLine1,
    address_line2: address.address_line2 || address.addressLine2,
    city_locality: address.city_locality || address.cityLocality,
    state_province: address.state_province || address.stateProvince,
    postal_code: address.postal_code || address.postalCode,
    country_code: address.country_code || address.countryCode,
  };
}

/**
 * Shape expected by shipStationToDigit mappers (V2 field names).
 */
export function normalizedToImportShipment(normalized) {
  return {
    shipment_id: normalized.ssShipmentId,
    external_shipment_id: normalized.externalId,
    shipment_number: normalized.shipmentNumber,
    ship_to: normalized.shipTo,
    bill_to: normalized.billTo,
    items: normalized.items.map((item) => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
    })),
    advanced_options: {},
  };
}
