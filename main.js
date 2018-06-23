const { app, BrowserWindow } = require('electron');

function createWindow() {
  let win = new BrowserWindow({ width: 400, height: 200, frame: false });

  win.on('closed', () => {
    win = null;
  });

  const url = (process.env.PRODUCTION) ? './production/index.html' : 'http://localhost:3000';

  win.loadURL(url);
}

app.on('ready', createWindow);
