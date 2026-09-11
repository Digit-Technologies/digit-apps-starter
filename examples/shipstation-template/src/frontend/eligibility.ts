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

export type PackedLineForEligibility = {
  packedItems?: { pickedItem?: { orderItem?: { item?: unknown } | null } | null }[] | null;
};

export type ShipmentForEligibility = {
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
}: {
  shipment: ShipmentForEligibility;
  orgSettings?: OrgSettingsForEligibility | null;
  mapRow?: MapRowForEligibility | null;
}): string | null {
  if ((orgSettings?.syncMode ?? 'digit_to_ss') === 'ss_to_digit') {
    return 'Inbound-only mode does not push Digit shipments to ShipStation.';
  }
  if ((orgSettings?.defaultFulfillmentMethod ?? 'unspecified') === 'manual') {
    return 'Default fulfillment method is Manual — shipments are not pushed to ShipStation.';
  }
  if (mapRow?.source === 'shipstation') {
    return 'This shipment was imported from ShipStation and will not be re-pushed.';
  }
  if (mapRow && ['pushed', 'shipped'].includes(mapRow.pushStatus ?? '')) {
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

export function skipNextStep(reason: string | null | undefined) {
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
          ? `${pushStatusLabel(pushStatus)} This Digit shipment stays in the queue until it is marked shipped.`
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
