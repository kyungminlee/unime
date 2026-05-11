'use strict';

const path = require('node:path');
const { BrowserWindow } = require('electron');

const ROOT = path.join(__dirname, '..');

const DEFAULT_ALWAYS_ON_TOP = true;

const DEFAULT_WINDOW_OPTIONS = Object.freeze({
  width: 400,
  height: 600,
  alwaysOnTop: DEFAULT_ALWAYS_ON_TOP,
  frame: true,
});

function createMainWindow(overrides = {}) {
  const window = new BrowserWindow({
    ...DEFAULT_WINDOW_OPTIONS,
    ...overrides,
    icon: path.join(ROOT, '..', 'assets', 'icons', '96x96.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(ROOT, 'preload', 'index.js'),
    },
  });

  window.loadFile(path.join(ROOT, 'renderer', 'index.html'));
  return window;
}

module.exports = { createMainWindow, DEFAULT_ALWAYS_ON_TOP };
