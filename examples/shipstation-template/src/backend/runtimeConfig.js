/**
 * App config. API_TOKEN_DIGIT and PUBLIC_WEBHOOK_URL are managed in Digit's built-in
 * App Secrets UI and reach the Worker as `env.KEY`. The D1 `app_config` rows are a
 * read-only fallback for setups saved before that switch.
 * Do not use a DIGIT_ prefix — Digit reserves it for platform bindings.
 */

import { optionalEnv } from '@digit/lib-backend';

import { decryptSecret, generateEncryptionKeyB64, parseEncryptionKey } from './crypto.js';

export const CONFIG = {
  encryptionKey: 'ENCRYPTION_KEY',
  apiTokenDigit: 'API_TOKEN_DIGIT',
  publicWebhookUrl: 'PUBLIC_WEBHOOK_URL',
  shipStationApiKey: 'SHIPSTATION_API_KEY',
  faireApiKey: 'FAIRE_API_KEY',
};

export function shipstationDb({ env }) {
  return optionalEnv({ env, key: 'SHIPSTATION_DB' }) || null;
}

async function configRow({ db, key }) {
  if (!db) return null;
  return db.prepare(`SELECT key, value, encrypted FROM app_config WHERE key = ?`).bind(key).first();
}

async function upsertConfig({ db, key, value, encrypted }) {
  await db
    .prepare(
      `INSERT INTO app_config (key, value, encrypted, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         encrypted = excluded.encrypted,
         updated_at = excluded.updated_at`,
    )
    .bind(key, value, encrypted ? 1 : 0)
    .run();
}

export async function loadEncryptionKeyBytes({ env, db }) {
  const fromEnv = optionalEnv({ env, key: 'APP_SECRET_ENCRYPTION_KEY' });
  if (fromEnv) return parseEncryptionKey({ raw: fromEnv });
  const row = await configRow({ db, key: CONFIG.encryptionKey });
  if (!row?.value) return null;
  return parseEncryptionKey({ raw: row.value });
}

export async function ensureEncryptionKeyBytes({ env, db }) {
  const existing = await loadEncryptionKeyBytes({ env, db });
  if (existing) return existing;
  const raw = generateEncryptionKeyB64();
  await upsertConfig({ db, key: CONFIG.encryptionKey, value: raw, encrypted: false });
  return parseEncryptionKey({ raw });
}

/**
 * `source` tells the setup screen where a live value came from: `appSecret` is a Digit
 * app secret/env var injected into the Worker, `appDatabase` is a legacy D1 row.
 *
 * @returns {Promise<{ value: string | null, source: 'appSecret' | 'appDatabase' | null }>}
 */
async function readStored({ env, db, key, envKeys, encrypted }) {
  for (const envKey of envKeys) {
    const fromEnv = optionalEnv({ env, key: envKey });
    if (fromEnv) return { value: fromEnv, source: 'appSecret' };
  }
  const row = await configRow({ db, key });
  if (!row?.value) return { value: null, source: null };
  if (encrypted || row.encrypted) {
    const keyBytes = await loadEncryptionKeyBytes({ env, db });
    if (!keyBytes) return { value: null, source: null };
    try {
      return {
        value: await decryptSecret({ stored: row.value, keyBytes }),
        source: 'appDatabase',
      };
    } catch {
      return { value: null, source: null };
    }
  }
  return { value: row.value, source: 'appDatabase' };
}

async function loadStored(args) {
  return (await readStored(args)).value;
}

const API_TOKEN_DIGIT_SOURCE = {
  key: CONFIG.apiTokenDigit,
  envKeys: [CONFIG.apiTokenDigit, 'DIGIT_API_TOKEN'],
  encrypted: true,
};

const PUBLIC_WEBHOOK_URL_SOURCE = {
  key: CONFIG.publicWebhookUrl,
  envKeys: [CONFIG.publicWebhookUrl],
  encrypted: false,
};

const SHIPSTATION_API_KEY_SOURCE = {
  key: CONFIG.shipStationApiKey,
  envKeys: [CONFIG.shipStationApiKey],
  encrypted: true,
};

export async function loadApiTokenDigit({ env, db }) {
  return loadStored({ env, db, ...API_TOKEN_DIGIT_SOURCE });
}

export async function readApiTokenDigit({ env, db }) {
  return readStored({ env, db, ...API_TOKEN_DIGIT_SOURCE });
}

export async function loadPublicWebhookUrl({ env, db }) {
  return loadStored({ env, db, ...PUBLIC_WEBHOOK_URL_SOURCE });
}

export async function readPublicWebhookUrl({ env, db }) {
  return readStored({ env, db, ...PUBLIC_WEBHOOK_URL_SOURCE });
}

export async function loadShipStationApiKey({ env, db }) {
  return loadStored({ env, db, ...SHIPSTATION_API_KEY_SOURCE });
}

export async function readShipStationApiKey({ env, db }) {
  return readStored({ env, db, ...SHIPSTATION_API_KEY_SOURCE });
}

export async function loadFaireApiKey({ env, db }) {
  return loadStored({
    env,
    db,
    key: CONFIG.faireApiKey,
    envKeys: [CONFIG.faireApiKey],
    encrypted: true,
  });
}

