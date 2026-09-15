/**
 * Rate-shop and purchase labels after a Digit shipment is created in ShipStation.
 * V2 re-fetches PDF by label id. V1 stores labelData on the order map.
 */

import { AppErrorCode } from '@digit/lib-common';

import { packageFromOrgSettings, v1WeightFromOrgSettings } from './mappers/digitToShipStation.js';
import {
  calculateRates,
  createLabelForOrder,
  createLabelFromRate,
  fetchLabelPdfBytes,
  getLabel,
  getRates,
} from './shipstation.js';

const MAX_V2_CARRIERS = 25;
const MAX_V1_CARRIERS = 8;

export async function loadLiveCarriers({ db, connectionId }) {
  const { results } = await db
    .prepare(
      `SELECT shipstation_carrier_id, carrier_code
       FROM shipstation_carrier
       WHERE connection_id = ? AND deleted = 0
       ORDER BY id`,
    )
    .bind(connectionId)
    .all();
  return results ?? [];
}

function rateAmount(rate) {
  const shipping = rate?.shipping_amount ?? rate?.shippingAmount;
  if (shipping && typeof shipping === 'object' && shipping.amount != null) {
    return Number(shipping.amount) || 0;
  }
  const cost = rate?.shipmentCost ?? rate?.shipment_cost;
  const other = rate?.otherCost ?? rate?.other_cost ?? 0;
  if (cost != null) return (Number(cost) || 0) + (Number(other) || 0);
  return Number.POSITIVE_INFINITY;
}

function deliveryDays(rate) {
  const days = rate?.delivery_days ?? rate?.deliveryDays ?? rate?.estimated_delivery_days;
  if (days == null || days === '') return Number.POSITIVE_INFINITY;
  const n = Number(days);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

export function pickRate(rates, strategy) {
  const list = Array.isArray(rates) ? rates.filter(Boolean) : [];
  if (list.length === 0) return null;
  const scored = [...list];
  if (strategy === 'fastest') {
    scored.sort((a, b) => {
      const dayDiff = deliveryDays(a) - deliveryDays(b);
      if (dayDiff !== 0) return dayDiff;
      return rateAmount(a) - rateAmount(b);
    });
  } else {
    scored.sort((a, b) => rateAmount(a) - rateAmount(b));
  }
  return scored[0] ?? null;
}

function v2RatesFromPayload(data) {
  return (
    data?.rate_response?.rates ??
    data?.rates ??
    data?.rateResponse?.rates ??
    []
  );
}

function pdfBase64FromInline(data) {
  const download = data?.label_download || data?.labelDownload || {};
  const href = download.href || download.pdf;
  if (typeof href === 'string' && href.startsWith('data:')) {
    const comma = href.indexOf(',');
    return comma >= 0 ? href.slice(comma + 1) : null;
  }
  return null;
}

function labelPdfUrl(data) {
  const download = data?.label_download || data?.labelDownload || {};
  const href = download.pdf || download.href;
  if (typeof href === 'string' && href.startsWith('https://')) return href;
  return null;
}

function stripPdfWhitespace(value) {
  return String(value || '').replace(/\s+/g, '');
}

async function purchaseV2Label({ credentials, ssShipmentId, carriers, strategy }) {
  const carrierIds = carriers
    .map((row) => row.shipstation_carrier_id)
    .filter(Boolean)
    .slice(0, MAX_V2_CARRIERS);
  if (carrierIds.length === 0) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'No ShipStation carriers are synced. Disconnect and reconnect, then try again.',
      status: 400,
    };
  }
  const rated = await calculateRates({
    credentials,
    shipmentId: ssShipmentId,
    carrierIds,
  });
  if (!rated.ok) return rated;
  const chosen = pickRate(v2RatesFromPayload(rated.data), strategy);
  const rateId = chosen?.rate_id || chosen?.rateId;
  if (!rateId) {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: 'ShipStation returned no usable rates for this shipment.',
      status: 502,
    };
  }
  const created = await createLabelFromRate({ credentials, rateId });
  if (!created.ok) return created;
  const label = created.data || {};
  const labelId = label.label_id != null ? String(label.label_id) : null;
  const tracking =
    label.tracking_number || label.trackingNumber || label.packages?.[0]?.tracking_number || null;
  const cost = label.shipment_cost || label.shipmentCost;
  return {
    ok: true,
    data: {
      ssLabelId: labelId,
      trackingNumber: tracking ? String(tracking) : null,
      carrierName: label.carrier_code || label.carrierCode || chosen?.carrier_code || null,
      serviceCode: label.service_code || label.serviceCode || chosen?.service_code || chosen?.serviceCode || null,
      shipDate: label.ship_date || label.shipDate || null,
      shipmentCostAmount: cost?.amount ?? null,
      shipmentCostCurrency: cost?.currency ?? null,
      labelPdfBase64: pdfBase64FromInline(label),
    },
  };
}

function v1ShipDate() {
  return new Date().toISOString().slice(0, 10);
}

