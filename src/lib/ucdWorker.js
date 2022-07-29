const path = require('path');
const UCD = require(path.join(__dirname, 'ucd.js'));
const { ipcMain, clipboard } = require('electron');

class UCDWorker {
  constructor(dataFile, configFile, aliasCacheFile, cacheFile) {
    this.dataFile = dataFile;
    this.configFile = configFile;
    this.aliasCacheFile = aliasCacheFile;
    this.cacheFile = cacheFile;
    this.status = {ready: false, message: 'Initializing...'};
    this.cachedUCD = new UCD.CachedUnicodeDatabase(dataFile, configFile, aliasCacheFile, cacheFile);

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

    ipcMain.on('requestStatus', (event, _args) => {
      event.reply('status', this.status);
    });

    ipcMain.on('clipboard', (event, args) => {
      clipboard.writeText(args);
      this.status = {ready: true, message: `Character ${args} copied to clipboard.`};
      event.reply('status', this.status);
    });

    ipcMain.on('cache', (event, args) => {
      this.status = {ready: false, message: 'Caching...'};
      event.reply('status', this.status);

      if (args.force) {
        this.cachedUCD.clearCache();
      }

      const totalCount = Object.keys(this.cachedUCD.aliases).length;
      let count = 0;
      const blockSize = Math.max(Math.floor(totalCount / 100), 1);
      let targetCount = Math.min(blockSize, totalCount);
      for(const alias in this.cachedUCD.aliases) {
        this.cachedUCD.search(alias);
        ++count;
        if (count >= targetCount) {
          this.status = {ready: false, message: `Cached ${count}/${totalCount} items.`}
          event.reply('status', this.status);
          targetCount = Math.min(targetCount + blockSize, totalCount);
        }
      }
      this.cachedUCD.dump(this.cacheFile);
      this.status = {ready: true, message: 'Ready.'};
      event.reply('status', this.status);
      // console.log( `Caching finished`);
    });

    this.status = {ready: true, message: 'Ready.'};
  }

  async rebuildCache(event, args) {
    this.status = {ready: false, message: 'Caching...'};
    event.reply('status', this.status);

    if (args.force) {
      this.cachedUCD.clearCache();
    }

    const totalCount = Object.keys(this.cachedUCD.aliases).length;
    let count = 0;
    const blockSize = Math.max(Math.floor(totalCount / 100), 1);
    let targetCount = Math.min(blockSize, totalCount);
    for(const alias in this.cachedUCD.aliases) {
      this.cachedUCD.search(alias);
      ++count;
      if (count >= targetCount) {
        this.status = {ready: false, message: `Cached ${count}/${totalCount} items.`}
        event.reply('status', this.status);
        targetCount = Math.min(targetCount + blockSize, totalCount);
      }
    }
    this.cachedUCD.dump(this.cacheFile);
    this.status = {ready: true, message: 'Ready.'};
    event.reply('status', this.status);
  }

  dumpCache() {
    this.cachedUCD.dump(this.cacheFile);
  }
  
  getStatus() {
    return this.status;
  }
}

module.exports.UCDWorker = UCDWorker;
