const fs = require('fs');
const FuzzySearch = require('fuzzy-search');
const LRU = require('lru-cache');

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
    this.searcher = new FuzzySearch(this.database, ['na'], { caseSensitive: false, sort: true });
  }

  search(query, maxHits) {
    return this.searcher.search(query).slice(0, maxHits);
  }

  lookup(cp) {
    return this.lookupTable[cp];
  }
}

class CachedUnicodeDatabase {
  constructor(ucdFilename, configFilename, aliasCacheFilename, cacheFilename, cacheSize=10000, maxHits=2000) {
    this.cache = new LRU({max: cacheSize});
    this.cacheSize = cacheSize;
    this.maxHits = maxHits;
    this.aliases = {};
    this.ucd = new UnicodeDatabase(ucdFilename);
    this.loadConfig(configFilename);
    this.loadCache(aliasCacheFilename, {append: false});
    this.loadCache(cacheFilename, {append: true});
  }

  loadConfig(filename) {
    const config = JSON.parse(fs.readFileSync(filename, "utf8"));
    if (config.aliases) { this.aliases = config.aliases; }
    if (config.maxHits) { this.maxHits = config.maxHits; }
    // TODO: other configs (unicode categories, number of ...)
  }

  loadCache(filename, options) {
    const {append} = options;
    this.history = [];
    try {
      const data = JSON.parse(fs.readFileSync(filename, "utf8"));
      if (data) {
        if (append) {
          for (const item of data) {
            this.cache.set(item[0], item[1].value);
          }
        } else {
          this.cache.load(data);
        }
        // console.log(`loaded ${filename}`)
      }
    } catch (err) {
    }
  }

  dump(filename) {
    const cache = JSON.stringify(this.cache.dump());
    fs.writeFile(filename, cache, (err) => { if (err) throw err; });
  }

  addAlias(alias, value) {
    this.aliases[alias] = value;
  }

  searchRaw(query) {
    const hits = this.ucd.search(query, this.maxHits);
    this.cache.set(query, hits.map((obj) => obj.cp)); // Keep only codepoints in cache
    return hits;
  }

  search(query) {
    // First, check if \uXXXX or &#DDDD; or &#xXXXX;
    const unicodePatterns = [
      {pattern: /^\\[uU]\+?([0-9A-Fa-f]+)$/, hex: true},
      {pattern: /^&#([0-9]+);$/, hex: false},
      {pattern: /^&#[xX]([0-9A-Fa-f]+);$/, hex: true}
    ];
    for (const unicodePattern of unicodePatterns) {
      const m = query.match(unicodePattern.pattern);
      if (m) {
        let cp;
        if (unicodePattern.hex) {
          cp = String(Number('0x' + m[1]));
        } else {
          cp = String(Number(m[1]));
        }
        return [{cp: parseInt(cp), na: this.ucd.lookup(cp)}];
      }
    }

    // Second, resolve alias
    const aliasResolved = this.aliases[query];
    query = aliasResolved || query.toUpperCase();

    // Third, check if result is cached
    const cacheHits = this.cache.get(query);
    if (cacheHits) {
      const hits = cacheHits.map((cp) => ({cp: parseInt(cp), na: this.ucd.lookup(cp)}));
      return hits;
    }
    return this.searchRaw(query);
  }

  clearCache() {
    this.cache.clear();
  }

  cacheAliases() {
    for(const alias in this.aliases) {
      this.search(alias);
    }
  }
}

module.exports.CachedUnicodeDatabase = CachedUnicodeDatabase
module.exports.UnicodeDatabase = UnicodeDatabase
