import assert from 'node:assert/strict';
import test from 'node:test';

import { libFolderFromDepName } from '../src/pack.js';

test('vendors the @heysutton SDK packages', () => {
  assert.equal(libFolderFromDepName('@heysutton/sdk'), 'sdk');
  assert.equal(libFolderFromDepName('@heysutton/sdk-react'), 'sdk-react');
  assert.equal(libFolderFromDepName('@heysutton/sdk-server'), 'sdk-server');
  assert.equal(libFolderFromDepName('@heysutton/sdk-build'), 'sdk-build');
});

test('maps legacy @digit/lib-* names to their old vendored folders', () => {
  assert.equal(libFolderFromDepName('@digit/lib-frontend'), 'lib-frontend');
  assert.equal(libFolderFromDepName('@digit/lib-build'), 'lib-build');
});

test('does not vendor anything else', () => {
  assert.equal(libFolderFromDepName('@heysutton/ui'), null);
  assert.equal(libFolderFromDepName('@heysutton/sdk-other'), null);
  assert.equal(libFolderFromDepName('@mui/material'), null);
});
