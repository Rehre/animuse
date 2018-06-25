const { BrowserWindow, ipcMain, app } = require('electron');
const openMP3 = require('./openMP3');

let mainWindow; // main window variable
let listWindow; // list window variable

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    show: false,
    resizable: false,
    maximizable: false,
    webPreferences: { webSecurity: false },
  });

  listWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    resizable: false,
    maximizable: false,
    show: false,
    webPreferences: { webSecurity: false },
  });

  const urlHome = (process.env.PRODUCTION) ? './production/index.html' : 'http://localhost:3000';
  const urlList = (process.env.PRODUCTION) ? './production/index.html#/list' : 'http://localhost:3000#/list';

  mainWindow.on('closed', () => {
    mainWindow = null;
    listWindow = null;
    app.quit();
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  listWindow.on('close', (event) => {
    if (!listWindow) return;

    listWindow.hide();
    event.preventDefault();
  });

  listWindow.on('show', () => {
    listWindow.focus();
  });

  if (!process.env.PRODUCTION) {
    mainWindow.webContents.openDevTools();
    listWindow.webContents.openDevTools();
  }

  mainWindow.loadURL(urlHome);
  listWindow.loadURL(urlList);

  ipcMain.on('open-window', (event, arg) => {
    if (arg === 'list') {
      listWindow.show();
    }
  });

  ipcMain.on('send-file', (event, arg) => {
    mainWindow.webContents.send('opened-file', arg);
  });
}

module.exports = createWindow;
