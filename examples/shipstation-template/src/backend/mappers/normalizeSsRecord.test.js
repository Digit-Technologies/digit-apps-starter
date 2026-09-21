import assert from 'node:assert/strict';
import test from 'node:test';

import { shippingFeesInput, summedShippingFees } from './normalizeSsRecord.js';

test('shippingFeesInput uppercases ShipStation currency for Digit CostInput', () => {
  assert.deepEqual(shippingFeesInput({ amount: 177.34, currency: 'usd' }), {
    currencyCode: 'USD',
    costAmount: 177.34,
  });
});

test('shippingFeesInput rejects missing amounts', () => {
  assert.equal(shippingFeesInput({ amount: null, currency: 'usd' }), null);
  assert.equal(shippingFeesInput({ amount: -1, currency: 'usd' }), null);
});

test('summedShippingFees totals postage for one Digit order', () => {
  assert.deepEqual(
    summedShippingFees([
      { shipment_cost_amount: 10.5, shipment_cost_currency: 'usd' },
      { shipment_cost_amount: 2, shipment_cost_currency: 'usd' },
    ]),
    { currencyCode: 'USD', costAmount: 12.5 },
  );
});

test('summedShippingFees is null when no label costs exist', () => {
  assert.equal(summedShippingFees([{ shipment_cost_amount: null }]), null);
  assert.equal(summedShippingFees([]), null);
});
