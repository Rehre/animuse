const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
} = require('electron');
const fs = require('fs');
const jsmediatags = require('jsmediatags');
const btoa = require('btoa');

function createWindow() {
  let win = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    maximizable: false,
    webPreferences: { webSecurity: false },
  });
  const url = (process.env.PRODUCTION) ? './production/index.html' : 'http://localhost:3000';

  win.on('closed', () => {
    win = null;
  });

  if (!process.env.PRODUCTION) {
    win.webContents.openDevTools();
  }

  win.loadURL(url);
  win.isResizable(false);
}

app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
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

  fs.readFile(file[0], (err, data) => {
    if (err) alert('error reading file');

    jsmediatags.read(data, {
      onSuccess: (tag) => {
        let pictureData = tag.tags.picture;

        if (pictureData) {
          let binary = '';
          const bytes = new Uint8Array(pictureData.data);
          const len = bytes.byteLength;

          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }

          pictureData = `data:${pictureData.format};base64,${btoa(binary)}`;
        }

        event.sender.send('opened-file', {
          file: file[0],
          pictureData,
        });
      },
      onError: (error) => {
        alert(error);
      },
    });
  });
});
