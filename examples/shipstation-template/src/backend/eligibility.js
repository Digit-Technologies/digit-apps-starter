const SYNC_MODES = new Set(['digit_to_ss', 'ss_to_digit']);
const PUSH_WHENS = new Set(['fully_packed', 'inventory_available']);
const FULFILLMENT_METHODS = new Set(['unspecified', 'shipstation', 'manual']);

export { SYNC_MODES, PUSH_WHENS, FULFILLMENT_METHODS };

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
export function ineligibilityReason({ shipment, orgSettings, mapRow }) {
  if ((orgSettings?.syncMode ?? 'digit_to_ss') === 'ss_to_digit') {
    return 'Inbound-only mode does not push Digit shipments to ShipStation.';
  }
  if ((orgSettings?.defaultFulfillmentMethod ?? 'unspecified') === 'manual') {
    return 'Default fulfillment method is Manual — shipments are not pushed to ShipStation.';
  }
  if (mapRow?.source === 'shipstation') {
    return 'This shipment was imported from ShipStation and will not be re-pushed.';
  }
  if (mapRow && ['pushed', 'shipped'].includes(mapRow.pushStatus)) {
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
  return null;
}

/** Keep in sync with src/frontend/eligibility.ts */
export function skipNextStep(reason) {
  if (!reason) return 'Fix the issue, then try again.';
  if (reason.includes('Inbound-only')) {
    return 'Switch sync mode to Digit to ShipStation in Settings if you need to push.';
  }
  if (reason.includes('Manual')) {
    return 'Change default fulfillment method to Unspecified or ShipStation, or leave this shipment in Digit.';
  }
  if (reason.includes('imported from ShipStation')) {
    return 'Fulfill it in ShipStation; this app will not create a second shipment.';
  }
  if (reason.includes('Already shipped')) {
    return 'Tracking should already be on the Digit shipment.';
  }
  if (reason.includes('Already pushed')) {
    return 'Print the label in ShipStation. This Digit shipment stays in the queue until it is marked shipped.';
  }
  if (reason.includes('not linked to a sales order')) {
    return 'Multi-order or unlinked shipments are not pushed from this queue.';
  }
  if (reason.includes('no packed items')) {
    return 'Pack items onto this Digit shipment, then try again.';
  }
  return 'Fix the issue above, then try again.';
}
