/**
 * ShipStation template Worker.
 *
 * D1 binding: SHIPSTATION_DB
 * Secret: APP_SECRET_ENCRYPTION_KEY (base64 32-byte AES key)
 * Optional env: PUBLIC_WEBHOOK_URL (this app's /webhooks/shipstation URL)
 */

import { AppErrorCode } from '@digit/lib-common';
import { backendPath, createHandler, err } from '@digit/lib-backend';

import { handleConnection } from './connection.js';
import { handleSetup } from './setup.js';
import { shipstationWebhook } from './webhooks.js';

export default createHandler({
  webhooks: {
    shipstation: shipstationWebhook,
  },
  fetch: async ({ request, env }) => {
    const path = backendPath(request);
    const { method } = request;

    const setupResponse = await handleSetup({ env, path, method });
    if (setupResponse) return setupResponse;

    const connectionResponse = await handleConnection({ request, env, path, method });
    if (connectionResponse) return connectionResponse;

    return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
  },
});
