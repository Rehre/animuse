/* eslint-env browser */
import React from 'react';

import './styles/MainWindow.css';
import Player from './component/Player';
import Statusbar from '../../common/Statusbar';

const { ipcRenderer, remote } = window.require('electron');

class MainWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      file: '',
      title: 'title',
      pictureData: undefined,
    };

    this.openFile = this.openFile.bind(this);
    this.renderImageThumbnail = this.renderImageThumbnail.bind(this);
  }

  componentDidMount() {
    ipcRenderer.on('opened-file', (event, arg) => {
      this.setState({
        file: arg.file,
        title: arg.file.substring(arg.file.length, arg.file.lastIndexOf('\\') + 1),
        pictureData: arg.pictureData,
      });
    });
  }

  openWindow(window) {
    ipcRenderer.send('open-window', window);
  }

  changeFile(arg) {
    ipcRenderer.send('change-player-song', arg);
  }

  openFile() {
    ipcRenderer.send('open-file');
  }

  toggleCloseMinimize(status) {
    if (status === 'close') {
      ipcRenderer.send('close-app');
    }

    if (status === 'minimize') {
      remote.getCurrentWindow().minimize();
    }
  }

  renderImageThumbnail() {
    const { pictureData } = this.state;

    if (pictureData) {
      return (
        <div
          id="thumbnail-img"
          style={{ backgroundImage: `url(${pictureData})` }}
        />
      );
    }

    return (
      <i id="play-icon" className="fas fa-music" />
    );
  }

  render() {
    const { file, title, pictureData } = this.state;

    return (
      <div className="MainWindow">
        <div className="header">
          <Statusbar
            onClose={() => this.toggleCloseMinimize('close')}
            onMinimze={() => this.toggleCloseMinimize('minimize')}
          />
          {this.renderImageThumbnail()}
          <h2 className={(pictureData) ? 'title title--white' : 'title'}>{title}</h2>
        </div>
        <div className="player-container">
          <Player
            file={file}
            openFile={this.openFile}
            changeSong={this.changeFile}
            openWindow={this.openWindow}
          />
        </div>
      </div>
    );
  }
}

export default MainWindow;
