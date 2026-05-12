'use strict';

const path = require('node:path');
const { Tray, Menu, nativeImage } = require('electron');

const { showAndFocus, toggleWindowVisibility } = require('./window.js');

const TRAY_ICON_PATH = path.join(__dirname, '..', '..', 'assets', 'icons', '16x16.png');

/**
 * Create the system tray icon. Returns null if the platform does not
 * support a tray (e.g. Linux WMs without a status notifier), so the
 * caller can fall back to quit-on-window-close behaviour.
 *
 * @param {{
 *   getWindow: () => import('electron').BrowserWindow | null | undefined,
 *   requestQuit: () => void,
 *   shortcut?: string | null,
 * }} options
 * @returns {import('electron').Tray | null}
 */
function createTray({ getWindow, requestQuit, shortcut }) {
  const icon = nativeImage.createFromPath(TRAY_ICON_PATH);
  let tray;
  try {
    tray = new Tray(icon);
  } catch (err) {
    console.warn('Failed to create system tray icon; continuing without tray.', err);
    return null;
  }
  tray.setToolTip(shortcut ? `unime (${shortcut})` : 'unime');

  const showLabel = shortcut ? `Show unime  (${shortcut})` : 'Show unime';
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: showLabel, click: () => showAndFocus(getWindow()) },
    { type: 'separator' },
    { label: 'Quit', click: () => requestQuit() },
  ]));

  tray.on('click', () => toggleWindowVisibility(getWindow()));

  return tray;
}

module.exports = { createTray };
