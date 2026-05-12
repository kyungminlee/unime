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

/**
 * Reveal a window, restoring it from a minimized state and bringing it
 * to the foreground.
 * @param {import('electron').BrowserWindow | null | undefined} window
 */
function showAndFocus(window) {
  if (!window || window.isDestroyed()) { return; }
  if (window.isMinimized()) { window.restore(); }
  window.show();
  window.focus();
}

/**
 * Toggle a window between hidden and visible+focused. A window that is
 * visible but on another desktop / not focused is brought forward
 * rather than hidden.
 * @param {import('electron').BrowserWindow | null | undefined} window
 */
function toggleWindowVisibility(window) {
  if (!window || window.isDestroyed()) { return; }
  if (window.isVisible() && window.isFocused()) {
    window.hide();
  } else {
    showAndFocus(window);
  }
}

/**
 * @param {{
 *   isQuitRequested?: () => boolean,
 *   [key: string]: unknown,
 * }} [options] When `isQuitRequested` is supplied, closing the window
 *   hides it instead of destroying it unless the caller has signalled
 *   that the app is actually quitting.
 */
function createMainWindow({ isQuitRequested, ...overrides } = {}) {
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

  if (isQuitRequested) {
    window.on('close', (event) => {
      if (!isQuitRequested()) {
        event.preventDefault();
        window.hide();
      }
    });
  }

  window.loadFile(path.join(ROOT, 'renderer', 'index.html'));
  return window;
}

module.exports = {
  createMainWindow,
  showAndFocus,
  toggleWindowVisibility,
  DEFAULT_ALWAYS_ON_TOP,
};
