const { app, ipcMain } = require('electron');
const fs = require('fs');

const WindowManager = require('./WindowManager');
const openMP3 = require('./utils/openMP3');
const sendFileToMainWin = require('./utils/sendFileToMainWin');

require('./IpcManager');

let argvPlayed;
// when the launched song ended clear the argv
ipcMain.on('song-ended', () => argvPlayed = undefined);

const cacheFolderPath = `${app.getPath('userData')}\\user-cache\\img\\`;

// if didnt exist create the cache folder in AppPath
if (!(fs.existsSync(cacheFolderPath))) {
  fs.mkdirSync(`${app.getPath('userData')}\\user-cache\\`);
  fs.mkdirSync(cacheFolderPath);
}

const shouldQuit = app.makeSingleInstance((argv) => {
  // if user tryng to run the seconds instance of app
  const { mainWindow } = WindowManager;

  if (mainWindow) {
    if (argv[1]) {
      if (argv[1] !== argvPlayed) {
        openMP3(argv[1], (err, fileObject) => {
          sendFileToMainWin(err, fileObject, () => argvPlayed = argv[1]);
        });
      }
    }

    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

if (shouldQuit) {
  app.quit();
} else {
  app.setAppUserModelId('com.akmal.animuse');
  // initiate app
  app.on('ready', WindowManager.initiateWindow);

  app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
