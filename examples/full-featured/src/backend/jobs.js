// prune-notes is the manifest schedule (hourly); note-stats is submitted on demand by the
// /jobs/note-stats route.

import { requireEnv } from '@digit/lib-backend';

export async function pruneNotes({ payload, env }) {
  const db = requireEnv({ env, key: 'FULL_FEATURED_DB' });
  const maxAgeDays = Number(payload?.maxAgeDays) || 30;
  const result = await db
    .prepare(`DELETE FROM notes WHERE created_at < datetime('now', ?) RETURNING id`)
    .bind(`-${maxAgeDays} days`)
    .all();
  return { deleted: result.results?.length ?? 0, maxAgeDays };
}

export async function noteStats({ env }) {
  const db = requireEnv({ env, key: 'FULL_FEATURED_DB' });
  const row = await db
    .prepare(
      'SELECT COUNT(*) AS count, MAX(updated_at) AS lastUpdatedAt, AVG(LENGTH(body)) AS avgBodyLength FROM notes',
    )
    .first();
  return {
    noteCount: row?.count ?? 0,
    lastUpdatedAt: row?.lastUpdatedAt ?? null,
    avgBodyLength: row?.avgBodyLength == null ? null : Math.round(row.avgBodyLength),
  };
}
