import { AppErrorCode, parseJsonResponse, requiredString } from '@digit/lib-common';
import { err, ok, requireEnv } from '@digit/lib-backend';

import { appendActivity, listActivity } from './activity.js';
import {
  completeShipmentWriteback,
  liveConnection,
  mapsForShipments,
  pendingShipmentWritebacks,
  pollPendingLabels,
  pushShipment,
  downloadPackingSlip,
  downloadShipmentLabel,
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
      ssLabelId: result.data?.ssLabelId ?? null,
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
    ssLabelId: null,
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

  if (method === 'POST' && path === '/sync/label') {
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
    const shipmentIdResult = requiredString({ obj: parsed.value, key: 'shipmentId' });
    if (!shipmentIdResult.ok) {
      return err({
        code: shipmentIdResult.error.code,
        message: shipmentIdResult.error.message,
        status: 400,
      });
    }
    const organizationId = organizationIdResult.value;
    const shipmentId = shipmentIdResult.value;
    const result = await downloadShipmentLabel({ env, db, organizationId, shipmentId });
    if (!result.ok) {
      await appendActivity({
        db,
        organizationId,
        actor: 'user',
        action: 'label_download',
        status: 'error',
        message: result.message || 'Label download failed.',
        digitOrderId: null,
        ssShipmentId: null,
        detail: { code: result.code ?? null },
      });
      return err({
        code: result.code || AppErrorCode.UPSTREAM_ERROR,
        message: result.message || 'Label download failed.',
        status: result.status || 502,
      });
    }
    await appendActivity({
      db,
      organizationId,
      actor: 'user',
      action: 'label_download',
      status: 'success',
      message: 'Downloaded a shipping label from the queue.',
    });
    return ok({ data: result.data });
  }

  if (method === 'POST' && path === '/sync/packing-slip') {
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
    const orderIdResult = requiredString({ obj: parsed.value, key: 'orderId' });
    if (!orderIdResult.ok) {
      return err({
        code: orderIdResult.error.code,
        message: orderIdResult.error.message,
        status: 400,
      });
    }
    const organizationId = organizationIdResult.value;
    const result = await downloadPackingSlip({
      env,
      db,
      organizationId,
      orderId: orderIdResult.value,
    });
    if (!result.ok) {
      await appendActivity({
        db,
        organizationId,
        actor: 'user',
        action: 'packing_slip_download',
        status: 'error',
        message: result.message || 'Packing slip download failed.',
        digitOrderId: orderIdResult.value,
        detail: { code: result.code ?? null },
      });
      return err({
        code: result.code || AppErrorCode.UPSTREAM_ERROR,
        message: result.message || 'Packing slip download failed.',
        status: result.status || 502,
      });
    }
    await appendActivity({
      db,
      organizationId,
      actor: 'user',
      action: 'packing_slip_download',
      status: 'success',
      message: 'Downloaded a Digit packing slip from the queue.',
      digitOrderId: orderIdResult.value,
    });
    return ok({ data: result.data });
  }

  if (method === 'POST' && path === '/sync/poll') {
    let organizationId = null;
    const parsed = await parseJsonResponse({ value: request.json() });
    if (parsed.ok) {
      const value = String(parsed.value?.organizationId || '').trim();
      if (value) organizationId = value;
    }
    const labels = await pollPendingLabels({
      env,
      db,
      organizationId,
      actor: organizationId ? 'user' : 'schedule',
    });
    const pendingWritebacks = organizationId
      ? await pendingShipmentWritebacks({ env, db, organizationId })
      : [];
    if (organizationId) {
      const pulled = Number(labels.labelsPulled || 0);
      const candidates = Number(labels.labelCandidates || 0);
      await appendActivity({
        db,
        organizationId,
        actor: 'user',
        action: 'poll',
        status: 'success',
        message:
          pulled > 0
            ? `Pull from ShipStation pulled ${pulled} label(s).`
            : `Pull from ShipStation checked ${candidates} pushed shipment(s) and found no new ShipStation labels. Buy the label in ShipStation, then try again.`,
      });
    }
    return ok({ data: { ...labels, pendingWritebacks } });
  }

  if (method === 'POST' && path === '/sync/writeback-complete') {
    const parsed = await parseJsonResponse({ value: request.json() });
    if (!parsed.ok) return parsed.response;
    const organizationId = String(parsed.value?.organizationId || '').trim();
    const digitShipmentId = String(parsed.value?.digitShipmentId || '').trim();
    if (!organizationId || !digitShipmentId) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'organizationId and digitShipmentId are required.',
        status: 400,
      });
    }
    const result = await completeShipmentWriteback({ env, db, organizationId, digitShipmentId });
    if (!result.ok) return err(result);
    return ok({ data: result.data });
  }

  return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
}
