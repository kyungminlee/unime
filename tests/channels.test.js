'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const CHANNELS = require('../src/shared/channels.js');

function extractList(source, name) {
  const re = new RegExp(`${name}\\s*=\\s*Object\\.freeze\\(\\[([^\\]]*)\\]\\)`);
  const match = source.match(re);
  if (!match) { throw new Error(`Could not locate ${name} in source.`); }
  return match[1]
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
    .sort();
}

test('preload channel allow-lists match shared/channels.js', () => {
  const preload = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'preload', 'index.js'),
    'utf8',
  );
  assert.deepEqual(
    extractList(preload, 'SEND_CHANNELS'),
    [...CHANNELS.SEND_LIST].sort(),
  );
  assert.deepEqual(
    extractList(preload, 'RECEIVE_CHANNELS'),
    [...CHANNELS.RECEIVE_LIST].sort(),
  );
});
