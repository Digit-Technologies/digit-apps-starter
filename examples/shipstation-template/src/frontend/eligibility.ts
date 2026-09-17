/**
 * Keep in sync with src/backend/eligibility.js — the Worker cannot import this file.
 */

export type OrgSettingsForEligibility = {
  defaultFulfillmentMethod?: string | null;
};

export type MapRowForEligibility = {
  source?: string | null;
  pushStatus?: string | null;
  ssShipmentId?: string | null;
};

export type PackedLineForEligibility = {
  packedItems?: { pickedItem?: { orderItem?: { item?: unknown } | null } | null }[] | null;
};

export const V1_MULTI_CONTAINER_REASON =
  'ShipStation V1 supports only one package per order, but this Digit shipment has multiple pack containers.';

export type ShipmentForEligibility = {
  shippingStatus?: string | null;
  order?: { id?: string | null } | null;
  packContainers?: PackedLineForEligibility[] | null;
};

export function packedLineCount(shipment?: ShipmentForEligibility | null) {
  let count = 0;
  for (const container of shipment?.packContainers ?? []) {
    for (const packed of container.packedItems ?? []) {
      if (packed?.pickedItem?.orderItem?.item) count += 1;
    }
  }
  return count;
}

export function ineligibilityReason({
  shipment,
  orgSettings,
  mapRow,
  apiVersion = null,
}: {
  shipment: ShipmentForEligibility;
  orgSettings?: OrgSettingsForEligibility | null;
  mapRow?: MapRowForEligibility | null;
  apiVersion?: string | null;
}): string | null {
  void orgSettings;
  if (mapRow?.source === 'shipstation') {
    return 'This shipment was imported from ShipStation and will not be re-pushed.';
  }
  if (shipment?.shippingStatus === 'shipped') {
    return 'Already shipped in Digit.';
  }
  // A ShipStation resource id is the durable guard: re-pushing would duplicate the SS shipment.
  if (
    mapRow &&
    (mapRow.ssShipmentId ||
      ['pushed', 'label_ready', 'shipped'].includes(mapRow.pushStatus ?? ''))
  ) {
    return mapRow.pushStatus === 'shipped'
      ? 'Already shipped in ShipStation.'
      : 'Already pushed to ShipStation.';
  }
  if (!shipment?.order?.id) {
    return 'This shipment is not linked to a sales order.';
  }
  if (packedLineCount(shipment) === 0) {
    return 'Shipment has no packed items.';
  }
  if (apiVersion === 'v1' && (shipment?.packContainers?.length ?? 0) > 1) {
    return V1_MULTI_CONTAINER_REASON;
  }
  return null;
}

export function skipNextStep(reason: string | null | undefined) {
  if (!reason) return 'Fix the issue, then try again.';
  if (reason.includes('imported from ShipStation')) {
    return 'Fulfill it in ShipStation; this app will not create a second shipment.';
  }
  if (reason.includes('Already shipped')) {
    return 'Download the label from this queue if you need it again. Tracking should already be on the Digit shipment.';
  }
  if (reason.includes('Already pushed')) {
    return 'Buy the label in ShipStation, then Refresh or wait for the five-minute poll. This Digit shipment stays until it is marked shipped.';
  }
  if (reason.includes('not linked to a sales order')) {
    return 'Multi-order or unlinked shipments are not pushed from this queue.';
  }
  if (reason.includes('no packed items')) {
    return 'Pack items onto this Digit shipment, then try again.';
  }
  if (reason.includes('V1 supports only one package')) {
    return 'Create one Digit shipment per pack container, or disconnect ShipStation and reconnect with V2 credentials.';
  }
  return 'Fix the issue above, then try again.';
}

export function digitShippingStatusLabel(value: string | null | undefined) {
  switch (String(value || '').toLowerCase()) {
    case 'awaiting_carrier':
      return 'Awaiting carrier';
    case 'awaiting_pickup':
      return 'Awaiting pickup';
    case 'awaiting_drop_off':
      return 'Awaiting drop-off';
    case 'shipped':
      return 'Shipped';
    case 'cancelled':
      return 'Cancelled';
    default:
      return value ? String(value).replace(/_/g, ' ') : '—';
  }
}

