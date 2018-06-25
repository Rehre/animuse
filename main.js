const {
  app,
  ipcMain,
  dialog,
} = require('electron');

const openMP3 = require('./utils/openMP3');
const createWindow = require('./utils/createWindow');
const searchMP3 = require('./utils/searchMP3');

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('close-app', () => {
  app.quit();
});

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

ipcMain.on('open-folder', (event) => {
  const directory = dialog.showOpenDialog({
    title: 'Open Directories',
    properties: ['openDirectory'],
  });

  if (!directory) return;

  event.sender.send('clear-list'); // clear the list when searching for new file

  searchMP3(directory[0], (file) => {
    openMP3(file, (err, fileObject) => {
      if (err) event.sender.send('error-opening-searched-file', err);

      event.sender.send('add-file-to-list', fileObject);
    });
  });
});
