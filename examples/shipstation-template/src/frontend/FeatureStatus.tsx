import { useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import ApiModeToggle, { type ApiModeChoice } from './components/ApiModeToggle';
import SectionHeader from './components/SectionHeader';
import StatusChip from './components/StatusChip';
import type { ChannelSetupEntry } from './setupTypes';

type FeatureState = 'working' | 'partial' | 'off' | 'inactive';

type Feature = {
  title: string;
  detail: string;
  state: FeatureState;
  needs: string[];
};

export type FeatureStatusProps = {
  connected: boolean;
  apiTokenPresent: boolean;
  shipStationKeyPresent: boolean;
  shipStationApiMode?: 'v1' | 'v2' | 'missing';
  shipStationSecretPresent?: boolean;
  channels?: ChannelSetupEntry[];
};

const CONNECTION = 'a connected ShipStation account';
const TOKEN = 'the Digit JWT (JWT_TOKEN)';
const SS_KEY = 'the ShipStation API key';
const SS_SECRET = 'SHIPSTATION_API_SECRET';

function gate({
  title,
  detail,
  requires,
}: {
  title: string;
  detail: string;
  requires: [boolean, string][];
}): Feature {
  const needs = requires.filter(([met]) => !met).map(([, label]) => label);
  return { title, detail, state: needs.length === 0 ? 'working' : 'off', needs };
}

function markInactive(features: Feature[], reason: string): Feature[] {
  return features.map((feature) => ({
    ...feature,
    state: 'inactive',
    needs: [],
    detail: `${feature.detail} ${reason}`,
  }));
}

function anyOutboundChannel(channels: ChannelSetupEntry[]) {
  return channels.some((channel) => channel.configured);
}

function v2Features({
  connected,
  apiTokenPresent,
  shipStationKeyPresent,
}: FeatureStatusProps): Feature[] {
  return [
    gate({
      title: 'Connect and sync carriers',
      detail: 'Validates the V2 API key against api.shipstation.com and syncs carriers.',
      requires: [
        [shipStationKeyPresent, SS_KEY],
        [connected, CONNECTION],
      ],
    }),
    gate({
      title: 'Push orders to ShipStation',
      detail:
        'Eligible Digit sales orders become V2 shipments (create_sales_order) from the queue with the mapped Digit shipping carrier. Manual push (the default) waits for Push to ShipStation; Scheduled push also runs every five minutes.',
      requires: [
        [shipStationKeyPresent, SS_KEY],
        [connected, CONNECTION],
        [apiTokenPresent, TOKEN],
      ],
    }),
    gate({
      title: 'Print labels in ShipStation',
      detail:
        'Push creates the V2 shipment only. Choose carrier and buy the label in ShipStation, then pull from ShipStation or wait for the five-minute poll.',
      requires: [[connected, CONNECTION]],
    }),
    gate({
      title: 'Write tracking back to Digit',
      detail:
        'The five-minute poll (and Pull from ShipStation) reads V2 labels and writes carrier, tracking, and cost onto the Digit shipment.',
      requires: [
        [shipStationKeyPresent, SS_KEY],
        [connected, CONNECTION],
        [apiTokenPresent, TOKEN],
      ],
    }),
  ];
}

function v1Features({
  connected,
  apiTokenPresent,
  shipStationKeyPresent,
  shipStationSecretPresent = false,
}: FeatureStatusProps): Feature[] {
  const hasV1Creds = shipStationKeyPresent && shipStationSecretPresent;

  return [
    gate({
      title: 'Connect and sync carriers',
      detail: 'Validates V1 Basic auth against ssapi.shipstation.com and syncs carriers.',
      requires: [
        [hasV1Creds, `${SS_KEY} and ${SS_SECRET}`],
        [connected, CONNECTION],
      ],
    }),
    gate({
      title: 'Push orders to ShipStation',
      detail: 'Eligible Digit sales orders become V1 orders via createorder from the queue with the mapped Digit shipping carrier. Manual push (the default) waits for Push to ShipStation; Scheduled push also runs every five minutes.',
      requires: [
        [hasV1Creds, `${SS_KEY} and ${SS_SECRET}`],
        [connected, CONNECTION],
        [apiTokenPresent, TOKEN],
      ],
    }),
    gate({
      title: 'Print labels in ShipStation',
      detail:
        'Push creates the V1 order only. Choose carrier and buy the label in ShipStation, then pull from ShipStation or wait for the five-minute poll.',
      requires: [[connected, CONNECTION]],
    }),
    gate({
      title: 'Write tracking back to Digit',
      detail:
        'The five-minute poll (and Pull from ShipStation) reads V1 orders and writes carrier, tracking, and cost onto the Digit shipment.',
      requires: [
        [hasV1Creds, `${SS_KEY} and ${SS_SECRET}`],
        [connected, CONNECTION],
        [apiTokenPresent, TOKEN],
      ],
    }),
  ];
}

function digitFeatures({ connected }: FeatureStatusProps): Feature[] {
  return [
    {
      title: 'Pick and pack in Digit',
      detail:
        'Operators pick and pack in Digit, and can download sales-order, pick-list, and packing-slip PDFs.',
      state: 'working',
      needs: [],
    },
    gate({
      title: 'Shipping queue',
      detail: 'Digit shipment status and ShipStation tracking status, batch push, and packing-slip PDFs.',
      requires: [[connected, CONNECTION]],
    }),
    gate({
      title: 'Hold shipments that should not ship yet',
      detail:
        'Imported ShipStation rows stay in Digit. The queue lists awaiting-carrier, unknown, and in-transit/delivered shipments.',
      requires: [[connected, CONNECTION]],
    }),
  ];
}

function channelFeatures({
  connected,
  apiTokenPresent,
  channels = [],
}: FeatureStatusProps): Feature[] {
  const storeFulfillmentConfigured = anyOutboundChannel(channels);

  return [
    {
      title: 'Store order import',
      detail:
        'Connect a store via Digit Rutter, or add channel secrets and implement a direct adapter in a clone of this template.',
      state: 'off' as const,
      needs: ['Digit Rutter store connection or channel adapter secrets'],
    },
    storeFulfillmentConfigured || (connected && apiTokenPresent)
      ? {
          title: 'Tracking to sales channel',
          detail: storeFulfillmentConfigured
            ? 'A direct channel adapter can push tracking after Digit writeback. Digit Rutter also propagates tracking when the store is connected in Digit.'
            : 'When tracking is on the Digit shipment, Digit Rutter can notify connected Shopify/WooCommerce stores. Add a channel adapter for stores Rutter does not cover.',
          state: (storeFulfillmentConfigured ? 'partial' : 'working') as FeatureState,
          needs: storeFulfillmentConfigured
            ? ['channel adapter implementation in your clone']
            : [],
        }
      : {
          title: 'Tracking to sales channel',
          detail:
            'Finish ShipStation writeback first, then use Digit Rutter or a direct channel adapter to notify the store.',
          state: 'off' as const,
          needs: [CONNECTION, TOKEN],
        },
  ];
}

function stateChip(state: FeatureState) {
  if (state === 'working') return <StatusChip color="success" label="Working" />;
  if (state === 'partial') return <StatusChip color="warning" label="Limited" />;
  if (state === 'inactive') {
    return <StatusChip label="Not this mode" />;
  }
  return <StatusChip label="Not yet" />;
}

function stateIcon(state: FeatureState) {
  if (state === 'working') return <CheckCircleOutlineIcon color="primary" fontSize="small" />;
  if (state === 'partial') return <ErrorOutlineIcon color="warning" fontSize="small" />;
  if (state === 'inactive') {
    return <RemoveCircleOutlineIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
  }
  return <RemoveCircleOutlineIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
}

function FeatureCard({ feature }: { feature: Feature }) {
  const muted = feature.state === 'inactive';
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        opacity: muted ? 0.55 : 1,
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="flex-start">
        <Box sx={{ mt: 0.25, flexShrink: 0 }}>{stateIcon(feature.state)}</Box>
        <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle2" component="h3">
              {feature.title}
            </Typography>
            {stateChip(feature.state)}
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {feature.detail}
            {feature.needs.length > 0 ? ` Needs ${feature.needs.join(' and ')}.` : ''}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1.5,
      }}
    >
      {features.map((feature) => (
        <FeatureCard key={feature.title} feature={feature} />
      ))}
    </Box>
  );
}

