const { Notification } = require('electron');
const fs = require('fs');
const path = require('path');

let notification;

function openNotification(title, body) {
  // look at the setting if true then show
  const settings = fs.readFileSync(path.join(__dirname, '../', 'userSetting.json'), { encoding: 'utf8' });
  const notificationSettings = JSON.parse(settings).notification;
  if (!notificationSettings) return;

  if (notification) notification.close();

  notification = new Notification({
    title,
    body,
    silent: true,
  });

  notification.show();
}

module.exports = openNotification;
