/**
 * Keep in sync with src/backend/eligibility.js — the Worker cannot import this file.
 */

export type OrgSettingsForEligibility = {
  defaultFulfillmentMethod?: string | null;
  syncMode?: string | null;
  pushWhen?: string | null;
  laneTagId?: string | null;
};

export type MapRowForEligibility = {
  source?: string | null;
  pushStatus?: string | null;
};

export type OrderForEligibility = {
  packingStatus?: string | null;
  tags?: { id: string }[] | null;
  items?: { quantity: number; itemAvailability?: string | null; totalShippedQuantity?: number }[] | null;
};

export function remainingToShip(line: {
  quantity?: number;
  totalShippedQuantity?: number | null;
}) {
  const quantity = Number(line?.quantity ?? 0);
  const shipped = Number(line?.totalShippedQuantity ?? 0);
  return Math.max(0, quantity - shipped);
}

export function inventoryEligible({ items }: { items?: OrderForEligibility['items'] }) {
  const lines = (items ?? []).filter((line) => remainingToShip(line) > 0);
  if (lines.length === 0) return false;
  return lines.every((line) => line.itemAvailability === 'fully_available');
}

export function packingEligible({
  packingStatus,
  pushWhen,
}: {
  packingStatus?: string | null;
  pushWhen?: string | null;
}) {
  if (pushWhen === 'inventory_available') return true;
  return packingStatus === 'fully_packed';
}

export function laneEligible({
  tags,
  laneTagId,
}: {
  tags?: { id: string }[] | null;
  laneTagId?: string | null;
}) {
  if (!laneTagId) return true;
  return (tags ?? []).some((tag) => tag?.id === laneTagId);
}

export function ineligibilityReason({
  order,
  orgSettings,
  mapRow,
}: {
  order: OrderForEligibility;
  orgSettings?: OrgSettingsForEligibility | null;
  mapRow?: MapRowForEligibility | null;
}): string | null {
  if ((orgSettings?.syncMode ?? 'digit_to_ss') === 'ss_to_digit') {
    return 'Inbound-only mode does not push Digit orders to ShipStation.';
  }
  if ((orgSettings?.defaultFulfillmentMethod ?? 'unspecified') === 'manual') {
    return 'Default fulfillment method is Manual — orders are not pushed to ShipStation.';
  }
  if (mapRow?.source === 'shipstation') {
    return 'This order was imported from ShipStation and will not be re-pushed.';
  }
  if (mapRow && ['pushed', 'shipped'].includes(mapRow.pushStatus ?? '')) {
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

export function skipNextStep(reason: string | null | undefined) {
  if (!reason) return 'Fix the issue, then try again.';
  if (reason.includes('Inbound-only')) {
    return 'Switch sync mode to Digit to ShipStation in Settings if you need to push.';
  }
  if (reason.includes('Manual')) {
    return 'Change default fulfillment method to Unspecified or ShipStation, or leave this order in Digit.';
  }
  if (reason.includes('imported from ShipStation')) {
    return 'Fulfill it in ShipStation; this app will not create a second shipment.';
  }
  if (reason.includes('Already shipped')) {
    return 'Tracking should already be on the Digit order.';
  }
  if (reason.includes('Already pushed')) {
    return 'Print the label in ShipStation. This Digit order stays in the queue until it is fulfilled.';
  }
  if (reason.includes('lane')) {
    return 'Add the configured lane tag to this sales order, or clear the lane filter in Settings.';
  }
  if (reason.includes('inventory')) {
    return 'Wait until remaining lines are fully available, then try again.';
  }
  if (reason.includes('fully packed')) {
    return 'Finish packing in Digit, then try again.';
  }
  return 'Fix the issue above, then try again.';
}

export function pushStatusLabel(value: string | null | undefined) {
  switch (value) {
    case 'pushed':
      return 'In ShipStation — print label there';
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
}: {
  blocked: string | null;
  mapRow?: { pushStatus?: string | null; lastError?: string | null } | null;
}): QueuePushDisplay {
  const pushStatus = mapRow?.pushStatus;
  const lastError = mapRow?.lastError ?? null;

  if (lastError || pushStatus === 'error') {
    return {
      primary: lastError ?? pushStatusLabel('error'),
      chipColor: 'error',
      tooltip: lastError ? `Push failed. ${lastError}` : 'Push failed.',
      showPrimaryAsChip: true,
      lastError: null,
    };
  }

  if (pushStatus && ['pushed', 'shipped', 'imported'].includes(pushStatus)) {
    return {
      primary: pushStatusLabel(pushStatus),
      chipColor: pushStatus === 'shipped' ? 'success' : 'default',
      tooltip:
        pushStatus === 'pushed'
          ? `${pushStatusLabel(pushStatus)} This Digit order stays in the queue until it is fulfilled.`
          : pushStatusLabel(pushStatus),
      showPrimaryAsChip: false,
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
