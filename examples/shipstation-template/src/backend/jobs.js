import { AppErrorCode } from '@digit/lib-common';
import { HandlerError, requireEnv } from '@digit/lib-backend';

import { pollOutboundPush, pollPendingLabels } from './sync.js';

export async function pollSync({ env }) {
  const db = requireEnv({ env, key: 'SHIPSTATION_DB' });
  const outbound = await pollOutboundPush({ env, db, source: 'schedule' });
  const labels = await pollPendingLabels({ env, db });
  return { ...outbound, ...labels };
}

export function jobsUnavailable(error) {
  return error instanceof HandlerError && error.code === AppErrorCode.MISSING_CONFIG;
}
