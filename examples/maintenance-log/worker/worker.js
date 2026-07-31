/**
 * Cloudflare Worker for the Maintenance Log app.
 *
 * Persists weekly machine maintenance records in D1 (binding: MAINTENANCE_LOG_DB,
 * see public/manifest.json and worker/migrations/0001_init.sql).
 *
 * Routes (mounted under /proxy/backend/ by the Digit harness):
 *   GET    /records       -> list all records, newest first
 *   POST   /records       -> create a record
 *   PUT    /records/:id   -> update a record
 *   DELETE /records/:id   -> delete a record
 */

function jsonResponse(data, init) {
  return Response.json(data, init);
}

function toRecord(row) {
  return {
    id: row.id,
    machineName: row.machine_name,
    serialNumber: row.serial_number,
    scheduled: Boolean(row.scheduled),
    lastInspectionDate: row.last_inspection_date,
    performedBy: row.performed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validatePayload(body) {
  if (!body || typeof body !== 'object') return 'Request body must be a JSON object.';
  if (typeof body.machineName !== 'string' || !body.machineName.trim()) {
    return 'machineName is required.';
  }
  if (typeof body.serialNumber !== 'string' || !body.serialNumber.trim()) {
    return 'serialNumber is required.';
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    // Strip a leading "proxy/backend" prefix if present, so this Worker works
    // whether it's invoked at the root or via the full proxy path.
    while (parts.length && (parts[0] === 'proxy' || parts[0] === 'backend')) {
      parts.shift();
    }

    const [resource, idPart] = parts;
    const db = env.MAINTENANCE_LOG_DB;

    if (!db) {
      return jsonResponse(
        { ok: false, error: 'D1 binding MAINTENANCE_LOG_DB is not configured on this app.' },
        { status: 500 },
      );
    }

    if (resource !== 'records') {
      return new Response('Not found', { status: 404 });
    }

    try {
      if (request.method === 'GET' && !idPart) {
        const { results } = await db
          .prepare('SELECT * FROM maintenance_records ORDER BY id DESC')
          .all();
        return jsonResponse({ ok: true, records: results.map(toRecord) });
      }

      if (request.method === 'POST' && !idPart) {
        const body = await request.json().catch(() => null);
        const error = validatePayload(body);
        if (error) return jsonResponse({ ok: false, error }, { status: 400 });

        const result = await db
          .prepare(
            `INSERT INTO maintenance_records
              (machine_name, serial_number, scheduled, last_inspection_date, performed_by, updated_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          )
          .bind(
            body.machineName.trim(),
            body.serialNumber.trim(),
            body.scheduled ? 1 : 0,
            body.lastInspectionDate || null,
            body.performedBy || null,
          )
          .run();

        const row = await db
          .prepare('SELECT * FROM maintenance_records WHERE id = ?')
          .bind(result.meta.last_row_id)
          .first();
        return jsonResponse({ ok: true, record: toRecord(row) }, { status: 201 });
      }

      if (request.method === 'PUT' && idPart) {
        const id = Number(idPart);
        if (!Number.isInteger(id)) {
          return jsonResponse({ ok: false, error: 'Invalid record id.' }, { status: 400 });
        }
        const body = await request.json().catch(() => null);
        const error = validatePayload(body);
        if (error) return jsonResponse({ ok: false, error }, { status: 400 });

        const existing = await db
          .prepare('SELECT * FROM maintenance_records WHERE id = ?')
          .bind(id)
          .first();
        if (!existing) {
          return jsonResponse({ ok: false, error: 'Record not found.' }, { status: 404 });
        }

        await db
          .prepare(
            `UPDATE maintenance_records
             SET machine_name = ?, serial_number = ?, scheduled = ?, last_inspection_date = ?,
                 performed_by = ?, updated_at = datetime('now')
             WHERE id = ?`,
          )
          .bind(
            body.machineName.trim(),
            body.serialNumber.trim(),
            body.scheduled ? 1 : 0,
            body.lastInspectionDate || null,
            body.performedBy || null,
            id,
          )
          .run();

        const row = await db
          .prepare('SELECT * FROM maintenance_records WHERE id = ?')
          .bind(id)
          .first();
        return jsonResponse({ ok: true, record: toRecord(row) });
      }

      if (request.method === 'DELETE' && idPart) {
        const id = Number(idPart);
        if (!Number.isInteger(id)) {
          return jsonResponse({ ok: false, error: 'Invalid record id.' }, { status: 400 });
        }
        await db.prepare('DELETE FROM maintenance_records WHERE id = ?').bind(id).run();
        return jsonResponse({ ok: true });
      }

      return new Response('Not found', { status: 404 });
    } catch (err) {
      return jsonResponse(
        { ok: false, error: err instanceof Error ? err.message : 'Unexpected error.' },
        { status: 500 },
      );
    }
  },
};
