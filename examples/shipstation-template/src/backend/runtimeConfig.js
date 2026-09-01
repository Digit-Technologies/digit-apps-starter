/**
 * App config stored in D1 so operators can paste secrets in the UI.
 * Env vars still win when set (optional Digit Secrets tab).
 * Do not use a DIGIT_ prefix — Digit reserves it for platform bindings.
 */

import { optionalEnv } from '@digit/lib-backend';

import {
  decryptSecret,
  encryptSecret,
  generateEncryptionKeyB64,
  parseEncryptionKey,
} from './crypto.js';

export const CONFIG = {
  encryptionKey: 'ENCRYPTION_KEY',
  apiTokenDigit: 'API_TOKEN_DIGIT',
  publicWebhookUrl: 'PUBLIC_WEBHOOK_URL',
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

async function loadStored({ env, db, key, envKeys, encrypted }) {
  for (const envKey of envKeys) {
    const fromEnv = optionalEnv({ env, key: envKey });
    if (fromEnv) return fromEnv;
  }
  const row = await configRow({ db, key });
  if (!row?.value) return null;
  if (encrypted || row.encrypted) {
    const keyBytes = await loadEncryptionKeyBytes({ env, db });
    if (!keyBytes) return null;
    try {
      return await decryptSecret({ stored: row.value, keyBytes });
    } catch {
      return null;
    }
  }
  return row.value;
}

export async function loadApiTokenDigit({ env, db }) {
  return loadStored({
    env,
    db,
    key: CONFIG.apiTokenDigit,
    envKeys: [CONFIG.apiTokenDigit, 'DIGIT_API_TOKEN'],
    encrypted: true,
  });
}

export async function loadPublicWebhookUrl({ env, db }) {
  return loadStored({
    env,
    db,
    key: CONFIG.publicWebhookUrl,
    envKeys: [CONFIG.publicWebhookUrl],
    encrypted: false,
  });
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

export async function saveApiTokenDigit({ env, db, token }) {
  const keyBytes = await ensureEncryptionKeyBytes({ env, db });
  const value = await encryptSecret({ plaintext: token, keyBytes });
  await upsertConfig({ db, key: CONFIG.apiTokenDigit, value, encrypted: true });
}

export async function savePublicWebhookUrl({ db, url }) {
  await upsertConfig({ db, key: CONFIG.publicWebhookUrl, value: url, encrypted: false });
}
