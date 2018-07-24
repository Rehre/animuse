const fs = require('fs');
const jsmediatags = require('jsmediatags');
const jpeg = require('jpeg-js');
const path = require('path');

function openMP3(file, callback) {
  let data = fs.readFileSync(file);

  if (!data) callback('error', null);

  const cacheFilePath = path.join(__dirname, '../', '/cache/cache.json');
  const cacheFile = JSON.parse(fs.readFileSync(cacheFilePath, { encoding: 'utf8' }));

  // get the file size
  const stats = fs.statSync(file);
  const size = Math.round((stats.size / 1000000) * 100) / 100;

  jsmediatags.read(data, {
    onSuccess: (tag) => {
      let pictureData = tag.tags.picture;
      let alreadyCachedAlbumPic = false;

      if (cacheFile.thumbnailData[encodeURI(tag.tags.album)]) {
        pictureData = cacheFile.thumbnailData[encodeURI(tag.tags.album)];
        alreadyCachedAlbumPic = true;
      }

      if (pictureData && !alreadyCachedAlbumPic) {
        const id = Date.now();

        let namePic = path.join(__dirname, '../', `/cache/img/${id}.jpeg`);
        let dataArray = jpeg.decode(pictureData.data);
        namePic = namePic.replace(/\\/g, '\\\\');

        let rawImageData = {
          data: dataArray.data,
          width: dataArray.width,
          height: dataArray.height,
        };

        let dataImage = jpeg.encode(rawImageData, 50);

        fs.writeFileSync(namePic, dataImage.data);

        pictureData = namePic;
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

      if (!alreadyCachedAlbumPic) {
        cacheFile.thumbnailData[encodeURI(objectData.tags.album)] = pictureData;

        fs.writeFileSync(cacheFilePath, JSON.stringify(cacheFile));
      }

      tag = null;
    },
    onError: (error) => {
      callback(error, {
        file,
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
