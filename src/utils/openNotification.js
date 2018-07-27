const { app, Notification } = require('electron');
const fs = require('fs');
const path = require('path');

let notification;
let waitedNotification;

function openNotification(title, body) {
  // look at the setting if true then show
  const settings = fs.readFileSync(path.join(app.getPath('userData'), 'user-data', 'userSetting.json'), { encoding: 'utf8' });
  const notificationSettings = JSON.parse(settings).notification;
  if (!notificationSettings) return;

  if (notification) {
    notification.close();
    clearTimeout(waitedNotification);
  }

  notification = new Notification({
    title,
    body,
    silent: true,
  });

  waitedNotification = setTimeout(() => notification.show(), 1000);
}

module.exports = openNotification;
