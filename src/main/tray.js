'use strict';

const path = require('node:path');
const { Tray, Menu, nativeImage } = require('electron');

const TRAY_ICON_PATH = path.join(__dirname, '..', '..', 'assets', 'icons', '16x16.png');

function showAndFocus(window) {
  if (!window) { return; }
  if (window.isMinimized()) { window.restore(); }
  window.show();
  window.focus();
}

/**
 * @param {{
 *   getWindow: () => import('electron').BrowserWindow | null | undefined,
 *   requestQuit: () => void,
 * }} options
 */
function createTray({ getWindow, requestQuit }) {
  const tray = new Tray(nativeImage.createFromPath(TRAY_ICON_PATH));
  tray.setToolTip('unime');

  const toggle = () => {
    const window = getWindow();
    if (!window) { return; }
    if (window.isVisible() && !window.isMinimized()) {
      window.hide();
    } else {
      showAndFocus(window);
    }
  };

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show unime', click: () => showAndFocus(getWindow()) },
    { type: 'separator' },
    { label: 'Quit', click: () => requestQuit() },
  ]);
  tray.setContextMenu(contextMenu);

  // Left-click toggles on Windows/Linux. macOS shows the menu on click, so
  // also wire the click handler — users can still right-click for menu.
  tray.on('click', toggle);

  return tray;
}

module.exports = { createTray };
