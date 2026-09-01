const SYNC_MODES = new Set(['digit_to_ss', 'ss_to_digit']);
const PUSH_WHENS = new Set(['fully_packed', 'inventory_available']);
const FULFILLMENT_METHODS = new Set(['unspecified', 'shipstation', 'manual']);

export { SYNC_MODES, PUSH_WHENS, FULFILLMENT_METHODS };

export function remainingToShip(line) {
  const quantity = Number(line?.quantity ?? 0);
  const shipped = Number(line?.totalShippedQuantity ?? 0);
  return Math.max(0, quantity - shipped);
}

export function inventoryEligible({ items }) {
  const lines = (items ?? []).filter((line) => remainingToShip(line) > 0);
  if (lines.length === 0) return false;
  return lines.every((line) => line.itemAvailability === 'fully_available');
}

export function packingEligible({ packingStatus, pushWhen }) {
  if (pushWhen === 'inventory_available') return true;
  return packingStatus === 'fully_packed';
}

export function laneEligible({ tags, laneTagId }) {
  if (!laneTagId) return true;
  return (tags ?? []).some((tag) => tag?.id === laneTagId);
}

/**
 * Why an order is not pushed. Null means eligible.
 */
export function ineligibilityReason({ order, orgSettings, mapRow }) {
  if ((orgSettings?.syncMode ?? 'digit_to_ss') === 'ss_to_digit') {
    return 'Inbound-only mode does not push Digit orders to ShipStation.';
  }
  if ((orgSettings?.defaultFulfillmentMethod ?? 'unspecified') === 'manual') {
    return 'Default fulfillment method is Manual — orders are not pushed to ShipStation.';
  }
  if (mapRow?.source === 'shipstation') {
    return 'This order was imported from ShipStation and will not be re-pushed.';
  }
  if (mapRow && ['pushed', 'shipped'].includes(mapRow.pushStatus)) {
    return mapRow.pushStatus === 'shipped'
      ? 'Already shipped in ShipStation.'
      : 'Already pushed to ShipStation.';
  }
  if (!laneEligible({ tags: order?.tags, laneTagId: orgSettings?.laneTagId })) {
    return 'Order is not in the configured ShipStation lane (tag filter).';
  }
  if (!inventoryEligible({ items: order?.items })) {
    return 'Insufficient available inventory on one or more lines.';
  }
  if (!packingEligible({ packingStatus: order?.packingStatus, pushWhen: orgSettings?.pushWhen })) {
    return 'Order is not fully packed yet.';
  }
  return null;
}
