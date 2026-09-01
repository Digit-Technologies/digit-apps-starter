/**
 * Shared webhook verification helpers.
 * ShipStation V2 RSA lives in webhooks/shipstation.js — not HMAC.
 */

export { verifyWebhookSignature } from '@digit/lib-backend';
