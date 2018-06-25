const fs = require('fs');

function searchMP3(directory, callback) {
  fs.readdir(directory, (err, files) => {
    files.forEach((file) => {
      const stats = fs.statSync(`${directory}\\${file}`);

      if (stats.isDirectory()) {
        searchMP3(`${directory}\\${file}`, callback);
      }

      if (stats.isFile()) {
        if (file.match(/\.mp3$/)) callback(`${directory}\\${file}`);
      }
    });
  });
}

module.exports = searchMP3;
