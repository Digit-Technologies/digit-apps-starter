import { AppErrorCode } from '@digit/lib-common';
import { HandlerError, requireEnv } from '@digit/lib-backend';

import { pollInbound, pollOutboundPush, processWebhookJob } from './sync.js';

export async function processSsWebhook({ payload, env }) {
  return processWebhookJob({ env, payload });
}

export async function pollSync({ env }) {
  const db = requireEnv({ env, key: 'SHIPSTATION_DB' });
  const outbound = await pollOutboundPush({ env, db });
  const inbound = await pollInbound({ env, db });
  return { ...outbound, ...inbound };
}

export function jobsUnavailable(error) {
  return error instanceof HandlerError && error.code === AppErrorCode.MISSING_CONFIG;
}
