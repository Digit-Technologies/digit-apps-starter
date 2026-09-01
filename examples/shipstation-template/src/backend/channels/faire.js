/**
 * Optional Faire shipment writeback. Off unless FAIRE_API_KEY is set.
 * Look up the current Faire order-shipment endpoint before filling this in.
 */

import { loadFaireApiKey, shipstationDb } from '../runtimeConfig.js';

export async function notifyFaire({ env, order, shipment }) {
  const apiKey = await loadFaireApiKey({ env, db: shipstationDb({ env }) });
  if (!apiKey) return { skipped: true };
  void order;
  void shipment;
  // Customer clone: POST Faire order shipment using tracking on `shipment`.
  return { skipped: true, reason: 'Faire client is a recipe — implement in a clone.' };
}
