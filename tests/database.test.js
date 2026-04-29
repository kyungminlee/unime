'use strict';

const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { UnicodeDatabase } = require('../src/main/ucd/database.js');

const FIXTURE = path.join(__dirname, 'fixtures', 'ucd.sample.json');

test('UnicodeDatabase loads entries and supports lookup by code point', () => {
  const db = new UnicodeDatabase(FIXTURE);
  assert.equal(db.lookup(945), 'GREEK SMALL LETTER ALPHA');
  assert.equal(db.lookup(8730), 'SQUARE ROOT');
});

test('UnicodeDatabase fuzzy-searches case-insensitively', () => {
  const db = new UnicodeDatabase(FIXTURE);
  const hits = db.search('alpha', 10);
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].cp, 945);
});

test('UnicodeDatabase respects maxHits', () => {
  const db = new UnicodeDatabase(FIXTURE);
  const hits = db.search('GREEK', 2);
  assert.equal(hits.length, 2);
});
