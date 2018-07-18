const jsmediatags = require('jsmediatags');
const fs = require('fs');

function getMediaTags(filePath, callback) {
  let data = fs.readFileSync(filePath);

  const stats = fs.statSync(filePath);
  const size = Math.round((stats.size / 1000000) * 100) / 100;

  jsmediatags.read(data, {
    onSuccess: (tag) => {
      callback(null, {
        filePath,
        size,
        tags: {
          title: tag.tags.title,
          album: tag.tags.album,
          artist: tag.tags.artist,
        },
        errorTag: false,
      });
    },
    onError: (error) => {
      callback(error, {
        filePath,
        size,
        errorTag: true,
      });
    },
  });

  data = undefined;
}

module.exports = getMediaTags;
