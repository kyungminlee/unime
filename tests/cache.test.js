'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { SearchCache } = require('../src/main/ucd/cache.js');

function tmpFile(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unime-'));
  return path.join(dir, name);
}

test('SearchCache stores and retrieves entries', () => {
  const cache = new SearchCache({ max: 4 });
  cache.set('alpha', [945]);
  assert.deepEqual(cache.get('alpha'), [945]);
});

test('SearchCache.entries returns ordered tuples', () => {
  const cache = new SearchCache({ max: 4 });
  cache.set('a', [1]);
  cache.set('b', [2]);
  const entries = cache.entries();
  assert.equal(entries.length, 2);
  assert.deepEqual(new Set(entries.map(([k]) => k)), new Set(['a', 'b']));
});

test('SearchCache round-trips through dump/load', () => {
  const file = tmpFile('cache.json');
  const original = new SearchCache({ max: 4 });
  original.set('alpha', [945]);
  original.set('beta', [946]);
  original.dumpToFileSync(file);

  const restored = new SearchCache({ max: 4 });
  restored.loadFromFile(file);
  assert.deepEqual(restored.get('alpha'), [945]);
  assert.deepEqual(restored.get('beta'), [946]);
});

test('SearchCache.loadFromFile tolerates legacy {value: ...} format', () => {
  const file = tmpFile('legacy.json');
  fs.writeFileSync(file, JSON.stringify([
    ['SQUARE ROOT', { value: [8730] }],
    ['CUBE ROOT', { value: [8731] }],
  ]));

  const cache = new SearchCache();
  cache.loadFromFile(file);
  assert.deepEqual(cache.get('SQUARE ROOT'), [8730]);
  assert.deepEqual(cache.get('CUBE ROOT'), [8731]);
});

test('SearchCache.loadFromFile is a no-op for missing files', () => {
  const cache = new SearchCache();
  assert.doesNotThrow(() => cache.loadFromFile('/no/such/path/cache.json'));
});

test('SearchCache.loadFromFile is a no-op for invalid JSON', () => {
  const file = tmpFile('invalid.json');
  fs.writeFileSync(file, 'not json{');
  const cache = new SearchCache();
  assert.doesNotThrow(() => cache.loadFromFile(file));
});
