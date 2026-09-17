import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCarrierMapPayload,
  effectiveCarrierMatch,
  matchDigitCarrierOptions,
} from './carrierMatch.js';

const usps = { id: 'opt-usps', value: 'USPS' };
const uspsPriority = { id: 'opt-usps-pri', value: 'USPS Priority Mail' };
const ups = { id: 'opt-ups', value: 'UPS' };
const upsGround = { id: 'opt-ups-gnd', value: 'UPS Ground' };
const ontrac = { id: 'opt-ontrac', value: 'OnTrac' };

test('matchDigitCarrierOptions maps ups_ground to UPS Ground, not generic UPS', () => {
  const matched = matchDigitCarrierOptions({
    carrierCode: 'ups',
    carrierName: 'UPS',
    serviceCode: 'ups_ground',
    serviceName: 'UPS Ground',
    options: [ups, upsGround, usps],
  });
  assert.equal(matched?.method, 'exact');
  assert.equal(matched?.option.id, upsGround.id);
});

test('matchDigitCarrierOptions does not brand-alias stamps_com to USPS', () => {
  const matched = matchDigitCarrierOptions({
    carrierCode: 'stamps_com',
    carrierName: 'Stamps.com',
    serviceCode: 'usps_priority_mail',
    serviceName: 'USPS Priority Mail',
    options: [usps, ups],
  });
  assert.equal(matched, null);
});

test('matchDigitCarrierOptions exact-matches a full service name', () => {
  const matched = matchDigitCarrierOptions({
    carrierCode: 'stamps_com',
    carrierName: 'Stamps.com',
    serviceCode: 'usps_priority_mail',
    serviceName: 'USPS Priority Mail',
    options: [usps, uspsPriority],
  });
  assert.equal(matched?.method, 'exact');
  assert.equal(matched?.option.id, uspsPriority.id);
});

test('effectiveCarrierMatch prefers a service map over a carrier default', () => {
  const match = effectiveCarrierMatch({
    carrierCode: 'ups',
    carrierName: 'UPS',
    serviceCode: 'ups_ground',
    serviceName: 'UPS Ground',
    options: [ups, upsGround],
    serviceMapping: {
      ssCarrierCode: 'ups',
      ssServiceCode: 'ups_ground',
      digitOptionId: upsGround.id,
      source: 'manual',
    },
    carrierMapping: {
      ssCarrierCode: 'ups',
      ssServiceCode: '',
      digitOptionId: ups.id,
      source: 'manual',
    },
  });
  assert.equal(match.digitOptionId, upsGround.id);
  assert.equal(match.matchSource, 'manual');
  assert.equal(match.inheritedFromCarrier, false);
});

test('effectiveCarrierMatch uses the carrier default when the service row is empty', () => {
  const match = effectiveCarrierMatch({
    carrierCode: 'ups',
    carrierName: 'UPS',
    serviceCode: 'ups_2nd_day_air',
    serviceName: 'UPS 2nd Day Air',
    options: [ups, upsGround],
    carrierMapping: {
      ssCarrierCode: 'ups',
      ssServiceCode: '',
      digitOptionId: ups.id,
      source: 'manual',
    },
  });
  assert.equal(match.digitOptionId, ups.id);
  assert.equal(match.matchSource, 'carrier');
  assert.equal(match.inheritedFromCarrier, true);
});

test('buildCarrierMapPayload annotates services and omits resolved pulled services from unmatched', () => {
  const payload = buildCarrierMapPayload({
    digitCarriers: [uspsPriority, upsGround],
    ssCarriers: [
      {
        carrierCode: 'stamps_com',
        name: 'Stamps.com',
        shipstationCarrierId: 'se-1',
        services: [{ serviceCode: 'usps_priority_mail', name: 'USPS Priority Mail' }],
      },
      {
        carrierCode: 'ups',
        name: 'UPS',
        shipstationCarrierId: 'se-2',
        services: [{ serviceCode: 'ups_ground', name: 'UPS Ground' }],
      },
    ],
    mappings: [],
    pulledServices: [
      { carrierCode: 'ups', serviceCode: 'ups_ground', serviceName: 'UPS Ground' },
    ],
  });

  const upsRow = payload.ssCarriers.find((row) => row.carrierCode === 'ups');
  const ground = upsRow?.services.find((row) => row.serviceCode === 'ups_ground');
  assert.equal(ground?.matchSource, 'exact');
  assert.equal(ground?.digitOptionId, upsGround.id);
  assert.equal(payload.unmappedCarriers.length, 0);
});

test('buildCarrierMapPayload lists pulled services that do not match', () => {
  const payload = buildCarrierMapPayload({
    digitCarriers: [uspsPriority],
    ssCarriers: [
      {
        carrierCode: 'usps',
        name: 'USPS',
        services: [{ serviceCode: 'usps_priority_mail', name: 'USPS Priority Mail' }],
      },
    ],
    mappings: [],
    pulledServices: [
      { carrierCode: 'ontrac', serviceCode: 'ontrac_ground', serviceName: 'OnTrac Ground' },
    ],
  });

  assert.equal(payload.unmappedCarriers.length, 1);
  assert.equal(payload.unmappedCarriers[0].carrierCode, 'ontrac');
  assert.equal(payload.unmappedCarriers[0].serviceCode, 'ontrac_ground');
  const extra = payload.ssCarriers.find((row) => row.carrierCode === 'ontrac');
  assert.ok(extra);
  assert.equal(extra.inCatalog, false);
  assert.equal(extra.services[0]?.digitOptionId, null);
});

test('buildCarrierMapPayload drops unmatched pulled services once a manual service map exists', () => {
  const payload = buildCarrierMapPayload({
    digitCarriers: [ontrac],
    ssCarriers: [],
    mappings: [
      {
        ssCarrierCode: 'ontrac',
        ssServiceCode: 'ontrac_ground',
        digitOptionId: ontrac.id,
        source: 'manual',
      },
    ],
    pulledServices: [
      { carrierCode: 'ontrac', serviceCode: 'ontrac_ground', serviceName: 'OnTrac Ground' },
    ],
  });

  assert.equal(payload.unmappedCarriers.length, 0);
  const extra = payload.ssCarriers.find((row) => row.carrierCode === 'ontrac');
  const svc = extra?.services.find((row) => row.serviceCode === 'ontrac_ground');
  assert.equal(svc?.matchSource, 'manual');
  assert.equal(svc?.digitOptionId, ontrac.id);
});