function ModePanel({
  title,
  subtitle,
  selected,
  features,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  features: Feature[];
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: '100%',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'action.hover' : 'background.paper',
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="subtitle1" component="h3">
            {title}
          </Typography>
          {selected ? (
            <StatusChip color="primary" label="Active mode" />
          ) : (
            <StatusChip label="Not selected" />
          )}
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {subtitle}
        </Typography>
        <FeatureGrid features={features} />
      </Stack>
    </Paper>
  );
}

function modeLabel(mode: FeatureStatusProps['shipStationApiMode']) {
  if (mode === 'v1') return 'V1';
  if (mode === 'v2') return 'V2';
  return 'not configured';
}

export default function FeatureStatus(props: FeatureStatusProps) {
  const mode = props.shipStationApiMode ?? 'missing';
  const v2Active = mode === 'v2';
  const v1Active = mode === 'v1';
  const [viewedMode, setViewedMode] = useState<ApiModeChoice>(mode === 'v1' ? 'v1' : 'v2');

  const digit = digitFeatures(props);
  const channels = channelFeatures(props);

  const v2Live = v2Features(props);
  const v1Live = v1Features(props);

  const v2List = v2Active
    ? v2Live
    : markInactive(
        v2Live,
        v1Active
          ? 'This connection is V1 only — remove SHIPSTATION_API_SECRET and reconnect to use V2 instead.'
          : 'Add SHIPSTATION_API_KEY alone (no secret), then connect.',
      );

  const v1List = v1Active
    ? v1Live
    : markInactive(
        v1Live,
        v2Active
          ? 'This connection is V2 only — add SHIPSTATION_API_SECRET and reconnect to use V1 instead.'
          : 'Add SHIPSTATION_API_KEY plus SHIPSTATION_API_SECRET, then connect.',
      );

  const scored = [...digit, ...(v2Active ? v2Live : []), ...(v1Active ? v1Live : []), ...channels];
  const workingCount = scored.filter((feature) => feature.state === 'working').length;
  const progress = scored.length > 0 ? (workingCount / scored.length) * 100 : 0;

  const viewingV2 = viewedMode === 'v2';
  const panelSelected = viewingV2 ? v2Active : v1Active;

  return (
    <Stack spacing={2}>
      <SectionHeader
        overline="Capabilities"
        title="What you can do"
        description={`${workingCount} of ${scored.length} features ready for the active mode`}
      />
      <Alert severity="info">
        ShipStation runs as <strong>either V1 or V2</strong> for this organization — never both at
        once. Mode comes from app secrets: API key alone is V2; key plus{' '}
        <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>
          SHIPSTATION_API_SECRET
        </Typography>{' '}
        is V1. Switching versions requires changing secrets, then disconnect and reconnect.
        Currently: <strong>{modeLabel(mode)}</strong>.
      </Alert>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
        }}
      />

      <Stack spacing={1}>
        <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.06em' }}>
          In Digit
        </Typography>
        <FeatureGrid features={digit} />
      </Stack>

      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          useFlexGap
        >
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.06em' }}>
            ShipStation API mode
          </Typography>
          <ApiModeToggle value={viewedMode} onChange={setViewedMode} />
        </Stack>
        {viewingV2 ? (
          <ModePanel
            title="ShipStation V2"
            subtitle="SHIPSTATION_API_KEY only → api.shipstation.com. Labels are purchased in ShipStation; this app polls for tracking."
            selected={panelSelected}
            features={v2List}
          />
        ) : (
          <ModePanel
            title="ShipStation V1"
            subtitle="Key + SHIPSTATION_API_SECRET → ssapi.shipstation.com Basic auth. Labels are purchased in ShipStation; this app polls for tracking."
            selected={panelSelected}
            features={v1List}
          />
        )}
      </Stack>

      <Stack spacing={1}>
        <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.06em' }}>
          Store channels
        </Typography>
        <FeatureGrid features={channels} />
      </Stack>
    </Stack>
  );
}
