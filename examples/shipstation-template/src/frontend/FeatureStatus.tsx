import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import type { ChannelSetupEntry } from './setupTypes';

type FeatureState = 'working' | 'partial' | 'off';

type Feature = {
  title: string;
  detail: string;
  state: FeatureState;
  /** Human-readable list of what is still missing. */
  needs: string[];
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

function gate({ title, detail, requires }: {
  title: string;
  detail: string;
  requires: [boolean, string][];
}): Feature {
  const needs = requires.filter(([met]) => !met).map(([, label]) => label);
  return { title, detail, state: needs.length === 0 ? 'working' : 'off', needs };
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
    },
    gate({
      title: 'Fulfillment queue',
      detail: 'Sync status per order, batch push and retry, and the Digit sales-order PDF.',
      requires: [[connected, CONNECTION]],
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
    }),
    gate({
      title: 'Print labels in ShipStation',
      detail: 'Buy and print labels in ShipStation. This app does not rate-shop inside Digit.',
      requires: [[connected, CONNECTION]],
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
        }
      : {
          title: 'Store order import',
          detail:
            'Connect a store via Digit Rutter, or add channel secrets and a webhook adapter (Shopify, WooCommerce) in a clone of this template.',
          state: 'off',
          needs: ['Digit Rutter store connection or channel adapter secrets'],
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
        }
      : {
          title: 'Tracking to sales channel',
          detail:
            'Finish ShipStation writeback first, then use Digit Rutter or a direct channel adapter to notify the store.',
          state: 'off',
          needs: [CONNECTION, TOKEN, WEBHOOK],
        },
    gate({
      title: 'Hold orders that should not ship yet',
      detail:
        'Orders without available inventory are skipped. The optional tag filter and Manual fulfillment keep LTL or other 3PL orders in Digit.',
      requires: [[connected, CONNECTION]],
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

export default function FeatureStatus(props: FeatureStatusProps) {
  const list = features(props);
  const workingCount = list.filter((feature) => feature.state === 'working').length;

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
        <Typography variant="subtitle1" component="h2">
          What works right now
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {workingCount} of {list.length} features ready
        </Typography>
      </Stack>
      <List disablePadding>
        {list.map((feature) => (
          <ListItem key={feature.title} alignItems="flex-start" disableGutters sx={{ py: 0.75 }}>
            <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>{stateIcon(feature.state)}</ListItemIcon>
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <span>{feature.title}</span>
                  {stateChip(feature.state)}
                </Stack>
              }
              secondary={
                <>
                  {feature.detail}
                  {feature.needs.length > 0 ? ` Needs ${feature.needs.join(' and ')}.` : ''}
                </>
              }
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
