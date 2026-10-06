import assert from 'node:assert/strict';
import test from 'node:test';

import { libFolderFromDepName } from '../src/pack.js';

test('vendors @heysutton platform libs', () => {
  assert.equal(libFolderFromDepName('@heysutton/lib-frontend'), 'lib-frontend');
  assert.equal(libFolderFromDepName('@heysutton/lib-backend'), 'lib-backend');
  assert.equal(libFolderFromDepName('@heysutton/lib-common'), 'lib-common');
  assert.equal(libFolderFromDepName('@heysutton/lib-build'), 'lib-build');
});

test('still vendors the legacy @digit/lib-* alias', () => {
  assert.equal(libFolderFromDepName('@digit/lib-frontend'), 'lib-frontend');
});

test('does not vendor the design system', () => {
  assert.equal(libFolderFromDepName('@heysutton/ui'), null);
  assert.equal(libFolderFromDepName('@mui/material'), null);
});
