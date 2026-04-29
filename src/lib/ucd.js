const fs = require('node:fs');
const FuzzySearch = require('fuzzy-search');
const { LRUCache } = require('lru-cache');

class UnicodeDatabase {
  constructor(ucdFilename) {
    this.database = [];
    this.lookupTable = new Map();
    this.load(ucdFilename);
  }

  load(filename) {
    this.database = [];
    this.lookupTable.clear();
    const json = JSON.parse(fs.readFileSync(filename, 'utf8'));
    for (const [cp, na] of json) {
      this.database.push({ cp, na });
      this.lookupTable.set(String(cp), na);
    }
    this.searcher = new FuzzySearch(this.database, ['na'], { caseSensitive: false, sort: true });
  }

  search(query, maxHits) {
    return this.searcher.search(query).slice(0, maxHits);
  }

  lookup(cp) {
    return this.lookupTable.get(String(cp));
  }
}

class CachedUnicodeDatabase {
  constructor(ucdFilename, configFilename, aliasCacheFilename, cacheFilename, cacheSize = 10000, maxHits = 2000) {
    this.cache = new LRUCache({ max: cacheSize });
    this.cacheSize = cacheSize;
    this.maxHits = maxHits;
    this.aliases = {};
    this.ucd = new UnicodeDatabase(ucdFilename);
    this.loadConfig(configFilename);
    this.loadCache(aliasCacheFilename);
    this.loadCache(cacheFilename);
  }

  loadConfig(filename) {
    const config = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (config.aliases) { this.aliases = config.aliases; }
    if (config.maxHits) { this.maxHits = config.maxHits; }
  }

  loadCache(filename) {
    try {
      const raw = fs.readFileSync(filename, 'utf8');
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) { return; }
      for (const entry of data) {
        if (!Array.isArray(entry) || entry.length < 2) { continue; }
        const [key, value] = entry;
        // Support legacy LRU dump format ([key, { value }]) as well as
        // the simple [key, value] pairs we now write.
        const normalized = value && typeof value === 'object' && 'value' in value
          ? value.value
          : value;
        this.cache.set(key, normalized);
      }
    } catch {
      // Missing or invalid cache file — start fresh.
    }
  }

  dump(filename) {
    const entries = Array.from(this.cache.entries());
    fs.promises.writeFile(filename, JSON.stringify(entries)).catch((err) => {
      console.error(`Failed to write cache to ${filename}:`, err);
    });
  }

  addAlias(alias, value) {
    this.aliases[alias] = value;
  }

  searchRaw(query) {
    const hits = this.ucd.search(query, this.maxHits);
    this.cache.set(query, hits.map((obj) => obj.cp));
    return hits;
  }

  search(query) {
    const unicodePatterns = [
      { pattern: /^\\[uU]\+?([0-9A-Fa-f]+)$/, hex: true },
      { pattern: /^&#([0-9]+);$/, hex: false },
      { pattern: /^&#[xX]([0-9A-Fa-f]+);$/, hex: true },
    ];
    for (const { pattern, hex } of unicodePatterns) {
      const m = query.match(pattern);
      if (m) {
        const cp = hex ? parseInt(m[1], 16) : parseInt(m[1], 10);
        return [{ cp, na: this.ucd.lookup(cp) }];
      }
    }

    const aliasResolved = this.aliases[query];
    const normalizedQuery = aliasResolved || query.toUpperCase();

    const cacheHits = this.cache.get(normalizedQuery);
    if (cacheHits) {
      return cacheHits.map((cp) => ({ cp: parseInt(cp, 10), na: this.ucd.lookup(cp) }));
    }
    return this.searchRaw(normalizedQuery);
  }

  clearCache() {
    this.cache.clear();
  }

  cacheAliases() {
    for (const alias in this.aliases) {
      this.search(alias);
    }
  }
}

module.exports = { CachedUnicodeDatabase, UnicodeDatabase };
