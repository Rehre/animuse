const { app } = require('electron');

const WindowManager = require('./WindowManager');
require('./IpcManager');

app.on('ready', WindowManager.initiateWindow);

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
