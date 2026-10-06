import assert from 'node:assert/strict';
import test from 'node:test';

import { AppErrorCode } from '../dist/codes.js';
import { optionalString, parseObject, requiredString } from '../dist/validate.js';

test('requiredString rejects a missing field', () => {
  const parsed = requiredString({ obj: {}, key: 'title' });
  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.equal(parsed.error.code, AppErrorCode.VALIDATION_ERROR);
    assert.match(parsed.error.message, /title/);
  }
});

test('requiredString trims and returns the value', () => {
  const parsed = requiredString({ obj: { title: '  Hello  ' }, key: 'title' });
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.value, 'Hello');
});

test('parseObject fills a missing optional string', () => {
  const parsed = parseObject({
    value: { title: 'Note' },
    fields: {
      title: (obj) => requiredString({ obj, key: 'title' }),
      body: (obj) => optionalString({ obj, key: 'body', default: '' }),
    },
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.title, 'Note');
    assert.equal(parsed.value.body, '');
  }
});
