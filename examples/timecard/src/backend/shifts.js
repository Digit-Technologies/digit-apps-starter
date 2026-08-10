/**
 * Shift (clock in / clock out) D1 routes for the Timecard Worker.
 * Returns a Response when the request matches a shifts route; otherwise null.
 *
 * Shifts are keyed by `user_id` (Digit `currentUser.id`), so a refresh never loses
 * an open clock-in and one user never sees another user's shifts.
 */

import { AppErrorCode, parseJsonResponse, requiredString } from '@digit/lib-common';
import { err, ok, requireEnv } from '@digit/lib-backend';

const PAGE_SIZE = 10;

function toShift(row) {
  return {
    id: row.id,
    userId: row.user_id,
    clockInTime: row.clock_in_time,
    clockOutTime: row.clock_out_time,
    durationSeconds: row.duration_seconds,
  };
}

function parsePage(url) {
  const raw = url.searchParams.get('page');
  const page = Number(raw);
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}

const userIdFields = {
  userId: (obj) => requiredString({ obj, key: 'userId' }),
};

/**
 * @returns {Promise<Response | null>}
 */
export async function handleShifts({ request, env, path, method }) {
  const db = requireEnv({ env, key: 'TIMECARD_DB' });
  const url = new URL(request.url);

  // GET /status?userId=..&dayStart=ISO&dayEnd=ISO
  // Active shift (regardless of when it started) + total completed seconds for the
  // device-local "today" window supplied by the frontend.
  if (method === 'GET' && path === '/status') {
    const userId = url.searchParams.get('userId') || '';
    if (!userId) {
      return err({ code: AppErrorCode.VALIDATION_ERROR, message: 'userId is required.', status: 400 });
    }
    const dayStart = url.searchParams.get('dayStart') || '';
    const dayEnd = url.searchParams.get('dayEnd') || '';
    if (!dayStart || !dayEnd) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'dayStart and dayEnd are required.',
        status: 400,
      });
    }

    const activeRow = await db
      .prepare(
        `SELECT * FROM shifts WHERE user_id = ? AND clock_out_time IS NULL
         ORDER BY id DESC LIMIT 1`,
      )
      .bind(userId)
      .first();

    const totalsRow = await db
      .prepare(
        `SELECT COALESCE(SUM(duration_seconds), 0) AS total
         FROM shifts
         WHERE user_id = ?
           AND clock_out_time IS NOT NULL
           AND clock_in_time >= ?
           AND clock_in_time < ?`,
      )
      .bind(userId, dayStart, dayEnd)
      .first();

    return ok({
      data: {
        activeShift: activeRow ? toShift(activeRow) : null,
        completedSecondsToday: Number(totalsRow?.total ?? 0),
      },
    });
  }

  // GET /shifts?userId=..&page=1 — most recent first, PAGE_SIZE per page.
  if (method === 'GET' && path === '/shifts') {
    const userId = url.searchParams.get('userId') || '';
    if (!userId) {
      return err({ code: AppErrorCode.VALIDATION_ERROR, message: 'userId is required.', status: 400 });
    }
    const page = parsePage(url);
    const offset = (page - 1) * PAGE_SIZE;

    const countRow = await db
      .prepare('SELECT COUNT(*) AS count FROM shifts WHERE user_id = ?')
      .bind(userId)
      .first();
    const totalCount = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const { results } = await db
      .prepare(
        `SELECT * FROM shifts WHERE user_id = ?
         ORDER BY clock_in_time DESC, id DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(userId, PAGE_SIZE, offset)
      .all();

    return ok({
      data: {
        shifts: (results ?? []).map(toShift),
        page,
        pageSize: PAGE_SIZE,
        totalCount,
        totalPages,
      },
    });
  }

  // POST /clock-in { userId }
  if (method === 'POST' && path === '/clock-in') {
    const parsed = await parseJsonResponse({ value: request.json(), fields: userIdFields });
    if (!parsed.ok) {
      return err({ code: parsed.error.code, message: parsed.error.message, status: 400 });
    }
    const { userId } = parsed.value;

    const existing = await db
      .prepare(
        `SELECT * FROM shifts WHERE user_id = ? AND clock_out_time IS NULL
         ORDER BY id DESC LIMIT 1`,
      )
      .bind(userId)
      .first();
    if (existing) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'Already clocked in.',
        status: 409,
      });
    }

    const now = new Date().toISOString();
    const result = await db
      .prepare(
        `INSERT INTO shifts (user_id, clock_in_time) VALUES (?, ?) RETURNING *`,
      )
      .bind(userId, now)
      .first();
    return ok({ data: { shift: toShift(result) }, status: 201 });
  }

  // POST /clock-out { userId }
  if (method === 'POST' && path === '/clock-out') {
    const parsed = await parseJsonResponse({ value: request.json(), fields: userIdFields });
    if (!parsed.ok) {
      return err({ code: parsed.error.code, message: parsed.error.message, status: 400 });
    }
    const { userId } = parsed.value;

    const open = await db
      .prepare(
        `SELECT * FROM shifts WHERE user_id = ? AND clock_out_time IS NULL
         ORDER BY id DESC LIMIT 1`,
      )
      .bind(userId)
      .first();
    if (!open) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'Not clocked in.',
        status: 409,
      });
    }

    const now = new Date().toISOString();
    const durationSeconds = Math.max(
      0,
      Math.round((new Date(now).getTime() - new Date(open.clock_in_time).getTime()) / 1000),
    );

    const result = await db
      .prepare(
        `UPDATE shifts
         SET clock_out_time = ?, duration_seconds = ?, updated_at = datetime('now')
         WHERE id = ?
         RETURNING *`,
      )
      .bind(now, durationSeconds, open.id)
      .first();
    return ok({ data: { shift: toShift(result) } });
  }

  return null;
}
