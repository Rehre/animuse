const { app } = require('electron');
const fs = require('fs');
const jpeg = require('jpeg-js');
const jsmediatags = require('jsmediatags');

const path = require('path');

const checkForSettingFiles = require('../utils/checkForSettingFiles');

function openMP3(file, callback, breaktrough) {
  try {
    let data = fs.readFileSync(file);

    if (!data) callback('error', null);
    // should i update the tag ?
    let shouldIUpdate = checkForSettingFiles();

    const cacheFilePath = path.join(app.getPath('userData'), 'user-data', 'cache.json');
    const cacheFile = JSON.parse(fs.readFileSync(cacheFilePath, { encoding: 'utf8' }));
    const cacheIMGFolderPath = `${app.getPath('userData')}\\user-cache\\img\\`;

    // force update the cache img
    if (breaktrough) shouldIUpdate = true;

    // get the file size
    const stats = fs.statSync(file);
    const size = Math.round((stats.size / 1000000) * 100) / 100;

    jsmediatags.read(data, {
      onSuccess: (tag) => {
        let pictureData = tag.tags.picture || 'not found';
        let alreadyCachedAlbumPic = false;

        if (tag.tags) {
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
          // if shouldIUpdate is false and thumbnail file is cached
          if (!shouldIUpdate && cacheFile.thumbnailData[encodeURI(tag.tags.album)]) {
            // if thumbnail file is deleted
            if (!(fs.existsSync(cacheFile.thumbnailData[encodeURI(tag.tags.album)]))) {
              shouldIUpdate = true;
            } else {
              pictureData = cacheFile.thumbnailData[encodeURI(tag.tags.album)];
              alreadyCachedAlbumPic = true;
            }
          }

          if ((pictureData !== 'not found' && !alreadyCachedAlbumPic) || (pictureData !== 'not found' && shouldIUpdate)) {
            const id = Date.now(); // image id
            const isPNG = pictureData.format.toLowerCase().includes('png');
            const imgFormat = (isPNG) ? '.png' : '.jpeg';

            let namePic = path.join(cacheIMGFolderPath, `${id}${imgFormat}`);
            let dataArray;
            let rawImageData;
            let dataImage;

            try {
              if (!isPNG) {
                dataArray = jpeg.decode(pictureData.data);

                rawImageData = {
                  data: dataArray.data,
                  width: dataArray.width,
                  height: dataArray.height,
                };

                dataImage = jpeg.encode(rawImageData, 50);
                // save image
                fs.writeFileSync(path.join(cacheIMGFolderPath, `${id}.jpeg`), dataImage.data);
              } else {
                const buffer = Buffer.alloc(pictureData.data.length);

                pictureData.data.forEach((item, index) => buffer[index] = item);

                fs.writeFileSync(path.join(cacheIMGFolderPath, `${id}.png`), buffer);
              }
            } catch (e) {
              namePic = 'not found';
            }
            // add the quote to namePic so the path will be readed by app and escape the slash
            namePic = namePic.replace(/\\/g, '\\\\');

            // clean memory
            pictureData = namePic;
            // save to cache
            cacheFile.thumbnailData[encodeURI(tag.tags.album)] = pictureData;
            fs.writeFileSync(cacheFilePath, JSON.stringify(cacheFile));

            dataImage = null;
            dataArray = null;
            rawImageData = null;
          }
        }

        const objectData = {
          file, // for MainWindow
          filePath: file, // for ListWindow
          size,
          pictureData,
          tags: {
            title: tag.tags.title || undefined,
            album: tag.tags.album || undefined,
            artist: tag.tags.artist || undefined,
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
  } catch (err) {
    console.log(err);
  }
}

module.exports = openMP3;
