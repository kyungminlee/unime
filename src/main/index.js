'use strict';

const path = require('node:path');
const { app } = require('electron');

const { createMainWindow, showAndFocus } = require('./window.js');
const { buildAppMenu } = require('./menu.js');
const { createTray } = require('./tray.js');
const { registerGlobalShortcut, unregisterShortcuts } = require('./shortcut.js');
const { loadConfig } = require('./ucd/config.js');
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
  shutdownRan: false,
};

function isQuitRequested() {
  return state.isQuitting;
}

function requestQuit() {
  state.isQuitting = true;
  app.quit();
}

function start() {
  const config = loadConfig(paths.config);

  // The shortcut callback uses `state.window` lazily, so registering
  // before the window exists is safe — early presses are no-ops.
  const activeShortcut = registerGlobalShortcut({
    accelerator: config.shortcut,
    getWindow: () => state.window,
  });

  // Try to create the tray first so we know whether to keep the app
  // alive after the window is closed. On platforms without a working
  // status notifier, the tray is null and we fall back to
  // quit-on-window-all-closed (see the handler below).
  state.tray = createTray({
    getWindow: () => state.window,
    requestQuit,
    shortcut: activeShortcut,
  });
  const trayAvailable = state.tray !== null;

  state.window = createMainWindow({
    isQuitRequested: trayAvailable ? isQuitRequested : undefined,
  });
  state.window.on('closed', () => { state.window = null; });

  // Worker registers ipcMain handlers synchronously in its constructor;
  // the renderer hasn't loaded yet, so no IPC can arrive before the
  // handlers are wired.
  state.worker = new UCDWorker({
    dataFile: paths.ucd,
    configFile: paths.config,
    aliasCacheFile: paths.aliasCache,
    cacheFile: paths.userCache(),
    getWebContents: () => state.window?.webContents ?? null,
  });

  buildAppMenu({
    getWindow: () => state.window,
    getWorker: () => state.worker,
  });

  state.window.webContents.once('did-finish-load', () => {
    state.worker?.rebuildCache({ force: false });
  });
}

function shutdown() {
  if (state.shutdownRan) { return; }
  state.shutdownRan = true;
  unregisterShortcuts();
  state.worker?.dumpCacheSync();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showAndFocus(state.window));
  app.on('activate', () => {
    if (state.isQuitting) { return; }
    if (state.window) {
      showAndFocus(state.window);
    } else {
      state.window = createMainWindow({ isQuitRequested });
      state.window.on('closed', () => { state.window = null; });
    }
  });
  app.on('before-quit', () => {
    state.isQuitting = true;
    shutdown();
  });
  // `will-quit` is the last chance to flush state before the process
  // exits; idempotent so it is safe alongside `before-quit`.
  app.on('will-quit', shutdown);
  // Process signals (SIGINT, SIGTERM, session-end) bypass Electron's
  // quit events, so flush the cache here too.
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      shutdown();
      app.exit(0);
    });
  }
  // When no tray is available (e.g. Linux without a status notifier),
  // fall back to the conventional quit-on-window-close behaviour on
  // non-darwin so the user is not left with a zombie process.
  app.on('window-all-closed', () => {
    if (!state.tray && process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.whenReady().then(start);
}
