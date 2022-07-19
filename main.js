const { Menu, MenuItem, ipcMain } = require('electron');
const electron = require('electron');
const path = require('path');

const UCD = require(path.join(__dirname, 'lib', 'ucd.js'));
const ucdWorker = require(path.join(__dirname, 'lib', 'ucd_worker.js'));

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600, 
    alwaysOnTop: true, 
    frame: true,
    icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`);

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
    mainWindow.webContents.send("requestStatus", {});
  });

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
