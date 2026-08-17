// note-created is the manifest-declared webhook: an external system POSTs a signed JSON
// payload to https://{app-id}.<apps domain>/webhooks/note-created and it lands here.
// ALWAYS verify before acting — the endpoint is public; the signature is the only auth.

import { requireEnv, verifyWebhookSignature } from '@digit/lib-backend';

const json = (status, data) => ({
  status,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(data),
});

export async function noteCreated({ headers, body, env }) {
  const valid = await verifyWebhookSignature({
    secret: requireEnv({ env, key: 'WEBHOOK_SECRET' }),
    body,
    signature: headers['x-webhook-signature'] ?? '',
  });
  if (!valid) {
    // Nothing untrusted proceeds past this line — return, never enqueue.
    return json(401, { error: 'invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return json(400, { error: 'body is not JSON' });
  }
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  if (!title) {
    return json(400, { error: 'title is required' });
  }

  const db = requireEnv({ env, key: 'FULL_FEATURED_DB' });
  const row = await db
    .prepare('INSERT INTO notes (title, body) VALUES (?, ?) RETURNING id')
    .bind(title, typeof payload.body === 'string' ? payload.body : '')
    .first();

  return json(201, { id: row?.id ?? null });
}
