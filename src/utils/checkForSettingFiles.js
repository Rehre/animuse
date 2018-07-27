const { app } = require('electron');
const fs = require('fs');

// default files
const userSetting = require('../userDefaultSetting/userSetting');
const cache = require('../userDefaultSetting/cache');

function checkForSettingFiles() {
  const userDataFolderPath = `${app.getPath('userData')}\\user-data\\`;
  const userCacheFolderPath = `${app.getPath('userData')}\\user-cache\\`;

  const userSettingFilePath = `${userDataFolderPath}\\userSetting.json`;
  const userCacheSettingFilePath = `${userDataFolderPath}\\cache.json`;
  const cacheIMGFolderPath = `${app.getPath('userData')}\\user-cache\\img\\`;

  // if doesnt exist create the user-data in %APPDATA%
  if (!(fs.existsSync(userDataFolderPath))) {
    fs.mkdirSync(userDataFolderPath);
    fs.writeFileSync(userSettingFilePath, JSON.stringify(userSetting));
    fs.writeFileSync(userCacheSettingFilePath, JSON.stringify(cache));
  }

  // if the user setting file doesnt exist  create it
  if (!(fs.existsSync(userSettingFilePath))) {
    fs.writeFileSync(userSettingFilePath, JSON.stringify(cache));
  }

  // if the cache setting file doesnt exist  create it
  if (!(fs.existsSync(userCacheSettingFilePath))) {
    fs.writeFileSync(userCacheSettingFilePath, JSON.stringify(cache));
  }

  // if doesnt exist create the cache folder in %APPDATA%
  if (!(fs.existsSync(cacheIMGFolderPath))) {
    fs.mkdirSync(userCacheFolderPath);
    fs.mkdirSync(cacheIMGFolderPath);

    return true;
  }

  return false;
}

module.exports = checkForSettingFiles;
