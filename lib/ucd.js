const fs = require('fs');
const fuzz = require('fuzzaldrin-plus');
const path = require('path');

class UnicodeDatabase {
  constructor(ucdFilename) {
    this.database = [];
    this.lookupTable = {};
    this.load(ucdFilename);
  }

  load(filename) {
    this.database = [];
    const data = fs.readFileSync(filename, 'utf8', (err) => { if (err) { throw err } });
    const json = JSON.parse(data);
    for(const item of json) {
      this.database.push({cp: item[0], na: item[1]});
      this.lookupTable[item[0]] = item[1];
    }
  }

  search(query, maxHits) {
    return fuzz.filter(this.database, query, {key: 'na', maxResults: maxHits});
  }

  lookup(cp) {
    return this.lookupTable[cp];
  }
}

class CachedUnicodeDatabase {
  constructor(ucdFilename, configFilename, cacheFilename, cacheSize = 10000, maxHits = 2000) {
    this.cache = {};
    this.history = [];
    this.cacheSize = cacheSize;
    this.maxHits = maxHits;
    this.aliases = {};
    this.ucd = new UnicodeDatabase(ucdFilename);
    this.loadConfig(configFilename);
    this.loadCache(cacheFilename);
  }

  loadConfig(filename) {
    const config = JSON.parse(fs.readFileSync(filename, "utf8"));
    config.aliases && (this.aliases = config.aliases);
    config.maxHits && (this.maxHits = config.maxHits);
    // TODO: other configs (unicode categories, number of ...)
  }

  loadCache(filename) {
    try {
      const data = JSON.parse(fs.readFileSync(filename, "utf8"));
      if (data && data['cache'] && data['history']) {
        this.cache = data['cache'];
        this.history = data['history'];
      }
    } catch (err) {
      console.log(`Error in loadCache: {err}`)
    }
  }

  dump(filename) {
    const cache = JSON.stringify({cache: this.cache, history: this.history})
    fs.writeFile(filename, cache, (err) => { if (err) throw err; })
  }

  addAlias(alias, value) {
    this.aliases[alias] = value
  }

  searchRaw(query) {
    const hits = this.ucd.search(query, this.maxHits)
    this.cache[query] = hits.map((obj) => obj.cp) // Keep only codepoints in cache
    this.history.push(query)
    while (this.history.length > this.cacheSize) {
      const query = this.history.shift()
      delete this.cache[query]
    }
    return hits
  }

  search(query) {
    // First, resolve alias
    const aliasResolved = this.aliases[query]
    if (aliasResolved) { query = aliasResolved }
    else { query = query.toUpperCase() }

    // Check if result is cached
    const cacheHits = this.cache[query]
    if (cacheHits) {
      const hits = cacheHits.map((cp) => ({cp: parseInt(cp), na: this.ucd.lookup(cp)}))
      return hits
    } else {
      return this.searchRaw(query)
    }
  }

  cacheAliases() {
    for(const alias in this.aliases) {
      this.search(alias)
    }
  }
}

module.exports.CachedUnicodeDatabase = CachedUnicodeDatabase
module.exports.UnicodeDatabase = UnicodeDatabase