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

test('loadConfig returns default shortcut when unset', () => {
  const config = loadConfig(path.join(__dirname, 'fixtures', 'config.sample.json'));
  assert.equal(config.shortcut, DEFAULT_CONFIG.shortcut);
});

test('loadConfig accepts an explicit shortcut string', () => {
  const tmp = path.join(os.tmpdir(), `unime-shortcut-${process.pid}.json`);
  fs.writeFileSync(tmp, JSON.stringify({ shortcut: 'Alt+Space' }));
  try {
    assert.equal(loadConfig(tmp).shortcut, 'Alt+Space');
  } finally {
    fs.unlinkSync(tmp);
  }
});

test('loadConfig accepts null shortcut to disable the global accelerator', () => {
  const tmp = path.join(os.tmpdir(), `unime-shortcut-null-${process.pid}.json`);
  fs.writeFileSync(tmp, JSON.stringify({ shortcut: null }));
  try {
    assert.equal(loadConfig(tmp).shortcut, null);
  } finally {
    fs.unlinkSync(tmp);
  }
});
