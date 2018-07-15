/* eslint-env browser */
import React from 'react';

import './styles/MainWindow.css';
import Player from './component/Player';
import TitleBar from '../../common/TitleBar';

const { ipcRenderer, remote } = window.require('electron');
const path = window.require('path');

class MainWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      file: '',
      title: 'title',
      pictureData: undefined,
    };

    this.title = React.createRef();
    this.title2 = React.createRef();
    this.titleAnimation = null;

    this.openFile = this.openFile.bind(this);
    this.animateTitle = this.animateTitle.bind(this);
    this.renderTitle = this.renderTitle.bind(this);
    this.renderImageThumbnail = this.renderImageThumbnail.bind(this);
  }

  componentDidMount() {
    ipcRenderer.send('get-opening-file');

    ipcRenderer.on('opened-file', (event, arg) => {
      let title = path.basename(arg.file);

      if (arg.tags) {
        if (arg.tags.title && arg.tags.title.length > 0) {
          title = `${arg.tags.title} - ${arg.tags.artist || 'unknown artist'}`;
        }
      }

      this.setState({
        file: arg.file,
        title,
        pictureData: arg.pictureData,
      });
    });
  }

  componentDidUpdate() {
    this.animateTitle();
  }

  toggleCloseMinimize(status) {
    if (status === 'close') {
      ipcRenderer.send('close-app');
    }

    if (status === 'minimize') {
      remote.getCurrentWindow().minimize();
    }
  }

  openWindow(window) {
    ipcRenderer.send('open-window', window);
  }

  openFile() {
    ipcRenderer.send('open-file');
  }

  changeFile(arg) {
    ipcRenderer.send('change-player-song', arg);
    ipcRenderer.send('song-ended');
  }

  animateTitle() {
    clearInterval(this.titleAnimation);

    const { width } = getComputedStyle(this.title.current);
    const currentElement = this.title.current;
    const title2 = this.title2.current;

    if (parseInt(width, 10) < 400) {
      currentElement.style.left = '10px';
      title2.style.left = '10px';
      return;
    }

    title2.style.left = `${parseInt(width, 10) + 50}px`;

    let iterable = 0;
    let iterable2 = parseInt(title2.style.left, 10);

    this.titleAnimation = setInterval(() => {
      if (Math.abs(iterable2) === 0) {
        currentElement.style.left = 'initial';
        title2.style.left = `${parseInt(width, 10) + 50}px`;

        iterable = 0;
        iterable2 = parseInt(title2.style.left, 10);
        return;
      }

      iterable -= 1;
      iterable2 -= 1;

      title2.style.left = `${iterable2}px`;
      currentElement.style.left = `${iterable}px`;
    }, 60);
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

  renderTitle() {
    const { pictureData, title } = this.state;

    return (
      <div>
        <h2
          ref={this.title}
          className={(pictureData) ? 'title title--white' : 'title'}
        >
          {title}
        </h2>
        <h2
          ref={this.title2}
          className={(pictureData) ? 'title2 title--white' : 'title2'}
        >
          {title}
        </h2>
      </div>
    );
  }

  render() {
    const { file } = this.state;

    return (
      <div className="MainWindow">
        <div className="header">
          <TitleBar
            onClose={() => this.toggleCloseMinimize('close')}
            onMinimize={() => this.toggleCloseMinimize('minimize')}
          />
          {this.renderImageThumbnail()}
          {this.renderTitle()}
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
