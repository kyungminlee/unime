'use strict';

const { app, Menu, shell } = require('electron');

const CHANNELS = require('../shared/channels.js');

const REPO_URL = 'https://github.com/kyungminlee/unime';

function buildAppMenu(getWindow) {
  const isMac = process.platform === 'darwin';

  const sendToRenderer = (channel, payload) => {
    getWindow()?.webContents.send(channel, payload);
  };

  const template = [
    ...(isMac
      ? [{
        label: app.name,
        submenu: [
          { role: 'about' },
          { role: 'quit' },
        ],
      }]
      : []),
    { role: 'fileMenu' },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Rebuild Cache',
          click: () => sendToRenderer(CHANNELS.RECEIVE.CACHE, { force: true }),
        },
        {
          label: 'Clear Pinned History',
          click: () => sendToRenderer(CHANNELS.RECEIVE.CLEAR_HISTORY, { type: ['pinned'] }),
        },
        {
          label: 'Clear Unpinned History',
          click: () => sendToRenderer(CHANNELS.RECEIVE.CLEAR_HISTORY, { type: ['unpinned'] }),
        },
        {
          label: 'Clear All History',
          click: () => sendToRenderer(CHANNELS.RECEIVE.CLEAR_HISTORY, { type: ['pinned', 'unpinned'] }),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
          ]
          : [
            { role: 'close' },
          ]),
        {
          label: 'Always On Top',
          type: 'checkbox',
          checked: true,
          click: (menuItem) => getWindow()?.setAlwaysOnTop(menuItem.checked),
        },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: () => shell.openExternal(REPO_URL),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = { buildAppMenu };
