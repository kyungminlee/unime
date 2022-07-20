const { Menu, MenuItem, session } = require('electron');
const electron = require('electron');
const path = require('path');

const { UCDWorker } = require(path.join(__dirname, 'lib', 'ucd_worker.js'));
// const {
//   Worker, isMainThread, parentPort, workerData
// } = require('node:worker_threads');

// const { Worker } = require('worker_threads')

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;
let ucdWorker;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600, 
    alwaysOnTop: true, 
    frame: true,
    icon: path.join(__dirname, 'assets', 'icons', 'png', '64x64.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`);
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Always On Top',
          click(menuItem, _browserWindow, _event) { 
            mainWindow.setAlwaysOnTop(menuItem.checked);
          },
          type: "checkbox",
          checked: true
        },
        {
          label: 'Rebuild Cache',
          click(_menuItem, browserWindow, _event) {
            mainWindow.webContents.send('cache', {force: true});
          },
          type: 'normal'
        },
        {
          role: "quit"
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
  })

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

// const { fork } = require('child_process');
// const ps = fork(path.join(__dirname, 'lib', 'ucdServer.js'));
// console.log('userData', app.getPath('userData'))