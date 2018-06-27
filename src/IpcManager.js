const {
  app,
  ipcMain,
  dialog,
} = require('electron');

const openMP3 = require('./utils/openMP3');
const searchMP3 = require('./utils/searchMP3');
const WindowManager = require('./WindowManager');

// when the close event is called from the mainWindow then quit the app
ipcMain.on('close-app', () => {
  app.quit();
});
// use this when you want to send file to the mainWindow
ipcMain.on('open-file', (event) => {
  const file = dialog.showOpenDialog({
    title: 'Open audio file',
    properties: ['open-file'],
    filters: [
      { name: 'Audio', extensions: ['mp3'] },
    ],
  });

  if (!file) return;

  openMP3(file[0], (err, fileObject) => {
    if (err) event.sender.send('error-opening-mp3', err);

    event.sender.send('opened-file', fileObject);
  });
});
// use this to open a folder in the listWindow
ipcMain.on('open-folder', (event) => {
  const directory = dialog.showOpenDialog({
    title: 'Open Directories',
    properties: ['openDirectory'],
  });

  if (!directory) return;

  event.sender.send('clear-list'); // clear the list when searching for new file

  searchMP3(directory[0], (file) => {
    event.sender.send('add-file-to-list', file);
  });
});
// use this to open a listWindow
ipcMain.on('open-window', (event, arg) => {
  if (arg === 'list') {
    WindowManager.listWindow.show();
  }
});
// use this to send file or play specific music to mainWindow
ipcMain.on('send-file', (event, arg) => {
  openMP3(arg, (err, fileObject) => {
    if (err) WindowManager.mainWindow.webContents.send('send-failed-error', err);

    WindowManager.mainWindow.webContents.send('opened-file', fileObject);
  });
});
// use this to send the change event(next or previous) to list window
ipcMain.on('change-player-song', (event, arg) => {
  WindowManager.listWindow.webContents.send('change-song', arg);
});
