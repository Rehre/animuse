const path = require('path');

const WindowManager = require('../WindowManager');
const openNotification = require('./openNotification');

function sendFileToMainWin(err, fileObject, cb = () => {}, isWait) {
  if (err) console.log(err);

  let songTitle = path.basename(fileObject.file);

  if (fileObject.tags) {
    if (fileObject.tags.title && fileObject.tags.title.length > 0) {
      songTitle = fileObject.tags.title;
    }
  }

  WindowManager.mainWindow.webContents.send('opened-file', fileObject);

  cb();
  // should we show notification ?
  if (!isWait) openNotification('Playing', songTitle);
}

module.exports = sendFileToMainWin;
