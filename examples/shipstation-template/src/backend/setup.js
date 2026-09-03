/**
 * First-load config, read-only.
 *
 * Setup secrets are Digit App Secrets injected as `env.KEY`. This route reports what the
 * Worker can actually see, so the UI can say which features work.
 * SHIPSTATION_DB is a publish binding — never shown in the UI.
 */

import { AppErrorCode } from '@digit/lib-common';
import { err, ok } from '@digit/lib-backend';

import {
  readApiTokenDigit,
  readPublicWebhookUrl,
  readShipStationApiKey,
  readShipStationApiSecret,
  readShipStationWebhookToken,
  resolveShipStationCredentials,
  shipstationDb,
} from './runtimeConfig.js';
import { channelSetupEntries } from './channels/registry.js';

async function setupItems({ env, db }) {
  const token = await readApiTokenDigit({ env, db });
  const webhookUrl = await readPublicWebhookUrl({ env, db });
  const shipStationKey = await readShipStationApiKey({ env, db });
  const shipStationSecret = await readShipStationApiSecret({ env, db });
  const webhookToken = await readShipStationWebhookToken({ env, db });
  const credentials = await resolveShipStationCredentials({ env, db });
  const apiMode = credentials?.apiVersion ?? (shipStationKey.value ? 'v2' : 'missing');
  const v1NeedsToken = apiMode === 'v1' && Boolean(webhookUrl.value);

  /** Required first so Setup "N of M" matches checklist numbering. */
  const required = [
    {
      key: 'SHIPSTATION_API_KEY',
      kind: 'secret',
      required: true,
      present: Boolean(shipStationKey.value),
      valid: Boolean(shipStationKey.value),
      source: shipStationKey.source,
      issue: shipStationKey.value ? null : 'Add a ShipStation API key (V2 alone, or V1 key with secret).',
      enables: 'Everything that talks to ShipStation: carrier sync, pushes, labels, webhooks.',
      description:
        'ShipStation API key for this organization. Alone = V2 (api.shipstation.com). With SHIPSTATION_API_SECRET = V1 Basic auth (ssapi.shipstation.com). Validated when you connect.',
    },
    {
      key: 'API_TOKEN_DIGIT',
      kind: 'secret',
      required: true,
      present: Boolean(token.value),
      valid: Boolean(token.value),
      source: token.source,
      issue: token.value ? null : 'Add a Digit API token (da_…).',
      enables: 'Pushing orders to ShipStation, tracking writeback, and the scheduled push.',
      description:
        'Digit API token used by this app for webhook writeback and scheduled push. Create it in Digit → Settings → API Tokens with the same permissions as this app. Saved as a Digit app secret, so its value is write-only.',
    },
    {
      key: 'PUBLIC_WEBHOOK_URL',
      kind: 'secret',
      required: true,
      present: Boolean(webhookUrl.value),
      valid: Boolean(webhookUrl.value),
      source: webhookUrl.source,
      issue: webhookUrl.value ? null : 'Add this app’s public /webhooks/shipstation URL.',
      enables: 'Real-time tracking writeback and inbound ShipStation events.',
      description:
        'Public HTTPS URL for POST /webhooks/shipstation. Connect registers ShipStation fulfillment and label webhooks against it.',
    },
  ];

  const secretItem = {
    key: 'SHIPSTATION_API_SECRET',
    kind: 'secret',
    required: false,
    present: Boolean(shipStationSecret.value),
    valid: true,
    source: shipStationSecret.source,
    issue: null,
    enables: 'V1 API mode (ssapi.shipstation.com with Basic auth). Omit for V2.',
    description:
      'Optional. When set with SHIPSTATION_API_KEY, connect uses ShipStation V1. Disconnect and reconnect after adding or removing this secret.',
  };
  const webhookTokenItem = {
    key: 'SHIPSTATION_WEBHOOK_TOKEN',
    kind: 'secret',
    required: v1NeedsToken,
    present: Boolean(webhookToken.value),
    valid: !v1NeedsToken || Boolean(webhookToken.value),
    source: webhookToken.source,
    issue:
      v1NeedsToken && !webhookToken.value
        ? 'V1 webhooks have no signature — add an unguessable SHIPSTATION_WEBHOOK_TOKEN.'
        : null,
    enables: 'Inbound V1 webhook verification (token query param on PUBLIC_WEBHOOK_URL).',
    description:
      'Required for V1 when PUBLIC_WEBHOOK_URL is set. Appended as ?token=… on registered webhook URLs. Not used for V2 RSA verification.',
  };

  // Required first so Setup "N of M" matches checklist numbering.
  if (v1NeedsToken) {
    return [...required, webhookTokenItem, secretItem];
  }
  return [...required, secretItem, webhookTokenItem];
}

function setupPayload({ db, items, channels, apiMode }) {
  const present = (key) => Boolean(items.find((item) => item.key === key)?.present);
  const ready =
    Boolean(db) && items.filter((item) => item.required).every((item) => item.present && item.valid);
  const anyChannelConfigured = channels.some((channel) => channel.configured);
  return {
    ready,
    usable: Boolean(db),
    apiTokenPresent: present('API_TOKEN_DIGIT'),
    webhookUrlPresent: present('PUBLIC_WEBHOOK_URL'),
    shipStationKeyPresent: present('SHIPSTATION_API_KEY'),
    shipStationSecretPresent: present('SHIPSTATION_API_SECRET'),
    shipStationWebhookTokenPresent: present('SHIPSTATION_WEBHOOK_TOKEN'),
    shipStationApiMode: apiMode,
    anyChannelConfigured,
    items,
    channels,
  };
}

/**
 * @returns {Promise<Response | null>}
 */
export async function handleSetup({ env, path, method }) {
  if (path !== '/setup') return null;

  const db = shipstationDb({ env });

  if (method === 'GET') {
    const channels = await channelSetupEntries({ env, db });
    const credentials = db ? await resolveShipStationCredentials({ env, db }) : null;
    const apiMode = credentials?.apiVersion ?? 'missing';
    return ok({
      data: setupPayload({
        db,
        items: await setupItems({ env, db }),
        channels,
        apiMode,
      }),
    });
  }

  if (method === 'POST') {
    return err({
      code: AppErrorCode.VALIDATION_ERROR,
      message:
        'Setup values are Digit app secrets. Manage them in Digit → Apps → this app → Secrets.',
      status: 400,
    });
  }

  return null;
}
