/* eslint-env browser */
import React from 'react';

import './styles/MainWindow.css';
import Player from './component/Player';

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

  openFile() {
    ipcRenderer.send('open-file', 'open');
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

  renderStatusBar() {
    return (
      <div className="status-bar">
        <div
          className="button-status"
          id="minimize-button"
          onClick={() => {
            remote.getCurrentWindow().minimize();
          }}
        />
        <div
          className="button-status"
          id="close-button"
          onClick={() => {
            remote.getCurrentWindow().close();
          }}
        />
      </div>
    );
  }

  render() {
    const { file, title } = this.state;

    return (
      <div className="MainWindow">
        <div className="header">
          {this.renderStatusBar()}
          {this.renderImageThumbnail()}
          <h2>{title}</h2>
        </div>
        <div className="player-container">
          <Player file={file} openFile={this.openFile} />
        </div>
      </div>
    );
  }
}

export default MainWindow;
