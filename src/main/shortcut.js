'use strict';

const { globalShortcut } = require('electron');

function showAndFocus(window) {
  if (!window) { return; }
  if (window.isMinimized()) { window.restore(); }
  window.show();
  window.focus();
}

/**
 * Register a global accelerator that toggles the main window's visibility.
 *
 * @param {{
 *   accelerator: string | null | undefined,
 *   getWindow: () => import('electron').BrowserWindow | null | undefined,
 * }} options
 * @returns {string | null} the accelerator that was actually registered, or
 *   null if none was registered (disabled in config, or registration failed).
 */
function registerGlobalShortcut({ accelerator, getWindow }) {
  if (!accelerator) { return null; }
  try {
    const ok = globalShortcut.register(accelerator, () => {
      const window = getWindow();
      if (!window) { return; }
      if (window.isVisible() && window.isFocused()) {
        window.hide();
      } else {
        showAndFocus(window);
      }
    });
    if (!ok) {
      console.warn(`Global shortcut "${accelerator}" could not be registered (already in use?).`);
      return null;
    }
    return accelerator;
  } catch (err) {
    console.error(`Failed to register global shortcut "${accelerator}":`, err);
    return null;
  }
}

function unregisterAll() {
  globalShortcut.unregisterAll();
}

module.exports = { registerGlobalShortcut, unregisterAll };
