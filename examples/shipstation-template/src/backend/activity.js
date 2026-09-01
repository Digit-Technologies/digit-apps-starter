const MESSAGE_MAX = 500;
const DETAIL_MAX = 2000;
const LIST_LIMIT = 100;

export function truncateMessage(text, max = MESSAGE_MAX) {
  const value = String(text ?? '').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function stringifyDetail(detail) {
  if (detail == null) return null;
  let raw;
  try {
    raw = typeof detail === 'string' ? detail : JSON.stringify(detail);
  } catch {
    return null;
  }
  return truncateMessage(raw, DETAIL_MAX);
}

export async function appendActivity({
  db,
  organizationId,
  actor,
  action,
  status,
  message,
  digitOrderId = null,
  ssShipmentId = null,
  channelId = null,
  externalOrderId = null,
  detail = null,
}) {
  if (!organizationId) return;
  await db
    .prepare(
      `INSERT INTO activity_log
         (organization_id, actor, action, digit_order_id, ss_shipment_id, channel_id, external_order_id, status, message, detail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      organizationId,
      actor,
      action,
      digitOrderId,
      ssShipmentId,
      channelId,
      externalOrderId,
      status,
      truncateMessage(message) || 'No message.',
      stringifyDetail(detail),
    )
    .run();
}

export function publicActivityRow(row) {
  let detail = null;
  if (row.detail) {
    try {
      detail = JSON.parse(row.detail);
    } catch {
      detail = row.detail;
    }
  }
  return {
    id: row.id,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    actor: row.actor,
    action: row.action,
    digitOrderId: row.digit_order_id,
    ssShipmentId: row.ss_shipment_id,
    channelId: row.channel_id ?? null,
    externalOrderId: row.external_order_id ?? null,
    status: row.status,
    message: row.message,
    detail,
  };
}

export async function listActivity({ db, organizationId, limit = LIST_LIMIT }) {
  const { results } = await db
    .prepare(
      `SELECT id, organization_id, created_at, actor, action, digit_order_id, ss_shipment_id,
              channel_id, external_order_id, status, message, detail
       FROM activity_log
       WHERE organization_id = ?
       ORDER BY id DESC
       LIMIT ?`,
    )
    .bind(organizationId, Math.min(Math.max(Number(limit) || LIST_LIMIT, 1), LIST_LIMIT))
    .all();
  return (results ?? []).map(publicActivityRow);
}
