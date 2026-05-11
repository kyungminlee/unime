'use strict';

const path = require('node:path');
const { app } = require('electron');

const { createMainWindow } = require('./window.js');
const { buildAppMenu } = require('./menu.js');
const { UCDWorker } = require('./ucd/worker.js');

const DATA_DIR = path.join(__dirname, '..', 'data');

const paths = {
  ucd: path.join(DATA_DIR, 'ucd.nounihan.simplified.json'),
  config: path.join(DATA_DIR, 'config.json'),
  aliasCache: path.join(DATA_DIR, 'aliasCache.json'),
  userCache: () => path.join(app.getPath('userData'), 'cache.json'),
};

const state = {
  /** @type {import('electron').BrowserWindow | null} */
  window: null,
  /** @type {UCDWorker | null} */
  worker: null,
};

function start() {
  state.window = createMainWindow();
  state.window.on('closed', () => { state.window = null; });
  buildAppMenu(() => state.window);
  state.worker = new UCDWorker({
    dataFile: paths.ucd,
    configFile: paths.config,
    aliasCacheFile: paths.aliasCache,
    cacheFile: paths.userCache(),
  });
}

function shutdown() {
  state.worker?.dumpCacheSync();
}

app.whenReady().then(start);

app.on('activate', () => {
  if (state.window === null) {
    state.window = createMainWindow();
  }
});

app.on('before-quit', shutdown);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
