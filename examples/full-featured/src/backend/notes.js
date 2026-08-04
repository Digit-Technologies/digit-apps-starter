/**
 * Notes D1 CRUD for the full-featured example Worker.
 * Returns a Response when the request matches a notes route; otherwise null.
 */

import {
  AppErrorCode,
  optionalString,
  parseJsonResponse,
  requiredString,
} from '@digit/lib-common';
import { err, ok, requireEnv } from '@digit/lib-backend';

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

function parseNoteId(idPart) {
  const id = Number(idPart);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

/**
 * @returns {Promise<Response | null>}
 */
export async function handleNotes({ request, env, path, method }) {
  if (method === 'GET' && path === '/notes') {
    const db = requireEnv({ env, key: 'FULL_FEATURED_DB' });
    const { results } = await db.prepare('SELECT * FROM notes ORDER BY id DESC').all();
    return ok({ data: { notes: (results ?? []).map(toNote) } });
  }

  if (method === 'POST' && path === '/notes') {
    const db = requireEnv({ env, key: 'FULL_FEATURED_DB' });
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

  if (method === 'PUT' && path.startsWith('/notes/')) {
    const id = parseNoteId(path.slice('/notes/'.length));
    if (id === null) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'Invalid note id.',
        status: 400,
      });
    }
    const db = requireEnv({ env, key: 'FULL_FEATURED_DB' });
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

  if (method === 'DELETE' && path.startsWith('/notes/')) {
    const id = parseNoteId(path.slice('/notes/'.length));
    if (id === null) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'Invalid note id.',
        status: 400,
      });
    }
    const db = requireEnv({ env, key: 'FULL_FEATURED_DB' });
    const result = await db
      .prepare('DELETE FROM notes WHERE id = ? RETURNING id')
      .bind(id)
      .first();
    if (!result) {
      return err({ code: AppErrorCode.NOT_FOUND, message: 'Note not found.', status: 404 });
    }
    return ok({ data: { deleted: true } });
  }

  return null;
}