export function trackingStatusLabel(value: string | null | undefined) {
  switch (String(value || '').toLowerCase()) {
    case 'unknown':
      return 'Unknown';
    case 'in_transit':
      return 'In transit';
    case 'delivered':
      return 'Delivered';
    case 'delivered_to_service_point':
      return 'Delivered to service point';
    case 'error':
    case 'exception':
      return 'Error';
    case 'voided':
      return 'Voided';
    default:
      return value ? String(value).replace(/_/g, ' ') : null;
  }
}

export function shipStationLabelStatusLabel(mapRow?: {
  trackingStatus?: string | null;
  ssLabelId?: string | null;
  hasLabel?: boolean | null;
  ssShipmentId?: string | null;
} | null) {
  const tracking = trackingStatusLabel(mapRow?.trackingStatus);
  if (tracking) return tracking;
  if (mapRow?.hasLabel || mapRow?.ssLabelId) return 'Purchased';
  if (mapRow?.ssShipmentId) return 'Awaiting label';
  return '—';
}

export function pushStatusLabel(value: string | null | undefined) {
  switch (value) {
    case 'pushed':
      return 'In ShipStation — awaiting label';
    case 'label_ready':
      return 'Label found — not yet written to Digit';
    case 'skipped':
      return 'Not pushed';
    case 'error':
      return 'Push failed';
    case 'shipped':
      return 'Shipped — tracking written back';
    case 'imported':
      return 'Imported from ShipStation';
    case 'pending':
      return 'Pending';
    default:
      return value ? value.replace(/_/g, ' ') : 'Not pushed yet';
  }
}

export type QueuePushDisplay = {
  primary: string;
  chipColor: 'success' | 'warning' | 'error' | 'default';
  tooltip: string;
  showPrimaryAsChip: boolean;
  lastError?: string | null;
};

/** Single queue column: eligibility (ready/blocked) or ShipStation sync state — not both. */
export function queuePushDisplay({
  blocked,
  mapRow,
  shippingStatus,
}: {
  blocked: string | null;
  mapRow?: {
    pushStatus?: string | null;
    lastError?: string | null;
    ssShipmentId?: string | null;
    trackingStatus?: string | null;
  } | null;
  shippingStatus?: string | null;
}): QueuePushDisplay {
  const pushStatus = mapRow?.pushStatus;
  const lastError = mapRow?.lastError ?? null;

  /** A ShipStation id means the push landed, whatever a later skip wrote to push_status. */
  const syncState =
    shippingStatus === 'shipped' || pushStatus === 'shipped'
      ? 'shipped'
      : pushStatus === 'imported'
        ? 'imported'
        : pushStatus === 'label_ready'
          ? 'label_ready'
          : pushStatus === 'pushed' || mapRow?.ssShipmentId
            ? 'pushed'
            : null;

  if (syncState) {
    const trackingLabel = trackingStatusLabel(mapRow?.trackingStatus);
    const primary = trackingLabel || pushStatusLabel(syncState);
    return {
      primary,
      chipColor:
        mapRow?.trackingStatus === 'error' || mapRow?.trackingStatus === 'exception'
          ? 'error'
          : mapRow?.trackingStatus === 'delivered' ||
              mapRow?.trackingStatus === 'delivered_to_service_point' ||
              syncState === 'shipped'
            ? 'success'
            : 'default',
      tooltip:
        trackingLabel
          ? `ShipStation tracking status: ${trackingLabel}.`
          : syncState === 'pushed'
            ? `${pushStatusLabel(syncState)} Buy the label in ShipStation, then Refresh or wait up to five minutes.`
            : syncState === 'label_ready'
              ? `${pushStatusLabel(syncState)} Press Refresh to write the carrier and tracking onto this shipment.`
              : pushStatusLabel(syncState),
      showPrimaryAsChip: Boolean(trackingLabel && (mapRow?.trackingStatus === 'error' || mapRow?.trackingStatus === 'exception')),
    };
  }

  if (lastError || pushStatus === 'error') {
    return {
      primary: lastError ?? pushStatusLabel('error'),
      chipColor: 'error',
      tooltip: lastError ? `Push failed. ${lastError}` : 'Push failed.',
      showPrimaryAsChip: true,
      lastError: null,
    };
  }

  if (blocked) {
    return {
      primary: 'Blocked',
      chipColor: 'warning',
      tooltip: `${blocked} ${skipNextStep(blocked)}`,
      showPrimaryAsChip: true,
    };
  }

  return {
    primary: 'Ready',
    chipColor: 'success',
    tooltip: 'Eligible to push.',
    showPrimaryAsChip: true,
  };
}
