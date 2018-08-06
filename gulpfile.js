const gulp = require('gulp');
const { spawn } = require('child_process');
const electron = require('electron-connect').server.create();

gulp.task('default', ['view:server', 'serve:client'], () => console.log('task completed'));

gulp.task('view:server', () => {
  console.log('running view server...');

  const cmd = spawn('cmd', { detached: true });

  cmd.stdin.write('npm run dev:server\n');

  cmd.stdout.on('data', data => console.log(data.toString()));
  cmd.on('close', (code) => {
    console.log(`view:server exited with code ${code}`);
  });
});

gulp.task('serve:client', () => {
  console.log('Starting client...');
  // start electron development client
  electron.start(null, () => console.log('Started.'));
  // watch the file
  gulp.watch(['./src/*.js', './src/utils/*.js', './src/userDefaultSetting/*.js'], () => {
    console.log('Restarting...');
    electron.restart(null, () => console.log('restarted.'));
  });
});
