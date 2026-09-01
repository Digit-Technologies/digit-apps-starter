import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  ineligibilityReason,
  queuePushDisplay,
  type MapRowForEligibility,
  type OrderForEligibility,
  type OrgSettingsForEligibility,
} from '../eligibility';

type LaneStep = 'pick' | 'pack' | 'push' | 'track';

type StepState = 'done' | 'active' | 'blocked' | 'pending';

const STEPS: { key: LaneStep; label: string }[] = [
  { key: 'pick', label: 'Pick' },
  { key: 'pack', label: 'Pack' },
  { key: 'push', label: 'Push' },
  { key: 'track', label: 'Track' },
];

function pickDone(pickingStatus?: string | null) {
  if (!pickingStatus) return false;
  return ['fully_picked', 'picked', 'complete', 'completed'].includes(pickingStatus);
}

function packDone(packingStatus?: string | null) {
  return packingStatus === 'fully_packed';
}

function pushDone(mapRow?: { ssShipmentId?: string | null; pushStatus?: string | null } | null) {
  if (mapRow?.ssShipmentId) return true;
  return ['pushed', 'shipped', 'imported'].includes(mapRow?.pushStatus ?? '');
}

function trackDone(trackingNumber?: string | null) {
  return Boolean(trackingNumber);
}

function stepState(
  step: LaneStep,
  order: OrderForEligibility & { pickingStatus?: string | null },
  mapRow: { ssShipmentId?: string | null; pushStatus?: string | null; trackingNumber?: string | null } | null,
  blocked: string | null,
): StepState {
  const pick = pickDone(order.pickingStatus);
  const pack = packDone(order.packingStatus);
  const push = pushDone(mapRow);
  const track = trackDone(mapRow?.trackingNumber);

  switch (step) {
    case 'pick':
      return pick ? 'done' : 'active';
    case 'pack':
      if (pack) return 'done';
      if (pick) return blocked && !pack ? 'blocked' : 'active';
      return 'pending';
    case 'push': {
      if (push) return 'done';
      if (pack || order.packingStatus) {
        if (blocked) return 'blocked';
        return 'active';
      }
      return 'pending';
    }
    case 'track':
      if (track) return 'done';
      if (push) return 'active';
      return 'pending';
    default:
      return 'pending';
  }
}

function dotColor(state: StepState) {
  if (state === 'done') return 'success.main';
  if (state === 'active') return 'primary.main';
  if (state === 'blocked') return 'warning.main';
  return 'action.disabled';
}

function connectorColor(left: StepState, right: StepState) {
  if (left === 'done' && (right === 'done' || right === 'active')) return 'success.main';
  if (left === 'done') return 'divider';
  return 'divider';
}

export default function FulfillmentLane({
  order,
  mapRow = null,
  orgSettings = null,
}: {
  order: OrderForEligibility & { pickingStatus?: string | null };
  mapRow?: {
    ssShipmentId?: string | null;
    pushStatus?: string | null;
    trackingNumber?: string | null;
    lastError?: string | null;
  } & MapRowForEligibility | null;
  orgSettings?: OrgSettingsForEligibility | null;
}) {
  const blocked = ineligibilityReason({ order, orgSettings, mapRow });
  const pushDisplay = queuePushDisplay({ blocked, mapRow });

  const tooltip = [
    `Pick: ${pickDone(order.pickingStatus) ? 'Complete' : order.pickingStatus?.replace(/_/g, ' ') ?? 'Not started'}`,
    `Pack: ${packDone(order.packingStatus) ? 'Complete' : order.packingStatus?.replace(/_/g, ' ') ?? 'Not started'}`,
    `Push: ${pushDisplay.primary}`,
    `Track: ${trackDone(mapRow?.trackingNumber) ? mapRow?.trackingNumber : 'Waiting for label'}`,
  ].join(' · ');

  return (
    <Tooltip title={tooltip} placement="top">
      <Stack
        direction="row"
        alignItems="center"
        spacing={0}
        aria-label={`Fulfillment progress: ${tooltip}`}
        sx={{ minWidth: 140 }}
      >
        {STEPS.map((step, index) => {
          const state = stepState(step.key, order, mapRow, blocked);
          const nextState = index < STEPS.length - 1 ? stepState(STEPS[index + 1].key, order, mapRow, blocked) : null;
          return (
            <Stack key={step.key} direction="row" alignItems="center" sx={{ flex: index < STEPS.length - 1 ? 1 : 0 }}>
              <Stack spacing={0.25} alignItems="center" sx={{ minWidth: 36 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: dotColor(state),
                    border: state === 'pending' ? 1 : 0,
                    borderColor: 'divider',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: state === 'pending' ? 'text.disabled' : 'text.secondary',
                    fontSize: 10,
                    lineHeight: 1,
                    letterSpacing: '0.02em',
                  }}
                >
                  {step.label}
                </Typography>
              </Stack>
              {index < STEPS.length - 1 && nextState ? (
                <Box
                  sx={{
                    flex: 1,
                    height: 2,
                    mx: 0.25,
                    mb: 1.5,
                    bgcolor: connectorColor(state, nextState),
                    borderRadius: 1,
                  }}
                />
              ) : null}
            </Stack>
          );
        })}
      </Stack>
    </Tooltip>
  );
}
