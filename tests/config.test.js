'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { DEFAULT_CONFIG, loadConfig } = require('../src/main/ucd/config.js');

test('loadConfig parses maxHits and aliases', () => {
  const config = loadConfig(path.join(__dirname, 'fixtures', 'config.sample.json'));
  assert.equal(config.maxHits, 100);
  assert.equal(config.aliases['\\sqrt'], 'SQUARE ROOT');
});

function withSilencedConsoleError(fn) {
  const original = console.error;
  console.error = () => {};
  try { fn(); } finally { console.error = original; }
}

test('loadConfig falls back when file is missing', () => {
  withSilencedConsoleError(() => {
    const config = loadConfig(path.join(__dirname, 'fixtures', 'does-not-exist.json'));
    assert.equal(config.maxHits, DEFAULT_CONFIG.maxHits);
    assert.deepEqual(config.aliases, {});
  });
});

test('loadConfig falls back when JSON is corrupt', () => {
  const tmp = path.join(os.tmpdir(), `unime-corrupt-${process.pid}.json`);
  fs.writeFileSync(tmp, '{ not json');
  try {
    withSilencedConsoleError(() => {
      const config = loadConfig(tmp);
      assert.equal(config.maxHits, DEFAULT_CONFIG.maxHits);
      assert.deepEqual(config.aliases, {});
    });
  } finally {
    fs.unlinkSync(tmp);
  }
});
