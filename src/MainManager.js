const { app, ipcMain } = require('electron');

const WindowManager = require('./WindowManager');
const openMP3 = require('./utils/openMP3');
const openNotification = require('./utils/openNotification');
require('./IpcManager');

let argvPlayed;

ipcMain.on('song-ended', () => argvPlayed = undefined);

const shouldQuit = app.makeSingleInstance((argv) => {
  // if user tryng to run the seconds instance of app
  const { mainWindow } = WindowManager;

  if (mainWindow) {
    if (argv[1]) {
      if (argv[1] !== argvPlayed) {
        openMP3(argv[1], (err, fileObject) => {
          if (err) console.log(err);

          let songTitle = fileObject.file.substr(fileObject.file.lastIndexOf('\\') + 1);

          if (fileObject.tags) {
            if (fileObject.tags.title && fileObject.tags.title.length > 0) {
              songTitle = fileObject.tags.title;
            }
          }

          mainWindow.webContents.send('opened-file', fileObject);

          argvPlayed = argv[1];

          openNotification('Playing', songTitle);
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
