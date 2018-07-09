const {
  app,
  ipcMain,
  dialog,
  // nativeImage,
} = require('electron');
const mp3Duration = require('mp3-duration');

const openMP3 = require('./utils/openMP3');
const searchMP3 = require('./utils/searchMP3');
const getMediaTags = require('./utils/getMediaTags');
const openNotification = require('./utils/openNotification');
const WindowManager = require('./WindowManager');
// duration for asyncFunction to run
let tagRunDuration = 0;
let timeRunDuration = 0;

let waitedAsyncFunction = []; // save all the async function in here
// when file is opened using app
ipcMain.on('get-opening-file', (event) => {
  const data = process.argv[1] || undefined;

  if (!data) return;

  openMP3(data, (err, fileObject) => {
    if (err) console.log(err);

    let songTitle = fileObject.file.substr(fileObject.file.lastIndexOf('\\') + 1);

    if (fileObject.tags) {
      if (fileObject.tags.title && fileObject.tags.title.length > 0) {
        songTitle = fileObject.tags.title;
      }
    }

    event.sender.send('opened-file', fileObject);

    openNotification('Playing', songTitle);
  });
});
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

    let songTitle = fileObject.file.substr(fileObject.file.lastIndexOf('\\') + 1);

    if (fileObject.tags) {
      if (fileObject.tags.title && fileObject.tags.title.length > 0) {
        songTitle = fileObject.tags.title;
      }
    }

    event.sender.send('opened-file', fileObject);

    openNotification('Playing', songTitle);
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
  tagRunDuration = 0; // clear the time duration for getting tag function to run smoothly
  timeRunDuration = 0; // same goes for this

  searchMP3(directory[0], (file) => {
    event.sender.send('add-file-to-list', { filePath: file });
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
    let songTitle = fileObject.file.substr(fileObject.file.lastIndexOf('\\') + 1);

    if (fileObject.tags) {
      if (fileObject.tags.title && fileObject.tags.title.length > 0) {
        songTitle = fileObject.tags.title;
      }
    }

    WindowManager.mainWindow.webContents.send('opened-file', fileObject);

    openNotification('Playing', fileObject.tags.title || songTitle);
  });
});
// use this to send the change event(next or previous or random or loop-all-next) to list window
ipcMain.on('change-player-song', (event, arg) => {
  WindowManager.listWindow.webContents.send('change-song', arg);
});
// cancel all the asyc function and clear the array
ipcMain.on('cancel-all-async-function', () => {
  waitedAsyncFunction.forEach(item => clearTimeout(item.timeout));
  waitedAsyncFunction = [];
});
// use this to get the song tags (this will automatically run the get duration from the listWindow)
ipcMain.on('get-song-tags', (event, audioFile) => {
  const { filePath } = audioFile;

  tagRunDuration += 500;

  const id = `${filePath.substr(filePath.lastIndexOf('\\')) + Math.floor(Math.random() * 10000)}tags`;
  const tagFunc = setTimeout(() => {
    getMediaTags(filePath, (err, data) => {
      const currentIndex = waitedAsyncFunction.findIndex(item => item.id === id);
      // if this function is run eventhough the waitedAsyncFunction is cleared then return;
      if (currentIndex < 0) return;
      waitedAsyncFunction.splice(currentIndex, 1);

      event.sender.send('update-tags', Object.assign({}, audioFile, data));
    });
  }, tagRunDuration);

  waitedAsyncFunction.push({ id, timeout: tagFunc });
});
// use this to get the song duration and send this to listWindow
ipcMain.on('get-song-duration', (event, audioFile) => {
  const { filePath } = audioFile;

  timeRunDuration += 500;

  const id = `${filePath.substr(filePath.lastIndexOf('\\')) + Math.floor(Math.random() * 10000)}duration`;
  const durationFunc = setTimeout(() => {
    mp3Duration(filePath, (err, data) => {
      const currentIndex = waitedAsyncFunction.findIndex(item => item.id === id);
      // if this function is run eventhough the waitedAsyncFunction is cleared then return;
      if (currentIndex < 0) return;
      waitedAsyncFunction.splice(currentIndex, 1);

      if (err) event.sender.send('error-update-duration', Object.assign({}, audioFile, { duration: data }));

      event.sender.send('update-duration', Object.assign({}, audioFile, { duration: data }));
    });
  }, timeRunDuration);

  waitedAsyncFunction.push({ id, timeout: durationFunc });
});
