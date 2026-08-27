/** Inbound ShipStation webhook stub — deliveries are public; later FRs add verify + work. */

export async function shipstationWebhook() {
  return { status: 200, headers: { 'content-type': 'text/plain' }, body: 'ok' };
}
