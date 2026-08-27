/**
 * First-load config check. Reports which secrets, env vars, and bindings are
 * present without throwing — so the UI can show a setup screen instead of a
 * generic MISSING_CONFIG alert after the user tries to connect.
 */

import { ok, optionalEnv } from '@digit/lib-backend';

import { parseEncryptionKey } from './crypto.js';

function inspectEncryptionKey({ env }) {
  const raw = optionalEnv({ env, key: 'APP_SECRET_ENCRYPTION_KEY' });
  if (!raw) {
    return { present: false, valid: false, issue: 'Not set.' };
  }
  try {
    parseEncryptionKey({ raw });
    return { present: true, valid: true, issue: null };
  } catch {
    return {
      present: true,
      valid: false,
      issue: 'Must be a base64-encoded 32-byte key (openssl rand -base64 32).',
    };
  }
}

/**
 * @returns {Promise<Response | null>}
 */
export async function handleSetup({ env, path, method }) {
  if (method !== 'GET' || path !== '/setup') return null;

  const encryption = inspectEncryptionKey({ env });
  const db = optionalEnv({ env, key: 'SHIPSTATION_DB' });
  const webhookUrl = optionalEnv({ env, key: 'PUBLIC_WEBHOOK_URL' });

  const items = [
    {
      key: 'APP_SECRET_ENCRYPTION_KEY',
      kind: 'secret',
      required: true,
      present: encryption.present,
      valid: encryption.valid,
      issue: encryption.issue,
      where: 'App → Secrets',
      description:
        'AES-256 key used to encrypt the ShipStation API key in D1. Generate with openssl rand -base64 32, then paste the output as a secret. Never returned to the browser.',
    },
    {
      key: 'SHIPSTATION_DB',
      kind: 'database',
      required: true,
      present: Boolean(db),
      valid: Boolean(db),
      issue: db ? null : 'Not bound. Publish a bundle whose manifest declares this D1 database.',
      where: 'manifest.json → backend.bindings (applied on publish)',
      description: 'D1 database for the connection, carrier catalog, and label records.',
    },
    {
      key: 'PUBLIC_WEBHOOK_URL',
      kind: 'env',
      required: false,
      present: Boolean(webhookUrl),
      valid: true,
      issue: null,
      where: 'App → Env vars',
      description:
        'This app’s public /webhooks/shipstation URL. When set, connect registers ShipStation label_created_v2 and track webhooks; disconnect removes them.',
    },
  ];

  const ready = items.filter((item) => item.required).every((item) => item.present && item.valid);

  return ok({ data: { ready, items } });
}
