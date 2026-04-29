const { ipcMain, clipboard } = require('electron');
const { CachedUnicodeDatabase } = require('./ucd.js');

class UCDWorker {
  constructor(dataFile, configFile, aliasCacheFile, cacheFile) {
    this.dataFile = dataFile;
    this.configFile = configFile;
    this.aliasCacheFile = aliasCacheFile;
    this.cacheFile = cacheFile;
    this.status = { ready: false, message: 'Initializing...' };
    this.cachedUCD = new CachedUnicodeDatabase(dataFile, configFile, aliasCacheFile, cacheFile);

    ipcMain.on('search', (event, args) => {
      try {
        const { query } = args;
        const result = this.cachedUCD.search(query);
        event.reply('searchResult', { result });
      } catch (err) {
        this.status = { ready: true, message: `Search failed. ${err}` };
        event.reply('status', this.status);
      }
    });

    ipcMain.on('requestStatus', (event) => {
      event.reply('status', this.status);
    });

    ipcMain.on('clipboard', (event, args) => {
      clipboard.writeText(args);
      this.status = { ready: true, message: `Character ${args} copied to clipboard.` };
      event.reply('status', this.status);
    });

    ipcMain.on('cache', (event, args) => {
      this.rebuildCache(event, args);
    });

    this.status = { ready: true, message: 'Ready.' };
  }

  rebuildCache(event, { force } = {}) {
    this.status = { ready: false, message: 'Caching...' };
    event.reply('status', this.status);

    if (force) {
      this.cachedUCD.clearCache();
    }

    const aliasKeys = Object.keys(this.cachedUCD.aliases);
    const totalCount = aliasKeys.length;
    const blockSize = Math.max(Math.floor(totalCount / 100), 1);
    let count = 0;
    let nextReportAt = blockSize;

    for (const alias of aliasKeys) {
      this.cachedUCD.search(alias);
      ++count;
      if (count >= nextReportAt) {
        this.status = { ready: false, message: `Cached ${count}/${totalCount} items.` };
        event.reply('status', this.status);
        nextReportAt += blockSize;
      }
    }

    this.cachedUCD.dump(this.cacheFile);
    this.status = { ready: true, message: 'Ready.' };
    event.reply('status', this.status);
  }

  dumpCache() {
    this.cachedUCD.dump(this.cacheFile);
  }

  getStatus() {
    return this.status;
  }
}

module.exports = { UCDWorker };
