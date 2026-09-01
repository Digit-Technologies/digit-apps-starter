/**
 * First-load config, read-only.
 *
 * API_TOKEN_DIGIT and PUBLIC_WEBHOOK_URL are managed in Digit's built-in App Secrets UI,
 * and the platform injects them into this Worker as `env.KEY`. This route reports what
 * the Worker can actually see, so the UI can say which features work.
 * SHIPSTATION_DB is a publish binding — never shown in the UI.
 */

import { AppErrorCode } from '@digit/lib-common';
import { err, ok } from '@digit/lib-backend';

import {
  readApiTokenDigit,
  readPublicWebhookUrl,
  readShipStationApiKey,
  shipstationDb,
} from './runtimeConfig.js';

async function setupItems({ env, db }) {
  const token = await readApiTokenDigit({ env, db });
  const webhookUrl = await readPublicWebhookUrl({ env, db });
  const shipStationKey = await readShipStationApiKey({ env, db });

  return [
    {
      key: 'SHIPSTATION_API_KEY',
      kind: 'secret',
      required: true,
      present: Boolean(shipStationKey.value),
      valid: Boolean(shipStationKey.value),
      source: shipStationKey.source,
      issue: shipStationKey.value ? null : 'Add a ShipStation V2 API key.',
      enables: 'Everything that talks to ShipStation: carrier sync, pushes, labels, webhooks.',
      description:
        'ShipStation V2 API key for this organization, from ShipStation → Settings → API. Stored as a Digit app secret for this organization and validated against ShipStation when you connect.',
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
}

function setupPayload({ db, items }) {
  const present = (key) => Boolean(items.find((item) => item.key === key)?.present);
  const ready =
    Boolean(db) && items.filter((item) => item.required).every((item) => item.present && item.valid);
  return {
    ready,
    usable: Boolean(db),
    apiTokenPresent: present('API_TOKEN_DIGIT'),
    webhookUrlPresent: present('PUBLIC_WEBHOOK_URL'),
    shipStationKeyPresent: present('SHIPSTATION_API_KEY'),
    items,
  };
}

/**
 * @returns {Promise<Response | null>}
 */
export async function handleSetup({ env, path, method }) {
  if (path !== '/setup') return null;

  const db = shipstationDb({ env });

  if (method === 'GET') {
    return ok({ data: setupPayload({ db, items: await setupItems({ env, db }) }) });
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
