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

import SectionHeader from './components/SectionHeader';
import type { ChannelSetupEntry } from './setupTypes';

type FeatureState = 'working' | 'partial' | 'off';

type Feature = {
  title: string;
  detail: string;
  state: FeatureState;
  needs: string[];
  group: 'digit' | 'shipstation' | 'channels';
};

export type FeatureStatusProps = {
  connected: boolean;
  apiTokenPresent: boolean;
  webhookUrlPresent: boolean;
  shipStationKeyPresent: boolean;
  channels?: ChannelSetupEntry[];
};

const CONNECTION = 'a connected ShipStation account';
const TOKEN = 'the Digit API token';
const WEBHOOK = 'the webhook URL';
const SS_KEY = 'the ShipStation API key';

function gate({ title, detail, requires, group }: {
  title: string;
  detail: string;
  requires: [boolean, string][];
  group: Feature['group'];
}): Feature {
  const needs = requires.filter(([met]) => !met).map(([, label]) => label);
  return { title, detail, state: needs.length === 0 ? 'working' : 'off', needs, group };
}

function anyInboundChannel(channels: ChannelSetupEntry[]) {
  return channels.some((channel) => channel.webhookPath && channel.configured);
}

function anyOutboundChannel(channels: ChannelSetupEntry[]) {
  return channels.some((channel) => channel.configured);
}

function features({
  connected,
  apiTokenPresent,
  webhookUrlPresent,
  shipStationKeyPresent,
  channels = [],
}: FeatureStatusProps): Feature[] {
  const inbound = gate({
    title: 'Inbound ShipStation orders',
    detail:
      'With sync mode set to ShipStation to Digit, ShipStation shipments become Digit sales orders.',
    requires: [
      [shipStationKeyPresent, SS_KEY],
      [connected, CONNECTION],
      [apiTokenPresent, TOKEN],
    ],
    group: 'shipstation',
  });

  const storeImportConfigured = anyInboundChannel(channels);
  const storeFulfillmentConfigured = anyOutboundChannel(channels);

  return [
    {
      title: 'Pick and pack in Digit',
      detail:
        'Operators pick and pack in Digit, and can download sales-order, pick-list, and packing-slip PDFs.',
      state: 'working',
      needs: [],
      group: 'digit',
    },
    gate({
      title: 'Fulfillment queue',
      detail: 'Sync status per order, batch push and retry, and the Digit sales-order PDF.',
      requires: [[connected, CONNECTION]],
      group: 'digit',
    }),
    gate({
      title: 'Push orders to ShipStation',
      detail:
        'Eligible sales orders become ShipStation shipments, either when fully packed or as soon as inventory can fill the order.',
      requires: [
        [shipStationKeyPresent, SS_KEY],
        [connected, CONNECTION],
        [apiTokenPresent, TOKEN],
      ],
      group: 'shipstation',
    }),
    gate({
      title: 'Print labels in ShipStation',
      detail: 'Buy and print labels in ShipStation. This app does not rate-shop inside Digit.',
      requires: [[connected, CONNECTION]],
      group: 'shipstation',
    }),
    gate({
      title: 'Write tracking back to Digit',
      detail:
        'When ShipStation creates a label, tracking and carrier land on the Digit shipment so sales channels can be notified.',
      requires: [
        [shipStationKeyPresent, SS_KEY],
        [connected, CONNECTION],
        [apiTokenPresent, TOKEN],
        [webhookUrlPresent, WEBHOOK],
      ],
      group: 'shipstation',
    }),
    inbound.state === 'working' && !webhookUrlPresent
      ? {
          ...inbound,
          state: 'partial',
          detail: `${inbound.detail} Without the webhook URL, imports only run on the five-minute schedule instead of arriving in real time.`,
        }
      : inbound,
    storeImportConfigured
      ? {
          title: 'Store order import (direct channel)',
          detail:
            'A configured commerce channel adapter can import store orders into Digit when you declare its webhook path in manifest.json.',
          state: 'partial',
          needs: ['manifest webhook path and adapter implementation in your clone'],
          group: 'channels',
        }
      : {
          title: 'Store order import',
          detail:
            'Connect a store via Digit Rutter, or add channel secrets and a webhook adapter (Shopify, WooCommerce) in a clone of this template.',
          state: 'off',
          needs: ['Digit Rutter store connection or channel adapter secrets'],
          group: 'channels',
        },
    storeFulfillmentConfigured || (connected && apiTokenPresent && webhookUrlPresent)
      ? {
          title: 'Tracking to sales channel',
          detail: storeFulfillmentConfigured
            ? 'A direct channel adapter can push tracking after Digit writeback. Digit Rutter also propagates tracking when the store is connected in Digit.'
            : 'When tracking is on the Digit shipment, Digit Rutter can notify connected Shopify/WooCommerce stores. Add a channel adapter for stores Rutter does not cover.',
          state: storeFulfillmentConfigured ? 'partial' : 'working',
          needs: storeFulfillmentConfigured
            ? ['channel adapter implementation in your clone']
            : [],
          group: 'channels',
        }
      : {
          title: 'Tracking to sales channel',
          detail:
            'Finish ShipStation writeback first, then use Digit Rutter or a direct channel adapter to notify the store.',
          state: 'off',
          needs: [CONNECTION, TOKEN, WEBHOOK],
          group: 'channels',
        },
    gate({
      title: 'Hold orders that should not ship yet',
      detail:
        'Orders without available inventory are skipped. The optional tag filter and Manual fulfillment keep LTL or other 3PL orders in Digit.',
      requires: [[connected, CONNECTION]],
      group: 'shipstation',
    }),
  ];
}

function stateChip(state: FeatureState) {
  if (state === 'working') return <Chip size="small" color="success" label="Working" />;
  if (state === 'partial') return <Chip size="small" color="warning" label="Limited" />;
  return <Chip size="small" label="Not yet" />;
}

function stateIcon(state: FeatureState) {
  if (state === 'working') return <CheckCircleOutlineIcon color="primary" fontSize="small" />;
  if (state === 'partial') return <ErrorOutlineIcon color="warning" fontSize="small" />;
  return <RemoveCircleOutlineIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
}

const GROUP_LABELS: Record<Feature['group'], string> = {
  digit: 'In Digit',
  shipstation: 'ShipStation sync',
  channels: 'Store channels',
};

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
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

export default function FeatureStatus(props: FeatureStatusProps) {
  const list = features(props);
  const workingCount = list.filter((feature) => feature.state === 'working').length;
  const progress = list.length > 0 ? (workingCount / list.length) * 100 : 0;

  const groups: Feature['group'][] = ['digit', 'shipstation', 'channels'];

  return (
    <Stack spacing={2}>
      <SectionHeader
        overline="Capabilities"
        title="What you can do"
        description={`${workingCount} of ${list.length} features ready`}
      />
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
      {groups.map((group) => {
        const groupFeatures = list.filter((feature) => feature.group === group);
        if (groupFeatures.length === 0) return null;
        return (
          <Stack key={group} spacing={1}>
            <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.06em' }}>
              {GROUP_LABELS[group]}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
              }}
            >
              {groupFeatures.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} />
              ))}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}
