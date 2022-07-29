const { app, Menu, MenuItem, session } = require('electron');
const electron = require('electron');
const path = require('path');

const { UCDWorker } = require(path.join(__dirname, 'lib', 'ucdWorker.js'));

//const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;
let ucdWorker;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600, 
    alwaysOnTop: true, 
    frame: true,
    icon: path.join(__dirname, '..', 'assets', 'icons', '96x96.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`);
  //mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
      mainWindow = null;
    });

  const isMac = process.platform === 'darwin';

  const menu = Menu.buildFromTemplate([
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { role: 'quit' }
      ]
    }] : []),
    { role: 'fileMenu' },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Rebuild Cache',
          click(_menuItem, _browserWindow, _event) {
            mainWindow.webContents.send('cache', {force: true});
          },
          type: 'normal'
        },
        {
          label: 'Clear Pinned History',
          click(_menuItem, _browserWindow, _event) {
            mainWindow.send('clearHistory', {type: ['pinned']});
          },
        },
        {
          label: 'Clear Unpinned History',
          click(_menuItem, _browserWindow, _event) {
            mainWindow.send('clearHistory', {type: ['unpinned']});
          },
        },
        {
          label: 'Clear All History',
          click(_menuItem, _browserWindow, _event) {
            mainWindow.send('clearHistory', {type: ['pinned', 'unpinned']});
          },
        },
      ]
    },
    { label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ]
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
          { role: 'close' }
        ]),
        {
          label: 'Always On Top',
          click(menuItem, _browserWindow, _event) { 
            mainWindow.setAlwaysOnTop(menuItem.checked);
          },
          type: 'checkbox',
          checked: true
        },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/kyungminlee/unime');
          }
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

app.whenReady()
  .then(createWindow)
  .then(async () => {
    ucdWorker = new UCDWorker(
      path.join(__dirname, 'ucd.nounihan.simplified.json'),
      path.join(__dirname, 'config.json'),
      path.join(__dirname, 'aliasCache.json'),
      path.join(app.getPath('userData'), 'cache.json')
    );
  });

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      ucdWorker.dumpCache();;
      app.quit();
    }
  });

app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
