const path = require('node:path');
const { app, BrowserWindow, Menu, shell } = require('electron');
const { UCDWorker } = require('./lib/ucdWorker.js');

let mainWindow;
let ucdWorker;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    alwaysOnTop: true,
    frame: true,
    icon: path.join(__dirname, '..', 'assets', 'icons', '96x96.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const isMac = process.platform === 'darwin';

  const sendToRenderer = (channel, payload) => {
    mainWindow?.webContents.send(channel, payload);
  };

  const menu = Menu.buildFromTemplate([
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { role: 'quit' },
      ],
    }] : []),
    { role: 'fileMenu' },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Rebuild Cache',
          click: () => sendToRenderer('cache', { force: true }),
        },
        {
          label: 'Clear Pinned History',
          click: () => sendToRenderer('clearHistory', { type: ['pinned'] }),
        },
        {
          label: 'Clear Unpinned History',
          click: () => sendToRenderer('clearHistory', { type: ['unpinned'] }),
        },
        {
          label: 'Clear All History',
          click: () => sendToRenderer('clearHistory', { type: ['pinned', 'unpinned'] }),
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
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
        ] : [
          { role: 'close' },
        ]),
        {
          label: 'Always On Top',
          type: 'checkbox',
          checked: true,
          click: (menuItem) => mainWindow?.setAlwaysOnTop(menuItem.checked),
        },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: () => shell.openExternal('https://github.com/kyungminlee/unime'),
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  ucdWorker = new UCDWorker(
    path.join(__dirname, 'ucd.nounihan.simplified.json'),
    path.join(__dirname, 'config.json'),
    path.join(__dirname, 'aliasCache.json'),
    path.join(app.getPath('userData'), 'cache.json'),
  );
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    ucdWorker?.dumpCache();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
