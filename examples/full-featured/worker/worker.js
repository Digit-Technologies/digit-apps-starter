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
  assertExists,
  fail,
  fetchJson,
  ok,
  optionalString,
  orFail,
  parseObject,
  pathSegments,
  readJsonObject,
  requireEnv,
  requiredString,
  toErrorResponse,
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

function parseNote(body) {
  return parseObject(body, {
    title: (obj) => requiredString(obj, 'title'),
    body: (obj) => optionalString(obj, 'body', { default: '' }),
  });
}

async function handleNotes(request, env, idPart) {
  const db = assertExists({ env, variant: 'database', key: 'FULL_FEATURED_DB' });

  if (request.method === 'GET' && !idPart) {
    const { results } = await db.prepare('SELECT * FROM notes ORDER BY id DESC').all();
    return ok({ notes: (results ?? []).map(toNote) });
  }

  if (request.method === 'POST' && !idPart) {
    const note = orFail(parseNote(await readJsonObject(request)));
    const result = await db
      .prepare('INSERT INTO notes (title, body) VALUES (?, ?) RETURNING *')
      .bind(note.title, note.body)
      .first();
    return ok({ note: toNote(result) }, { status: 201 });
  }

  const id = Number(idPart);
  if (!Number.isInteger(id) || id < 1) {
    return fail(AppErrorCode.VALIDATION_ERROR, 'Invalid note id.', 400);
  }

  if (request.method === 'PUT') {
    const note = orFail(parseNote(await readJsonObject(request)));
    const result = await db
      .prepare(
        `UPDATE notes
         SET title = ?, body = ?, updated_at = datetime('now')
         WHERE id = ?
         RETURNING *`,
      )
      .bind(note.title, note.body, id)
      .first();

    if (!result) return fail(AppErrorCode.NOT_FOUND, 'Note not found.', 404);
    return ok({ note: toNote(result) });
  }

  if (request.method === 'DELETE') {
    const result = await db
      .prepare('DELETE FROM notes WHERE id = ? RETURNING id')
      .bind(id)
      .first();
    if (!result) return fail(AppErrorCode.NOT_FOUND, 'Note not found.', 404);
    return ok({ deleted: true });
  }

  return fail(AppErrorCode.VALIDATION_ERROR, 'Method not allowed.', 405);
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const [resource, idPart] = pathSegments(url.pathname);

      if (resource === 'greeting' && request.method === 'GET') {
        return ok({ message: requireEnv(env, 'WELCOME_MESSAGE') });
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

        const data = await fetchJson(weatherUrl);
        const current = data?.current ?? {};
        return ok({
          latitude: Number(latitude),
          longitude: Number(longitude),
          temperatureF: current.temperature_2m ?? null,
          weatherCode: current.weather_code ?? null,
          observedAt: current.time ?? null,
        });
      }

      if (resource === 'external-status' && request.method === 'GET') {
        const apiBase = requireEnv(env, 'API_BASE_URL');
        const apiKey = requireEnv(env, 'THIRD_PARTY_API_KEY');
        const data = await fetchJson(`${apiBase.replace(/\/$/, '')}/bearer`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        return ok({
          authenticated: Boolean(data?.authenticated),
          tokenPrefix: apiKey.length > 0 ? `${apiKey.slice(0, 2)}…` : null,
        });
      }

      if (resource === 'notes') {
        return handleNotes(request, env, idPart);
      }

      if (resource === 'error' && idPart === 'demo' && request.method === 'POST') {
        const body = await readJsonObject(request);
        if (body.kind === 'validation') {
          return fail(AppErrorCode.VALIDATION_ERROR, 'Demo validation failure.', 400);
        }
        if (body.kind === 'server') {
          return fail(AppErrorCode.SERVER_ERROR, 'Demo server failure.', 500);
        }
        return fail(
          AppErrorCode.VALIDATION_ERROR,
          'Body must include kind: "validation" | "server".',
          400,
        );
      }

      return fail(AppErrorCode.NOT_FOUND, 'Not found.', 404);
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
