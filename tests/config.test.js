'use strict';

const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { loadConfig } = require('../src/main/ucd/config.js');

test('loadConfig parses maxHits and aliases', () => {
  const config = loadConfig(path.join(__dirname, 'fixtures', 'config.sample.json'));
  assert.equal(config.maxHits, 100);
  assert.equal(config.aliases['\\sqrt'], 'SQUARE ROOT');
});
