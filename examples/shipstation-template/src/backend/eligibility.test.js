import assert from 'node:assert/strict';
import test from 'node:test';

import {
  effectiveShippingCarrierField,
  ineligibilityReason,
  NO_DIGIT_CARRIER_REASON,
} from './eligibility.js';

function packedShipment(overrides = {}) {
  return {
    shippingStatus: 'awaiting_carrier',
    packContainers: [
      { packedItems: [{ pickedItem: { orderItem: { item: { id: 'item-1' } } } }] },
    ],
    order: { id: 'order-1' },
    ...overrides,
  };
}

const upsMaps = {
  carrierMappings: [
    {
      ssCarrierCode: 'ups',
      ssServiceCode: 'ups_ground',
      digitOptionId: 'opt-ups-gnd',
      source: 'manual',
    },
  ],
  ssCarriers: [
    {
      carrierCode: 'ups',
      shipstationCarrierId: 'se-1',
      name: 'UPS',
      services: [{ serviceCode: 'ups_ground', name: 'UPS Ground' }],
    },
  ],
};

test('effectiveShippingCarrierField prefers the shipment carrier', () => {
  const field = effectiveShippingCarrierField({
    shippingCarrierField: { id: 'ship', value: 'Shipment UPS' },
    order: { shippingCarrierField: { id: 'ord', value: 'Order FedEx' } },
  });
  assert.equal(field?.id, 'ship');
  assert.equal(field?.value, 'Shipment UPS');
});

test('effectiveShippingCarrierField falls back to the sales order carrier', () => {
  const field = effectiveShippingCarrierField({
    shippingCarrierField: null,
    order: { shippingCarrierField: { id: 'ord', value: 'Order FedEx' } },
  });
  assert.equal(field?.id, 'ord');
  assert.equal(field?.value, 'Order FedEx');
});

test('ineligibilityReason uses the order carrier when the shipment carrier is empty', () => {
  const reason = ineligibilityReason({
    shipment: packedShipment({
      shippingCarrierField: null,
      order: { id: 'order-1', shippingCarrierField: { id: 'opt-ups-gnd', value: 'UPS Ground' } },
    }),
    carrierMaps: upsMaps,
  });
  assert.equal(reason, null);
});

test('ineligibilityReason still blocks when neither shipment nor order has a carrier', () => {
  const reason = ineligibilityReason({
    shipment: packedShipment({ shippingCarrierField: null }),
    carrierMaps: { carrierMappings: [], ssCarriers: [] },
  });
  assert.equal(reason, NO_DIGIT_CARRIER_REASON);
});
