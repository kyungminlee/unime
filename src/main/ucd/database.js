'use strict';

const fs = require('node:fs');
const FuzzySearch = require('fuzzy-search');

/**
 * @typedef {{ cp: number, na: string }} UnicodeEntry
 */

class UnicodeDatabase {
  /** @param {string} ucdFilename */
  constructor(ucdFilename) {
    /** @type {UnicodeEntry[]} */
    this.database = [];
    /** @type {Map<number, string>} */
    this.lookupTable = new Map();
    this.searcher = null;
    this.load(ucdFilename);
  }

  /** @param {string} filename */
  load(filename) {
    this.database = [];
    this.lookupTable.clear();
    const json = JSON.parse(fs.readFileSync(filename, 'utf8'));
    for (const [cp, na] of json) {
      this.database.push({ cp, na });
      this.lookupTable.set(cp, na);
    }
    this.searcher = new FuzzySearch(this.database, ['na'], {
      caseSensitive: false,
      sort: true,
    });
  }

  /**
   * @param {string} query
   * @param {number} maxHits
   * @returns {UnicodeEntry[]}
   */
  search(query, maxHits) {
    return this.searcher.search(query).slice(0, maxHits);
  }

  /**
   * @param {number} cp
   * @returns {string | undefined}
   */
  lookup(cp) {
    return this.lookupTable.get(Number(cp));
  }
}

module.exports = { UnicodeDatabase };
