/**
 * Full Featured example Worker.
 *
 * Env (Digit app settings):
 *   WELCOME_MESSAGE       — Config tab
 *   API_BASE_URL          — Secrets tab (e.g. https://httpbin.org)
 *   THIRD_PARTY_API_KEY   — Secrets tab (secret; never returned to the UI)
 *
 * D1 binding: FULL_FEATURED_DB (see public/manifest.json + migrations/)
 */

import {
  AppErrorCode,
  createHandler,
  err,
  ok,
  optionalString,
  parseJsonResponse,
  requireEnv,
  requiredString,
} from '@digit/app-backend';

function toNote(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const noteFields = {
  title: (obj) => requiredString({ obj, key: 'title' }),
  body: (obj) => optionalString({ obj, key: 'body', default: '' }),
};

async function handleNotes({ request, env, idPart }) {
  const db = requireEnv({ env, key: 'FULL_FEATURED_DB' });

  if (request.method === 'GET' && !idPart) {
    const { results } = await db.prepare('SELECT * FROM notes ORDER BY id DESC').all();
    return ok({ data: { notes: (results ?? []).map(toNote) } });
  }

  if (request.method === 'POST' && !idPart) {
    const parsed = await parseJsonResponse({ value: request.json(), fields: noteFields });
    if (!parsed.ok) {
      return err({
        code: parsed.error.code,
        message: parsed.error.message,
        status: 400,
      });
    }
    const note = parsed.value;
    const result = await db
      .prepare('INSERT INTO notes (title, body) VALUES (?, ?) RETURNING *')
      .bind(note.title, note.body)
      .first();
    return ok({ data: { note: toNote(result) }, status: 201 });
  }

  const id = Number(idPart);
  if (!Number.isInteger(id) || id < 1) {
    return err({ code: AppErrorCode.VALIDATION_ERROR, message: 'Invalid note id.', status: 400 });
  }

  if (request.method === 'PUT') {
    const parsed = await parseJsonResponse({ value: request.json(), fields: noteFields });
    if (!parsed.ok) {
      return err({
        code: parsed.error.code,
        message: parsed.error.message,
        status: 400,
      });
    }
    const note = parsed.value;
    const result = await db
      .prepare(
        `UPDATE notes
         SET title = ?, body = ?, updated_at = datetime('now')
         WHERE id = ?
         RETURNING *`,
      )
      .bind(note.title, note.body, id)
      .first();

    if (!result) {
      return err({ code: AppErrorCode.NOT_FOUND, message: 'Note not found.', status: 404 });
    }
    return ok({ data: { note: toNote(result) } });
  }

  if (request.method === 'DELETE') {
    const result = await db
      .prepare('DELETE FROM notes WHERE id = ? RETURNING id')
      .bind(id)
      .first();
    if (!result) {
      return err({ code: AppErrorCode.NOT_FOUND, message: 'Note not found.', status: 404 });
    }
    return ok({ data: { deleted: true } });
  }

  return err({ code: AppErrorCode.VALIDATION_ERROR, message: 'Method not allowed.', status: 405 });
}

export default createHandler({
  fetch: async ({ request, env }) => {
    const url = new URL(request.url);
    const [, resource, idPart] = url.pathname.replace(/^\/proxy\/backend/, '').split('/');

    if (resource === 'greeting' && request.method === 'GET') {
      return ok({
        data: { message: requireEnv({ env, key: 'WELCOME_MESSAGE' }) },
      });
    }

    if (resource === 'weather' && request.method === 'GET') {
      const latitude = url.searchParams.get('lat') || '40.7128';
      const longitude = url.searchParams.get('lon') || '-74.006';
      const weatherUrl =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${encodeURIComponent(latitude)}` +
        `&longitude=${encodeURIComponent(longitude)}` +
        `&current=temperature_2m,weather_code` +
        `&temperature_unit=fahrenheit`;

      const response = await fetch(weatherUrl);
      if (!response.ok) {
        return err({
          code: AppErrorCode.UPSTREAM_ERROR,
          message: `Weather upstream failed (HTTP ${response.status}).`,
          status: 502,
        });
      }
      const data = await response.json();
      const current = data?.current ?? {};
      return ok({
        data: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          temperatureF: current.temperature_2m ?? null,
          weatherCode: current.weather_code ?? null,
          observedAt: current.time ?? null,
        },
      });
    }

    if (resource === 'external-status' && request.method === 'GET') {
      const apiBase = requireEnv({ env, key: 'API_BASE_URL' });
      const apiKey = requireEnv({ env, key: 'THIRD_PARTY_API_KEY' });
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/bearer`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!response.ok) {
        return err({
          code: AppErrorCode.UPSTREAM_ERROR,
          message: `Upstream request failed (HTTP ${response.status}).`,
          status: 502,
        });
      }
      const data = await response.json();

      return ok({
        data: {
          authenticated: Boolean(data?.authenticated),
          // Never return the secret — only a short prefix for the demo UI.
          tokenPrefix: apiKey.length > 0 ? `${apiKey.slice(0, 2)}…` : null,
        },
      });
    }

    if (resource === 'notes') {
      return handleNotes({ request, env, idPart });
    }

    if (resource === 'error' && idPart === 'demo' && request.method === 'POST') {
      const body = await parseJsonResponse({ value: request.json() });
      if (!body.ok) {
        return err({ code: body.error.code, message: body.error.message, status: 400 });
      }
      if (body.value.kind === 'validation') {
        return err({
          code: AppErrorCode.VALIDATION_ERROR,
          message: 'Demo validation failure.',
          status: 400,
        });
      }
      if (body.value.kind === 'server') {
        return err({
          code: AppErrorCode.SERVER_ERROR,
          message: 'Demo server failure.',
          status: 500,
        });
      }
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'Body must include kind: "validation" | "server".',
        status: 400,
      });
    }

    return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
  },
});