async function purchaseV1Label({
  credentials,
  ssShipmentId,
  shipment,
  organization,
  orgSettings,
  carriers,
  strategy,
}) {
  const orderId = Number(ssShipmentId);
  if (!Number.isFinite(orderId)) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'ShipStation V1 order id is missing, so a label cannot be purchased.',
      status: 400,
    };
  }
  const codes = [
    ...new Set(
      carriers
        .map((row) => String(row.carrier_code || '').trim())
        .filter(Boolean)
        .slice(0, MAX_V1_CARRIERS),
    ),
  ];
  if (codes.length === 0) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'No ShipStation carrier codes are synced. Disconnect and reconnect, then try again.',
      status: 400,
    };
  }

  const shipTo = shipment?.shippingAddress || shipment?.order?.shippingAddress;
  const shipFrom =
    organization?.addresses?.find((address) => address.isShipFromDefault) ||
    organization?.addresses?.find((address) => address.isManufacturingDefault) ||
    organization?.addresses?.[0];
  const weight = v1WeightFromOrgSettings(orgSettings);
  const dims = packageFromOrgSettings(orgSettings).dimensions;
  const v1Dimensions = dims
    ? {
        length: dims.length,
        width: dims.width,
        height: dims.height,
        units: 'inches',
      }
    : null;

  const collected = [];
  let lastError = null;
  for (const carrierCode of codes) {
    const listed = await getRates({
      credentials,
      rateRequest: {
        carrierCode,
        packageCode: 'package',
        fromPostalCode: shipFrom?.zip || '',
        fromCity: shipFrom?.city || undefined,
        fromState: shipFrom?.state || undefined,
        toCountry: (shipTo?.country || 'US').slice(0, 2).toUpperCase() || 'US',
        toPostalCode: shipTo?.zip || '',
        toState: shipTo?.state || undefined,
        toCity: shipTo?.city || undefined,
        weight,
        ...(v1Dimensions ? { dimensions: v1Dimensions } : {}),
        residential: false,
      },
    });
    if (!listed.ok) {
      lastError = listed;
      continue;
    }
    const rates = Array.isArray(listed.data) ? listed.data : listed.data?.rates ?? [];
    for (const rate of rates) {
      collected.push({ ...rate, carrierCode: rate.carrierCode || carrierCode });
    }
  }
  const chosen = pickRate(collected, strategy);
  if (!chosen?.serviceCode && !chosen?.service_code) {
    return (
      lastError || {
        ok: false,
        code: AppErrorCode.UPSTREAM_ERROR,
        message: 'ShipStation returned no usable V1 rates for this shipment.',
        status: 502,
      }
    );
  }
  const serviceCode = chosen.serviceCode || chosen.service_code;
  const carrierCode = chosen.carrierCode || chosen.carrier_code;
  const created = await createLabelForOrder({
    credentials,
    labelRequest: {
      orderId,
      carrierCode,
      serviceCode,
      packageCode: 'package',
      confirmation: 'none',
      shipDate: v1ShipDate(),
      weight,
      ...(v1Dimensions ? { dimensions: v1Dimensions } : {}),
      testLabel: false,
    },
  });
  if (!created.ok) return created;
  const label = created.data || {};
  const labelData = stripPdfWhitespace(label.labelData || label.label_data);
  if (!labelData) {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: 'ShipStation did not return label PDF data.',
      status: 502,
    };
  }
  return {
    ok: true,
    data: {
      ssLabelId: label.shipmentId != null ? String(label.shipmentId) : String(orderId),
      trackingNumber: label.trackingNumber ? String(label.trackingNumber) : null,
      carrierName: carrierCode,
      serviceCode,
      shipDate: v1ShipDate(),
      shipmentCostAmount: label.shipmentCost ?? null,
      shipmentCostCurrency: null,
      labelPdfBase64: labelData,
    },
  };
}

/**
 * After a ShipStation shipment/order exists, buy a label. Failures are returned
 * so the caller can keep the push as created-without-label.
 */
export async function purchaseLabelAfterCreate({
  credentials,
  db,
  connectionId,
  ssShipmentId,
  shipment,
  organization,
  orgSettings,
}) {
  const carriers = await loadLiveCarriers({ db, connectionId });
  const strategy = orgSettings?.rateStrategy === 'fastest' ? 'fastest' : 'cheapest';
  if (credentials.apiVersion === 'v1') {
    return purchaseV1Label({
      credentials,
      ssShipmentId,
      shipment,
      organization,
      orgSettings,
      carriers,
      strategy,
    });
  }
  return purchaseV2Label({
    credentials,
    ssShipmentId,
    carriers,
    strategy,
  });
}

export async function pdfBase64FromV2Label({ credentials, labelId }) {
  const fetched = await getLabel({
    credentials,
    labelId,
    downloadType: 'inline',
    format: 'pdf',
  });
  if (!fetched.ok) return fetched;
  const inline = pdfBase64FromInline(fetched.data);
  if (inline) {
    return { ok: true, data: { pdfBase64: stripPdfWhitespace(inline) } };
  }
  const url = labelPdfUrl(fetched.data);
  if (!url) {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: 'ShipStation did not return a downloadable PDF for this label.',
      status: 502,
    };
  }
  const bytes = await fetchLabelPdfBytes({ credentials, url });
  if (!bytes.ok) return bytes;
  return { ok: true, data: { pdfBase64: bytes.data.pdfBase64 } };
}
