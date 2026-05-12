'use strict';

const path = require('node:path');
const { app } = require('electron');

const { createMainWindow } = require('./window.js');
const { buildAppMenu } = require('./menu.js');
const { createTray } = require('./tray.js');
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
  /** @type {import('electron').Tray | null} */
  tray: null,
  isQuitting: false,
};

function showWindow() {
  const window = state.window;
  if (!window) { return; }
  if (window.isMinimized()) { window.restore(); }
  window.show();
  window.focus();
}

function start() {
  state.window = createMainWindow({ shouldQuit: () => state.isQuitting });
  state.worker = new UCDWorker({
    dataFile: paths.ucd,
    configFile: paths.config,
    aliasCacheFile: paths.aliasCache,
    cacheFile: paths.userCache(),
    getWebContents: () => state.window?.webContents ?? null,
  });
  buildAppMenu({ getWindow: () => state.window, getWorker: () => state.worker });
  state.tray = createTray({
    getWindow: () => state.window,
    requestQuit: () => {
      state.isQuitting = true;
      app.quit();
    },
  });
  state.window.webContents.once('did-finish-load', () => {
    state.worker?.rebuildCache({ force: false });
  });
}

function shutdown() {
  state.worker?.dumpCacheSync();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  app.whenReady().then(start);
}

app.on('activate', () => {
  if (state.window) {
    showWindow();
  } else {
    state.window = createMainWindow({ shouldQuit: () => state.isQuitting });
  }
});

app.on('before-quit', () => {
  state.isQuitting = true;
  shutdown();
});

// Tray keeps the app alive even when no window is visible, so do not
// quit on window-all-closed. The user quits explicitly via the tray
// menu or the application menu.
