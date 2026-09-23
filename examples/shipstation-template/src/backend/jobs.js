import { AppErrorCode } from '@digit/lib-common';
import { HandlerError, requireEnv } from '@digit/lib-backend';

import { pruneActivityLog } from './activity.js';
import { pollOutboundPush, pollPendingLabels } from './sync.js';

export async function pollSync({ env }) {
  const db = requireEnv({ env, key: 'SHIPSTATION_DB' });
  const outbound = await pollOutboundPush({ env, db, source: 'schedule' });
  const labels = await pollPendingLabels({ env, db });
  return { ...outbound, ...labels };
}

export async function pruneActivity({ env }) {
  const db = requireEnv({ env, key: 'SHIPSTATION_DB' });
  return pruneActivityLog({ db, now: new Date() });
}

export function jobsUnavailable(error) {
  return error instanceof HandlerError && error.code === AppErrorCode.MISSING_CONFIG;
}
