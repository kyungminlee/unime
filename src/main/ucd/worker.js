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
   *   getWebContents: () => import('electron').WebContents | null | undefined,
   * }} options
   */
  constructor({ dataFile, configFile, aliasCacheFile, cacheFile, getWebContents }) {
    this.cacheFile = cacheFile;
    this.getWebContents = getWebContents;

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
    ipcMain.on(CHANNELS.SEND.SEARCH, (_event, args) => this._handleSearch(args));
    ipcMain.on(CHANNELS.SEND.REQUEST_STATUS, () => this._sendStatus(this.status));
    ipcMain.on(CHANNELS.SEND.CLIPBOARD, (_event, payload) => this._handleClipboard(payload));
  }

  _send(channel, payload) {
    this.getWebContents()?.send(channel, payload);
  }

  _setStatus(status) {
    this.status = status;
    this._sendStatus(status);
  }

  _sendStatus(status) {
    this._send(CHANNELS.RECEIVE.STATUS, status);
  }

  _handleSearch(args) {
    try {
      const { query } = args ?? {};
      const result = this.engine.search(String(query ?? ''));
      this._send(CHANNELS.RECEIVE.SEARCH_RESULT, { result });
    } catch (err) {
      this._setStatus({ ready: true, message: `Search failed. ${err}` });
    }
  }

  _handleClipboard(payload) {
    const text = String(payload ?? '');
    clipboard.writeText(text);
    this._setStatus({ ready: true, message: `Character ${text} copied to clipboard.` });
  }

  rebuildCache({ force = false } = {}) {
    this._setStatus({ ready: false, message: 'Caching...' });

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
        this._setStatus({ ready: false, message: `Cached ${count}/${totalCount} items.` });
        nextReportAt += blockSize;
      }
    }

    this.engine.dumpCache(this.cacheFile).catch((err) => {
      console.error(`Failed to write cache to ${this.cacheFile}:`, err);
    });
    this._setStatus({ ready: true, message: 'Ready.' });
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
