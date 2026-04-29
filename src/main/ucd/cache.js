'use strict';

const fs = require('node:fs');
const { LRUCache } = require('lru-cache');

class SearchCache {
  /** @param {{ max?: number }} [options] */
  constructor({ max = 10000 } = {}) {
    /** @type {LRUCache<string, number[]>} */
    this.lru = new LRUCache({ max });
  }

  /** @param {string} key */
  get(key) {
    return this.lru.get(key);
  }

  /**
   * @param {string} key
   * @param {number[]} value
   */
  set(key, value) {
    this.lru.set(key, value);
  }

  clear() {
    this.lru.clear();
  }

  entries() {
    return Array.from(this.lru.entries());
  }

  /** Load cache entries from a JSON file, ignoring missing/invalid files. */
  loadFromFile(filename) {
    let raw;
    try {
      raw = fs.readFileSync(filename, 'utf8');
    } catch {
      return;
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    if (!Array.isArray(data)) { return; }
    for (const entry of data) {
      if (!Array.isArray(entry) || entry.length < 2) { continue; }
      const [key, value] = entry;
      // Support legacy LRU dump format ([key, { value }]) and modern
      // [key, value] pairs.
      const normalized = value && typeof value === 'object' && 'value' in value
        ? value.value
        : value;
      if (typeof key === 'string' && Array.isArray(normalized)) {
        this.lru.set(key, normalized);
      }
    }
  }

  /** Asynchronously dump cache entries to a JSON file. */
  async dumpToFile(filename) {
    await fs.promises.writeFile(filename, JSON.stringify(this.entries()));
  }

  /** Synchronously dump cache entries to a JSON file (used on shutdown). */
  dumpToFileSync(filename) {
    fs.writeFileSync(filename, JSON.stringify(this.entries()));
  }
}

module.exports = { SearchCache };
