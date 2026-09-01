/**
 * Post-writeback channel adapters. Default is a no-op: Digit Rutter
 * pushFulfillments covers Shopify/etc. Enable Faire with FAIRE_API_KEY.
 */

import { notifyFaire } from './faire.js';

export async function afterDigitShipped({ env, order, shipment }) {
  await notifyFaire({ env, order, shipment });
}
