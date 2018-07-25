const { app } = require('electron');
const fs = require('fs');
const jsmediatags = require('jsmediatags');
const jpeg = require('jpeg-js');
const path = require('path');

function openMP3(file, callback, breaktrough) {
  let data = fs.readFileSync(file);

  if (!data) callback('error', null);

  const cacheFilePath = path.join(__dirname, '../', 'cache.json');
  const cacheFile = JSON.parse(fs.readFileSync(cacheFilePath, { encoding: 'utf8' }));

  const cacheFolderPath = `${app.getPath('userData')}\\user-cache\\img\\`;
  let shouldIUpdate = false;
  // if didnt exist create the cache folder in AppPath
  if (!(fs.existsSync(cacheFolderPath))) {
    shouldIUpdate = true;
    fs.mkdirSync(`${app.getPath('userData')}\\user-cache\\`);
    fs.mkdirSync(cacheFolderPath);
  }

  if (breaktrough) shouldIUpdate = true;

  // get the file size
  const stats = fs.statSync(file);
  const size = Math.round((stats.size / 1000000) * 100) / 100;

  jsmediatags.read(data, {
    onSuccess: (tag) => {
      let pictureData = tag.tags.picture || 'not found';
      let alreadyCachedAlbumPic = false;
      // if has the thumbnail but no album
      if (tag.tags.album === undefined && pictureData !== 'not found') {
        let albumWord = 'thisconfuseme';
        // check if the there is file with same album like this
        const cacheFilekeys = Object.keys(cacheFile.thumbnailData);
        // change it according to number
        let found = 0;
        cacheFilekeys.forEach((item) => {
          if (item === albumWord) found += 1;

          albumWord = `${albumWord} ${found}`;
        });

        tag.tags.album = albumWord;
      }

      if (!shouldIUpdate && cacheFile.thumbnailData[encodeURI(tag.tags.album)]) {
        // if thumbnail file is deleted
        if (!(fs.existsSync(cacheFile.thumbnailData[encodeURI(tag.tags.album)]))) {
          shouldIUpdate = true;
        } else {
          pictureData = cacheFile.thumbnailData[encodeURI(tag.tags.album)];
          alreadyCachedAlbumPic = true;
        }
      }

      if ((pictureData !== 'not found' && !alreadyCachedAlbumPic) || shouldIUpdate) {
        const id = Date.now();
        let namePic = path.join(cacheFolderPath, `${id}.jpeg`);
        let dataArray = jpeg.decode(pictureData.data);

        // add the quote to namePic so the path will be readed by app and escape the slash
        namePic = namePic.replace(/\\/g, '\\\\');
        namePic = `"${namePic}"`;

        let rawImageData = {
          data: dataArray.data,
          width: dataArray.width,
          height: dataArray.height,
        };

        let dataImage = jpeg.encode(rawImageData, 50);
        // save image
        fs.writeFileSync(path.join(cacheFolderPath, `${id}.jpeg`), dataImage.data);

        // clean memory
        pictureData = namePic;
        // save to cache
        cacheFile.thumbnailData[encodeURI(tag.tags.album)] = pictureData;
        fs.writeFileSync(cacheFilePath, JSON.stringify(cacheFile));

        dataImage = null;
        dataArray = null;
        rawImageData = null;
      }

      const objectData = {
        file, // for MainWindow
        filePath: file, // for ListWindow
        size,
        pictureData,
        tags: {
          title: tag.tags.title,
          album: tag.tags.album,
          artist: tag.tags.artist,
        },
        errorTag: false,
        isTagged: true,
      };

      callback(null, objectData);

      tag = null;
    },
    onError: (error) => {
      callback(error, {
        file,
        pictureData: 'not found',
        filePath: file,
        errorTag: false,
        size,
        isTagged: true,
      });
    },
  });

  data = undefined;
}

module.exports = openMP3;
