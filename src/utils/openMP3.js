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
      let pictureData = tag.tags.picture || 'not found';
      let alreadyCachedAlbumPic = false;

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

      if (cacheFile.thumbnailData[encodeURI(tag.tags.album)]) {
        pictureData = cacheFile.thumbnailData[encodeURI(tag.tags.album)];
        alreadyCachedAlbumPic = true;
      }

      if (pictureData !== 'not found' && !alreadyCachedAlbumPic) {
        const id = Date.now();

        let namePic = path.join(__dirname, '../', `/cache/img/${id}.jpeg`);
        let dataArray = jpeg.decode(pictureData.data);

        // replace the \\ because string is not escaped when sending to renderer
        namePic = namePic.replace(/\\/g, '\\\\');

        let rawImageData = {
          data: dataArray.data,
          width: dataArray.width,
          height: dataArray.height,
        };

        let dataImage = jpeg.encode(rawImageData, 50);
        // save image
        fs.writeFileSync(namePic, dataImage.data);

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
