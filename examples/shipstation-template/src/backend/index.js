/**
 * ShipStation template Worker.
 *
 * D1 binding: SHIPSTATION_DB
 * Config: API_TOKEN_DIGIT, PUBLIC_WEBHOOK_URL, and ShipStation secrets are Digit App
 * Secrets (Worker `env` only). D1 `app_config` keeps ENCRYPTION_KEY for legacy decrypt.
 * Optional channel secrets: FAIRE_API_KEY, SHOPIFY_*, WOOCOMMERCE_* (see runtimeConfig.CHANNEL_SECRETS)
 * Digit GraphQL URL is always https://api.digit-software.com/graphql.
 */

import { AppErrorCode } from '@digit/lib-common';
import { backendPath, createHandler, err } from '@digit/lib-backend';

import { channelJobHandlers, channelWebhookHandlers } from './channels/index.js';
import { handleChannels } from './handleChannels.js';
import { handleConnection } from './connection.js';
import { handleSetup } from './setup.js';
import { handleSync } from './handleSync.js';
import { pollSync, processSsWebhook } from './jobs.js';
import { shipstationWebhook } from './webhooks.js';

export default createHandler({
  jobs: {
    'process-ss-webhook': processSsWebhook,
    'poll-outbound-push': pollSync,
    ...channelJobHandlers(),
  },
  webhooks: {
    shipstation: shipstationWebhook,
    ...channelWebhookHandlers(),
  },
  fetch: async ({ request, env }) => {
    const path = backendPath(request);
    const { method } = request;

    const setupResponse = await handleSetup({ env, path, method });
    if (setupResponse) return setupResponse;

    const channelsResponse = await handleChannels({ request, env, path, method });
    if (channelsResponse) return channelsResponse;

    const syncResponse = await handleSync({ request, env, path, method });
    if (syncResponse) return syncResponse;

    const connectionResponse = await handleConnection({ request, env, path, method });
    if (connectionResponse) return connectionResponse;

    return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
  },
});
