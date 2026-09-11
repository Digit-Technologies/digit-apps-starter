import { AppErrorCode, parseJsonResponse, requiredString } from '@digit/lib-common';
import { err, ok, requireEnv } from '@digit/lib-backend';

import { listActivity } from './activity.js';
import {
  liveConnection,
  mapsForShipments,
  pollInbound,
  pollOutboundPush,
  pushShipment,
} from './sync.js';

function requireOrganizationId(url) {
  const organizationId = (url.searchParams.get('organizationId') || '').trim();
  if (!organizationId) {
    return {
      error: err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'organizationId is required.',
        status: 400,
      }),
    };
  }
  return { organizationId };
}

function pushResultRow(shipmentId, result) {
  if (result.ok) {
    return {
      shipmentId,
      orderId: result.data?.orderId ?? null,
      ok: true,
      skipped: Boolean(result.data?.skipped),
      ssShipmentId: result.data?.ssShipmentId ?? null,
      message: result.data?.message ?? result.data?.reason ?? null,
      meaning: result.data?.meaning ?? result.data?.reason ?? null,
    };
  }
  const message = result.message || 'Push failed.';
  return {
    shipmentId,
    orderId: null,
    ok: false,
    skipped: false,
    ssShipmentId: null,
    message,
    meaning: `${message} The shipment was not created in ShipStation. Fix the error and try again.`,
  };
}

export async function handleSync({ request, env, path, method }) {
  if (!path.startsWith('/sync')) return null;
  const db = requireEnv({ env, key: 'SHIPSTATION_DB' });
  const url = new URL(request.url);

  if (method === 'GET' && path === '/sync/shipments') {
    const org = requireOrganizationId(url);
    if (org.error) return org.error;
    const row = await liveConnection({ db, organizationId: org.organizationId });
    if (!row) {
      return ok({ data: { maps: [] } });
    }
    const ids = (url.searchParams.get('shipmentIds') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 100);
    const maps = await mapsForShipments({ db, connectionId: row.id, shipmentIds: ids });
    return ok({ data: { maps } });
  }

  if (method === 'GET' && path === '/sync/activity') {
    const org = requireOrganizationId(url);
    if (org.error) return org.error;
    const events = await listActivity({ db, organizationId: org.organizationId });
    return ok({ data: { events } });
  }

  if (method === 'POST' && path === '/sync/push') {
    const parsed = await parseJsonResponse({ value: request.json() });
    if (!parsed.ok) {
      return err({ code: parsed.error.code, message: parsed.error.message, status: 400 });
    }
    const organizationIdResult = requiredString({ obj: parsed.value, key: 'organizationId' });
    if (!organizationIdResult.ok) {
      return err({
        code: organizationIdResult.error.code,
        message: organizationIdResult.error.message,
        status: 400,
      });
    }
    const organizationId = organizationIdResult.value;
    const shipmentIds = Array.isArray(parsed.value.shipmentIds)
      ? parsed.value.shipmentIds.map(String).filter(Boolean).slice(0, 25)
      : [];
    if (shipmentIds.length === 0) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'shipmentIds must be a non-empty array.',
        status: 400,
      });
    }
    const results = [];
    for (const shipmentId of shipmentIds) {
      const result = await pushShipment({
        env,
        db,
        organizationId,
        shipmentId,
        actor: 'user',
        recordActivity: true,
      });
      results.push(pushResultRow(shipmentId, result));
    }
    const summary = {
      pushed: results.filter((row) => row.ok && !row.skipped).length,
      skipped: results.filter((row) => row.ok && row.skipped).length,
      failed: results.filter((row) => !row.ok).length,
    };
    return ok({ data: { results, summary } });
  }

  if (method === 'POST' && path === '/sync/poll') {
    const outbound = await pollOutboundPush({ env, db });
    const inbound = await pollInbound({ env, db });
    return ok({ data: { ...outbound, ...inbound } });
  }

  return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
}
