'use strict';

const { ipcMain, clipboard } = require('electron');

const CHANNELS = require('../../shared/channels.js');
const { UnicodeSearchEngine } = require('./search.js');

/**
 * @typedef {{ ready: boolean, message: string }} WorkerStatus
 */

class UCDWorker {
  /**
   * @param {{
   *   dataFile: string,
   *   configFile: string,
   *   aliasCacheFile: string,
   *   cacheFile: string,
   * }} options
   */
  constructor({ dataFile, configFile, aliasCacheFile, cacheFile }) {
    this.cacheFile = cacheFile;

    this.engine = new UnicodeSearchEngine({
      dataFile,
      configFile,
      aliasCacheFile,
      userCacheFile: cacheFile,
    });

    /** @type {WorkerStatus} */
    this.status = { ready: true, message: 'Ready.' };

    this._registerHandlers();
  }

  _registerHandlers() {
    ipcMain.on(CHANNELS.SEND.SEARCH, (event, args) => this._handleSearch(event, args));
    ipcMain.on(CHANNELS.SEND.REQUEST_STATUS, (event) => this._handleRequestStatus(event));
    ipcMain.on(CHANNELS.SEND.CLIPBOARD, (event, payload) => this._handleClipboard(event, payload));
    ipcMain.on(CHANNELS.SEND.CACHE, (event, args) => this._rebuildCache(event, args));
  }

  _setStatus(event, status) {
    this.status = status;
    event.reply(CHANNELS.RECEIVE.STATUS, status);
  }

  _handleSearch(event, args) {
    try {
      const { query } = args ?? {};
      const result = this.engine.search(String(query ?? ''));
      event.reply(CHANNELS.RECEIVE.SEARCH_RESULT, { result });
    } catch (err) {
      this._setStatus(event, { ready: true, message: `Search failed. ${err}` });
    }
  }

  _handleRequestStatus(event) {
    event.reply(CHANNELS.RECEIVE.STATUS, this.status);
  }

  _handleClipboard(event, payload) {
    const text = String(payload ?? '');
    clipboard.writeText(text);
    this._setStatus(event, { ready: true, message: `Character ${text} copied to clipboard.` });
  }

  _rebuildCache(event, { force } = {}) {
    this._setStatus(event, { ready: false, message: 'Caching...' });

    if (force) {
      this.engine.clearCache();
    }

    const aliasKeys = this.engine.getAliasKeys();
    const totalCount = aliasKeys.length;
    const blockSize = Math.max(Math.floor(totalCount / 100), 1);
    let count = 0;
    let nextReportAt = blockSize;

    for (const alias of aliasKeys) {
      this.engine.search(alias);
      count += 1;
      if (count >= nextReportAt) {
        this._setStatus(event, { ready: false, message: `Cached ${count}/${totalCount} items.` });
        nextReportAt += blockSize;
      }
    }

    this.engine.dumpCache(this.cacheFile).catch((err) => {
      console.error(`Failed to write cache to ${this.cacheFile}:`, err);
    });
    this._setStatus(event, { ready: true, message: 'Ready.' });
  }

  /** Synchronous shutdown hook — used during app quit. */
  dumpCacheSync() {
    try {
      this.engine.dumpCacheSync(this.cacheFile);
    } catch (err) {
      console.error(`Failed to write cache to ${this.cacheFile}:`, err);
    }
  }

  getStatus() {
    return this.status;
  }
}

module.exports = { UCDWorker };
