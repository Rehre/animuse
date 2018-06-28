const fs = require('fs');
const jsmediatags = require('jsmediatags');
const btoa = require('btoa');

function openMP3(file, callback) {
  let data = fs.readFileSync(file);

  if (!data) callback('error', null);

  jsmediatags.read(data, {
    onSuccess: (tag) => {
      let pictureData = tag.tags.picture;

      if (pictureData) {
        let binary = '';
        const bytes = new Uint8Array(pictureData.data);
        const len = bytes.byteLength;

        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }

        pictureData = `data:${pictureData.format};base64,${btoa(binary)}`;
      }

      callback(null, {
        file,
        pictureData,
      });
    },
    onError: (error) => {
      callback(error, { file });
    },
  });

  data = undefined;
}

module.exports = openMP3;
