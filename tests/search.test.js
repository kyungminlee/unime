'use strict';

const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { UnicodeSearchEngine } = require('../src/main/ucd/search.js');

const DATA = path.join(__dirname, 'fixtures', 'ucd.sample.json');
const CONFIG = path.join(__dirname, 'fixtures', 'config.sample.json');

function newEngine() {
  return new UnicodeSearchEngine({ dataFile: DATA, configFile: CONFIG });
}

test('search resolves \\u-prefixed hex code points', () => {
  const engine = newEngine();
  const result = engine.search('\\u3b1');
  assert.equal(result.length, 1);
  assert.equal(result[0].cp, 0x3b1);
  assert.equal(result[0].na, 'GREEK SMALL LETTER ALPHA');
});

test('search resolves &#NNN; decimal HTML entities', () => {
  const engine = newEngine();
  const result = engine.search('&#945;');
  assert.equal(result[0].cp, 945);
});

test('search resolves &#xNNN; hex HTML entities', () => {
  const engine = newEngine();
  const result = engine.search('&#x3b1;');
  assert.equal(result[0].cp, 945);
});

test('search resolves alias to canonical name', () => {
  const engine = newEngine();
  const result = engine.search('\\sqrt');
  assert.equal(result[0].cp, 8730);
});

test('search uppercases plain queries to match the database', () => {
  const engine = newEngine();
  const result = engine.search('square root');
  assert.ok(result.some((hit) => hit.cp === 8730));
});

test('search caches alias resolutions', () => {
  const engine = newEngine();
  engine.search('\\sqrt');
  const cached = engine.cache.get('SQUARE ROOT');
  assert.deepEqual(cached, [8730]);
});

test('addAlias allows runtime extension', () => {
  const engine = newEngine();
  engine.addAlias('\\circplus', 'CIRCLED PLUS');
  const result = engine.search('\\circplus');
  assert.equal(result[0].cp, 8853);
});
