const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');

class WindowManager {
  constructor() {
    this.mainWindow = '';
    this.listWindow = '';
    this.settingWindow = '';
    this.urlMain = (!isDev) ? `file://${__dirname}/../production/index.html` : 'http://localhost:3000';
    this.urlList = (!isDev) ? `file://${__dirname}/../production/index.html#/list` : 'http://localhost:3000#/list';
    this.urlSetting = (!isDev) ? `file://${__dirname}/../production/index.html#/setting` : 'http://localhost:3000#/setting';

    this.initiateWindow = this.initiateWindow.bind(this);
  }

  // run the initiate to create the window
  initiateWindow() {
    // create window instance for every property
    this.mainWindow = new BrowserWindow({
      width: 400,
      height: 200,
      frame: false,
      show: false,
      resizable: false,
      maximizable: false,
      webPreferences: { webSecurity: false },
    });

    this.listWindow = new BrowserWindow({
      width: 400,
      height: 600,
      frame: false,
      resizable: false,
      maximizable: false,
      show: false,
      webPreferences: { webSecurity: false },
    });

    this.settingWindow = new BrowserWindow({
      width: 400,
      height: 600,
      frame: false,
      resizable: false,
      maximizable: false,
      show: false,
      webPreferences: { webSecurity: false },
    });

    // load url for every window
    this.mainWindow.loadURL(this.urlMain);
    this.listWindow.loadURL(this.urlList);
    this.settingWindow.loadURL(this.urlSetting);
    // if main window is closed then quit the app
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      this.listWindow = null;
      this.settingWindow = null;

      app.quit();
    });
    // wait for react to render and show it
    this.mainWindow.on('ready-to-show', () => {
      this.mainWindow.show();
      this.mainWindow.focus();
    });
    // if listWindow is closing prevent the default event and hide it instead
    this.listWindow.on('close', (event) => {
      // if main window is closed when list window is hidden return null;
      if (!(this.listWindow)) return;

      this.listWindow.hide();
      event.preventDefault();
    });

    this.settingWindow.on('close', (event) => {
      // if main window is closed when list window is hidden return null;
      if (!(this.settingWindow)) return;

      this.settingWindow.hide();
      event.preventDefault();
    });
    // when the list window is showed focus it
    this.listWindow.on('show', () => {
      this.listWindow.focus();
    });

    this.settingWindow.on('show', () => {
      this.settingWindow.focus();
    });
    // run the developer tools if in development mode
    if (isDev) {
      BrowserWindow.addDevToolsExtension('C:\\Users\\WIN 10\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\fmkadmapgofadopljbjfkapdkoienihi\\3.2.4_0');
      this.mainWindow.webContents.openDevTools();
      this.listWindow.webContents.openDevTools();
      this.settingWindow.webContents.openDevTools();
    }
  }
}
// create new object
const WindowsInstance = new WindowManager();
// return the object for evey import so it will get only 1 object every call
module.exports = WindowsInstance;
