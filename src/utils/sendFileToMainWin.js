const { mainWindow } = require('../WindowManager');
const openNotification = require('./openNotification');

function sendFileToMainWin(err, fileObject, cb = () => {}) {
  if (err) console.log(err);

  let songTitle = fileObject.file.substr(fileObject.file.lastIndexOf('\\') + 1);

  if (fileObject.tags) {
    if (fileObject.tags.title && fileObject.tags.title.length > 0) {
      songTitle = fileObject.tags.title;
    }
  }

  mainWindow.webContents.send('opened-file', fileObject);

  cb();

  openNotification('Playing', songTitle);
}

module.exports = sendFileToMainWin;
