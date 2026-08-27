/** Inbound ShipStation webhook stub — deliveries are public; later FRs add verify + work.
 * Do not log `body` (may include tracking or address data). */

export async function shipstationWebhook() {
  return { status: 200, headers: { 'content-type': 'text/plain' }, body: 'ok' };
}
