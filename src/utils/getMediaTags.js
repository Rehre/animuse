const jsmediatags = require('jsmediatags');
const fs = require('fs');

function getMediaTags(filePath, callback) {
  let data = fs.readFileSync(filePath);

  const stats = fs.statSync(filePath);
  const size = (stats.size / 1000000).toFixed(2);

  jsmediatags.read(data, {
    onSuccess: (tag) => {
      setTimeout(() => callback(null, {
        filePath,
        size,
        tags: {
          title: tag.tags.title,
          album: tag.tags.album,
          artist: tag.tags.artist,
        },
      }), 1000);
    },
    onError: (error) => {
      setTimeout(() => callback(error, {
        filePath,
        size,
      }), 1000);
    },
  });

  data = undefined;
}

module.exports = getMediaTags;
