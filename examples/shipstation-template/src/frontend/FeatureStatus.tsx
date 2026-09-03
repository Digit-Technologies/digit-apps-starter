import { useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import ApiModeToggle, { type ApiModeChoice } from './components/ApiModeToggle';
import SectionHeader from './components/SectionHeader';
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
  webhookUrlPresent: boolean;
  shipStationKeyPresent: boolean;
  shipStationApiMode?: 'v1' | 'v2' | 'missing';
  shipStationWebhookTokenPresent?: boolean;
  shipStationSecretPresent?: boolean;
  channels?: ChannelSetupEntry[];
};

const CONNECTION = 'a connected ShipStation account';
const TOKEN = 'the Digit API token';
const WEBHOOK = 'the webhook URL';
const SS_KEY = 'the ShipStation API key';
const SS_SECRET = 'SHIPSTATION_API_SECRET';
const SS_WEBHOOK_TOKEN = 'SHIPSTATION_WEBHOOK_TOKEN';

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

function anyInboundChannel(channels: ChannelSetupEntry[]) {
  return channels.some((channel) => channel.webhookPath && channel.configured);
}

function anyOutboundChannel(channels: ChannelSetupEntry[]) {
  return channels.some((channel) => channel.configured);
}

function v2Features({
  connected,
  apiTokenPresent,
  webhookUrlPresent,
  shipStationKeyPresent,
}: FeatureStatusProps): Feature[] {
  const inbound = gate({
    title: 'Inbound ShipStation orders',
    detail:
      'With sync mode set to ShipStation to Digit, V2 shipments become Digit sales orders.',
    requires: [
      [shipStationKeyPresent, SS_KEY],
      [connected, CONNECTION],
      [apiTokenPresent, TOKEN],
    ],
  });

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
        'Eligible Digit sales orders become V2 shipments (create_sales_order) when packed or inventory-ready.',
      requires: [
        [shipStationKeyPresent, SS_KEY],
        [connected, CONNECTION],
        [apiTokenPresent, TOKEN],
      ],
    }),
    gate({
      title: 'Print labels in ShipStation',
      detail: 'Buy and print labels in the ShipStation UI. This app does not rate-shop inside Digit.',
      requires: [[connected, CONNECTION]],
    }),
    gate({
      title: 'Write tracking back to Digit',
      detail:
        'V2 label and track webhooks (RSA-SHA256) write tracking onto the Digit shipment.',
      requires: [
        [shipStationKeyPresent, SS_KEY],
        [connected, CONNECTION],
        [apiTokenPresent, TOKEN],
        [webhookUrlPresent, WEBHOOK],
      ],
    }),
    inbound.state === 'working' && !webhookUrlPresent
      ? {
          ...inbound,
          state: 'partial',
          detail: `${inbound.detail} Without the webhook URL, imports only run on the five-minute schedule.`,
        }
      : inbound,
  ];
}

function v1Features({
  connected,
  apiTokenPresent,
  webhookUrlPresent,
  shipStationKeyPresent,
  shipStationSecretPresent = false,
  shipStationWebhookTokenPresent = false,
}: FeatureStatusProps): Feature[] {
  const hasV1Creds = shipStationKeyPresent && shipStationSecretPresent;
  const v1NeedsWebhookToken = webhookUrlPresent && !shipStationWebhookTokenPresent;

  const inbound = gate({
    title: 'Inbound ShipStation orders',
    detail:
      'With sync mode set to ShipStation to Digit, V1 orders become Digit sales orders.',
    requires: [
      [hasV1Creds, `${SS_KEY} and ${SS_SECRET}`],
      [connected, CONNECTION],
      [apiTokenPresent, TOKEN],
    ],
  });

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
      detail: 'Eligible Digit sales orders become V1 orders via createorder when packed or inventory-ready.',
      requires: [
        [hasV1Creds, `${SS_KEY} and ${SS_SECRET}`],
        [connected, CONNECTION],
        [apiTokenPresent, TOKEN],
      ],
    }),
    gate({
      title: 'Print labels in ShipStation',
      detail: 'Buy and print labels in the ShipStation UI. This app does not rate-shop inside Digit.',
      requires: [[connected, CONNECTION]],
    }),
    gate({
      title: 'Write tracking back to Digit',
      detail:
        'V1 ship/order notify webhooks use a query token (not RSA). Tracking lands on the Digit shipment.',
      requires: [
        [hasV1Creds, `${SS_KEY} and ${SS_SECRET}`],
        [connected, CONNECTION],
        [apiTokenPresent, TOKEN],
        [webhookUrlPresent, WEBHOOK],
        [!v1NeedsWebhookToken, SS_WEBHOOK_TOKEN],
      ],
    }),
    inbound.state === 'working' && (!webhookUrlPresent || v1NeedsWebhookToken)
      ? {
          ...inbound,
          state: 'partial',
          detail: v1NeedsWebhookToken
            ? `${inbound.detail} V1 webhooks need ${SS_WEBHOOK_TOKEN}; imports still run on the five-minute schedule.`
            : `${inbound.detail} Without the webhook URL, imports only run on the five-minute schedule.`,
        }
      : inbound,
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
      title: 'Fulfillment queue',
      detail: 'Sync status per order, batch push and retry, and the Digit sales-order PDF.',
      requires: [[connected, CONNECTION]],
    }),
    gate({
      title: 'Hold orders that should not ship yet',
      detail:
        'Orders without available inventory are skipped. The optional tag filter and Manual fulfillment keep LTL or other 3PL orders in Digit.',
      requires: [[connected, CONNECTION]],
    }),
  ];
}

function channelFeatures({
  connected,
  apiTokenPresent,
  webhookUrlPresent,
  channels = [],
}: FeatureStatusProps): Feature[] {
  const storeImportConfigured = anyInboundChannel(channels);
  const storeFulfillmentConfigured = anyOutboundChannel(channels);

  return [
    storeImportConfigured
      ? {
          title: 'Store order import (direct channel)',
          detail:
            'A configured commerce channel adapter can import store orders into Digit when you declare its webhook path in manifest.json.',
          state: 'partial' as const,
          needs: ['manifest webhook path and adapter implementation in your clone'],
        }
      : {
          title: 'Store order import',
          detail:
            'Connect a store via Digit Rutter, or add channel secrets and a webhook adapter (Shopify, WooCommerce) in a clone of this template.',
          state: 'off' as const,
          needs: ['Digit Rutter store connection or channel adapter secrets'],
        },
    storeFulfillmentConfigured || (connected && apiTokenPresent && webhookUrlPresent)
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
          needs: [CONNECTION, TOKEN, WEBHOOK],
        },
  ];
}

function stateChip(state: FeatureState) {
  if (state === 'working') return <Chip size="small" color="success" label="Working" />;
  if (state === 'partial') return <Chip size="small" color="warning" label="Limited" />;
  if (state === 'inactive') {
    return <Chip size="small" variant="outlined" label="Not this mode" />;
  }
  return <Chip size="small" label="Not yet" />;
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
            <Chip size="small" color="primary" label="Active mode" />
          ) : (
            <Chip size="small" variant="outlined" label="Not selected" />
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
            subtitle="SHIPSTATION_API_KEY only → api.shipstation.com. Webhooks use RSA-SHA256."
            selected={panelSelected}
            features={v2List}
          />
        ) : (
          <ModePanel
            title="ShipStation V1"
            subtitle="Key + SHIPSTATION_API_SECRET → ssapi.shipstation.com Basic auth. Webhooks need SHIPSTATION_WEBHOOK_TOKEN when a public URL is set."
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
