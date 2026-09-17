const FULFILLMENT_METHODS = new Set(['scheduled', 'manual']);
export { FULFILLMENT_METHODS };

export const V1_MULTI_CONTAINER_REASON =
  'ShipStation V1 supports only one package per order, but this Digit shipment has multiple pack containers.';

/** Legacy unspecified/shipstation → scheduled; leftover unknown values → scheduled. */
export function normalizeFulfillmentMethod(value) {
  return value === 'manual' ? 'manual' : 'scheduled';
}

export function packedLineCount(shipment) {
  let count = 0;
  for (const container of shipment?.packContainers ?? []) {
    for (const packed of container.packedItems ?? []) {
      if (packed?.pickedItem?.orderItem?.item) count += 1;
    }
  }
  return count;
}

/**
 * Why a Digit shipment is not pushed. Null means eligible.
 */
export function ineligibilityReason({ shipment, orgSettings, mapRow, apiVersion = null }) {
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
    (mapRow.ssShipmentId || ['pushed', 'label_ready', 'shipped'].includes(mapRow.pushStatus))
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

/** Keep in sync with src/frontend/eligibility.ts */
export function skipNextStep(reason) {
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
