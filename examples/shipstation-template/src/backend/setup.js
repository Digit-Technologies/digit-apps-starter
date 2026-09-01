/**
 * First-load config. Operators paste secrets in the app (stored in D1).
 * SHIPSTATION_DB is a publish binding — never shown in the UI.
 */

import { AppErrorCode, parseJsonResponse, optionalString } from '@digit/lib-common';
import { err, ok } from '@digit/lib-backend';

import {
  loadApiTokenDigit,
  loadPublicWebhookUrl,
  saveApiTokenDigit,
  savePublicWebhookUrl,
  shipstationDb,
} from './runtimeConfig.js';

function httpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function setupItems({ env, db }) {
  const token = await loadApiTokenDigit({ env, db });
  const webhookUrl = await loadPublicWebhookUrl({ env, db });

  return [
    {
      key: 'API_TOKEN_DIGIT',
      kind: 'secret',
      required: true,
      present: Boolean(token),
      valid: Boolean(token),
      issue: token ? null : 'Paste a Digit API token (da_…).',
      description:
        'Digit API token used by this app for webhook writeback and scheduled push. Create it in Digit → Settings → API Tokens with the same permissions as this app. It is stored encrypted and never shown again.',
    },
    {
      key: 'PUBLIC_WEBHOOK_URL',
      kind: 'env',
      required: true,
      present: Boolean(webhookUrl),
      valid: Boolean(webhookUrl),
      issue: webhookUrl ? null : 'Paste this app’s public /webhooks/shipstation URL.',
      description:
        'Public HTTPS URL for POST /webhooks/shipstation. Connect registers ShipStation fulfillment and label webhooks against it.',
    },
  ];
}

function setupPayload({ db, items }) {
  const ready =
    Boolean(db) && items.filter((item) => item.required).every((item) => item.present && item.valid);
  return { ready, items };
}

/**
 * @returns {Promise<Response | null>}
 */
export async function handleSetup({ env, path, method, request }) {
  if (path !== '/setup') return null;

  const db = shipstationDb({ env });

  if (method === 'GET') {
    const items = db ? await setupItems({ env, db }) : await setupItems({ env, db: null });
    return ok({ data: setupPayload({ db, items }) });
  }

  if (method !== 'POST') return null;

  if (!db) {
    return err({
      code: AppErrorCode.MISSING_CONFIG,
      message: 'This app is not fully published. Republish it, then try again.',
      status: 503,
    });
  }

  const parsed = await parseJsonResponse({
    value: request.json(),
    fields: {
      apiTokenDigit: (obj) => optionalString({ obj, key: 'apiTokenDigit', default: '' }),
      publicWebhookUrl: (obj) => optionalString({ obj, key: 'publicWebhookUrl', default: '' }),
    },
  });
  if (!parsed.ok) {
    return err({ code: parsed.error.code, message: parsed.error.message, status: 400 });
  }

  const tokenInput = parsed.value.apiTokenDigit;
  const webhookInput = parsed.value.publicWebhookUrl;
  const existingToken = await loadApiTokenDigit({ env, db });
  const existingWebhook = await loadPublicWebhookUrl({ env, db });

  if (tokenInput) {
    await saveApiTokenDigit({ env, db, token: tokenInput });
  } else if (!existingToken) {
    return err({
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'API_TOKEN_DIGIT is required.',
      status: 400,
    });
  }

  if (webhookInput) {
    if (!httpsUrl(webhookInput)) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'PUBLIC_WEBHOOK_URL must be an https URL.',
        status: 400,
      });
    }
    await savePublicWebhookUrl({ db, url: webhookInput });
  } else if (!existingWebhook) {
    return err({
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'PUBLIC_WEBHOOK_URL is required.',
      status: 400,
    });
  }

  const items = await setupItems({ env, db });
  return ok({ data: setupPayload({ db, items }) });
}
