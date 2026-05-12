'use strict';

const { globalShortcut } = require('electron');

const { toggleWindowVisibility } = require('./window.js');

/**
 * Register a global accelerator that toggles the main window's visibility.
 *
 * @param {{
 *   accelerator: string | null | undefined,
 *   getWindow: () => import('electron').BrowserWindow | null | undefined,
 * }} options
 * @returns {string | null} the accelerator that was actually registered,
 *   or null if none was registered (disabled in config, or registration
 *   failed because the binding is already in use).
 */
function registerGlobalShortcut({ accelerator, getWindow }) {
  if (!accelerator) { return null; }
  try {
    const ok = globalShortcut.register(accelerator, () => {
      toggleWindowVisibility(getWindow());
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

/** Release any global accelerators we registered. Safe to call multiple times. */
function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

module.exports = { registerGlobalShortcut, unregisterShortcuts };
