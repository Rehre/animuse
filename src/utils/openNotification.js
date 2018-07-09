const { Notification } = require('electron');

let notification;

function openNotification(title, body) {
  if (notification) notification.close();

  notification = new Notification({
    title,
    body,
    silent: true,
  });

  notification.show();
}

module.exports = openNotification;
