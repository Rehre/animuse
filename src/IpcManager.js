const {
  app,
  ipcMain,
  dialog,
} = require('electron');
const fs = require('fs');
const path = require('path');
const mp3Duration = require('mp3-duration');

const openMP3 = require('./utils/openMP3');
const searchMP3 = require('./utils/searchMP3');
const sendFileToMainWin = require('./utils/sendFileToMainWin');
const WindowManager = require('./WindowManager');
// duration for asyncFunction to run
let tagRunDuration = 0;
let timeRunDuration = 0;

let waitedAsyncFunction = []; // save all the async function in here
let waitedOpenMP3Function;

// when file is opened using app
ipcMain.on('get-opening-file', () => {
  const data = process.argv[1];

  if (!(data.length > 1)) return;

  openMP3(data, sendFileToMainWin);
});
// when the close event is called from the mainWindow then quit the app
ipcMain.on('close-app', () => {
  app.quit();
});
// use this when you want to send file to the mainWindow
ipcMain.on('open-file', (event, arg) => {
  const file = dialog.showOpenDialog({
    title: 'Open audio file',
    properties: ['open-file'],
    filters: [
      { name: 'Audio', extensions: ['mp3'] },
    ],
  });

  if (!file) return;
  if (arg === 'add') {
    tagRunDuration = 0;
    timeRunDuration = 0;
  }

  openMP3(file[0], (err, fileObject) => {
    if (arg === 'add') {
      event.sender.send('add-file-to-list', { filePath: fileObject.file, isTagged: false });
    } else {
      sendFileToMainWin(err, fileObject);
    }
  });
});
// use this to open a folder in the listWindow
ipcMain.on('open-folder', (event, arg) => {
  const directory = dialog.showOpenDialog({
    title: 'Open Directories',
    properties: ['openDirectory'],
  });

  if (!directory) return;

  if (arg !== 'add') event.sender.send('clear-list'); // clear the list when searching for new file
  tagRunDuration = 0; // clear the time duration for getting tag function to run smoothly
  timeRunDuration = 0; // same goes for this

  searchMP3(directory[0], (file) => {
    event.sender.send('add-file-to-list', { filePath: file, isTagged: false });
  });
});
// use this to open a listWindow
ipcMain.on('open-window', (event, arg) => {
  if (arg === 'list') {
    WindowManager.listWindow.show();
  }

  if (arg === 'setting') {
    WindowManager.settingWindow.show();
  }
});
// use this to send file or play specific music to mainWindow
ipcMain.on('send-file', (event, arg) => {
  clearTimeout(waitedOpenMP3Function);

  const cacheFilePath = path.join(__dirname, 'cache/cache.json');
  const cacheFile = JSON.parse(fs.readFileSync(cacheFilePath, { encoding: 'utf8' }));

  const fileToSendFirst = { file: arg.filePath };
  // if arg is already tagged
  let runThumbnailGetter = false;
  if (arg.isTagged && arg.tags.album) {
    // if the not found item is getting called
    if (!(cacheFile.thumbnailData[encodeURI(arg.tags.album)]) && arg.pictureData !== 'not found') {
      // run the new thumbnailgetter if the pictureData is already set before but different
      runThumbnailGetter = true;
    }

    arg.pictureData = cacheFile.thumbnailData[encodeURI(arg.tags.album)] || 'not found';
  }

  sendFileToMainWin(null, Object.assign({}, fileToSendFirst, arg));
  // if arg is not tagged
  if (!(arg.isTagged) || runThumbnailGetter) {
    waitedOpenMP3Function = setTimeout(() => openMP3(arg.filePath, sendFileToMainWin), 1000);
  }
});
// use this to send the change event(next or previous or random or loop-all-next) to list window
ipcMain.on('change-player-song', (event, arg) => {
  WindowManager.listWindow.webContents.send('change-song', arg);
});
// cancel all the asyc function and clear the array
ipcMain.on('cancel-all-async-function', (event) => {
  waitedAsyncFunction.forEach(item => clearTimeout(item.timeout));
  waitedAsyncFunction = [];
  event.sender.send('show-loading', 'remove');
});
// use this to get the song tags (this will automatically run the get duration from the listWindow)
ipcMain.on('get-song-tags', (event, audioFile) => {
  const { filePath } = audioFile;

  tagRunDuration += 500;
  event.sender.send('show-loading', 'show');

  const id = `${filePath.substr(filePath.lastIndexOf('\\')) + Math.floor(Math.random() * 10000)}tags`;
  const tagFunc = setTimeout(() => {
    openMP3(filePath, (err, data) => {
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
    event.sender.send('show-loading', 'show');

    mp3Duration(filePath, (err, data) => {
      const currentIndex = waitedAsyncFunction.findIndex(item => item.id === id);
      // if this function is run eventhough the waitedAsyncFunction is cleared then return;
      if (currentIndex < 0) return;
      waitedAsyncFunction.splice(currentIndex, 1);

      if (err) event.sender.send('error-update-duration', Object.assign({}, audioFile, { duration: data }));

      event.sender.send('show-loading', 'remove');
      event.sender.send('update-duration', Object.assign({}, audioFile, { duration: data }));
    });
  }, timeRunDuration);

  waitedAsyncFunction.push({ id, timeout: durationFunc });
});
// get the user setting and send to SettingWindow
ipcMain.on('get-setting', (event) => {
  const settings = fs.readFileSync(path.join(__dirname, 'userSetting.json'), { encoding: 'utf8' });
  const settingsObject = JSON.parse(settings);

  event.sender.send('sended-setting', settingsObject);
});
// change setting in userSetting.json
ipcMain.on('change-setting', (event, arg) => {
  const userSettingsPath = path.join(__dirname, 'userSetting.json');

  const settings = fs.readFileSync(userSettingsPath, { encoding: 'utf8' });
  const settingsObject = JSON.parse(settings);

  settingsObject[arg.properties] = arg.value;

  if (arg.sendToAll) {
    WindowManager.mainWindow.webContents.send('sended-setting', settingsObject);
    WindowManager.listWindow.webContents.send('sended-setting', settingsObject);
    WindowManager.settingWindow.webContents.send('sended-setting', settingsObject);
  } else {
    event.sender.send('sended-setting', settingsObject);
  }

  fs.writeFileSync(userSettingsPath, JSON.stringify(settingsObject));
});
