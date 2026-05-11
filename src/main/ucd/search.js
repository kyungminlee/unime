'use strict';

const { UnicodeDatabase } = require('./database.js');
const { SearchCache } = require('./cache.js');
const { loadConfig } = require('./config.js');

/**
 * @typedef {{ cp: number, na: string | undefined }} SearchHit
 */

const CODEPOINT_PATTERNS = Object.freeze([
  { pattern: /^\\[uU]\+?([0-9A-Fa-f]+)$/, radix: 16 },
  { pattern: /^&#([0-9]+);$/, radix: 10 },
  { pattern: /^&#[xX]([0-9A-Fa-f]+);$/, radix: 16 },
]);

class UnicodeSearchEngine {
  /**
   * @param {{
   *   dataFile: string,
   *   configFile: string,
   *   aliasCacheFile?: string,
   *   userCacheFile?: string,
   *   cacheSize?: number,
   * }} options
   */
  constructor({ dataFile, configFile, aliasCacheFile, userCacheFile, cacheSize = 10000 }) {
    this.ucd = new UnicodeDatabase(dataFile);
    this.cache = new SearchCache({ max: cacheSize });

    const config = loadConfig(configFile);
    this.aliases = { ...config.aliases };
    this.maxHits = config.maxHits;

    if (aliasCacheFile) { this.cache.loadFromFile(aliasCacheFile); }
    if (userCacheFile) { this.cache.loadFromFile(userCacheFile); }
  }

  /** @param {string} alias @param {string} value */
  addAlias(alias, value) {
    this.aliases[alias] = value;
  }

  getAliasKeys() {
    return Object.keys(this.aliases);
  }

  /**
   * @param {string} query
   * @returns {SearchHit | null}
   */
  _matchCodepointPattern(query) {
    for (const { pattern, radix } of CODEPOINT_PATTERNS) {
      const match = query.match(pattern);
      if (match) {
        const cp = parseInt(match[1], radix);
        return { cp, na: this.ucd.lookup(cp) };
      }
    }
    return null;
  }

  /**
   * @param {string} query
   * @returns {SearchHit[]}
   */
  _searchByName(query) {
    const hits = this.ucd.search(query, this.maxHits);
    this.cache.set(query, hits.map((entry) => entry.cp));
    return hits;
  }

  /**
   * @param {string} query
   * @returns {SearchHit[]}
   */
  search(query) {
    const codepointHit = this._matchCodepointPattern(query);
    if (codepointHit) { return [codepointHit]; }

    const normalized = this.aliases[query] ?? query.toUpperCase();

    const cached = this.cache.get(normalized);
    if (cached) {
      return cached.map((cp) => ({ cp, na: this.ucd.lookup(cp) }));
    }
    return this._searchByName(normalized);
  }

  clearCache() {
    this.cache.clear();
  }

  dumpCacheSync(filename) {
    this.cache.dumpToFileSync(filename);
  }

  async dumpCache(filename) {
    await this.cache.dumpToFile(filename);
  }
}

module.exports = { UnicodeSearchEngine };
