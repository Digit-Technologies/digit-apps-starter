/**
 * ShipStation template Worker.
 *
 * D1 binding: SHIPSTATION_DB
 * Secrets/config: pasted in the app (D1 app_config). Optional env overrides:
 * API_TOKEN_DIGIT, PUBLIC_WEBHOOK_URL, APP_SECRET_ENCRYPTION_KEY, FAIRE_API_KEY
 * Digit GraphQL URL is always https://api.digit-software.com/graphql.
 */

import { AppErrorCode } from '@digit/lib-common';
import { backendPath, createHandler, err } from '@digit/lib-backend';

import { handleConnection } from './connection.js';
import { handleSetup } from './setup.js';
import { handleSync } from './handleSync.js';
import { pollSync, processSsWebhook } from './jobs.js';
import { shipstationWebhook } from './webhooks.js';

export default createHandler({
  jobs: {
    'process-ss-webhook': processSsWebhook,
    'poll-outbound-push': pollSync,
  },
  webhooks: {
    shipstation: shipstationWebhook,
  },
  fetch: async ({ request, env }) => {
    const path = backendPath(request);
    const { method } = request;

    const setupResponse = await handleSetup({ env, path, method, request });
    if (setupResponse) return setupResponse;

    const syncResponse = await handleSync({ request, env, path, method });
    if (syncResponse) return syncResponse;

    const connectionResponse = await handleConnection({ request, env, path, method });
    if (connectionResponse) return connectionResponse;

    return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
  },
});
