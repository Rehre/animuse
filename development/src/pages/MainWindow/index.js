/* eslint-env browser */
import React from 'react';

import './styles/MainWindow.css';
import Player from './component/Player';
import TitleBar from '../../common/TitleBar';

const { ipcRenderer, remote } = window.require('electron');

class MainWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      file: '',
      title: 'title',
      pictureData: undefined,
    };

    this.title = React.createRef();
    this.titleAnimation = null;

    this.openFile = this.openFile.bind(this);
    this.animateTitle = this.animateTitle.bind(this);
    this.renderImageThumbnail = this.renderImageThumbnail.bind(this);
  }

  componentDidMount() {
    ipcRenderer.on('opened-file', (event, arg) => {
      const title = arg.tags.title || arg.file.substring(arg.file.length, arg.file.lastIndexOf('\\') + 1);

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
  }

  animateTitle() {
    const { width } = getComputedStyle(this.title.current);
    clearInterval(this.titleAnimation);

    const currentElement = this.title.current;
    if (parseInt(width, 10) < 400) {
      currentElement.style.left = '10px';
      return;
    }

    const toLeft = parseInt(width, 10) - 390;
    let iterable = 0;

    this.titleAnimation = setInterval(() => {
      if (Math.abs(iterable) === toLeft) {
        iterable = 0;
        currentElement.style.left = 'initial';
        return;
      }

      iterable -= 1;

      currentElement.style.left = `${iterable}px`;
    }, 50);
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
          <TitleBar
            onClose={() => this.toggleCloseMinimize('close')}
            onMinimize={() => this.toggleCloseMinimize('minimize')}
          />
          {this.renderImageThumbnail()}
          <h2
            ref={this.title}
            className={(pictureData) ? 'title title--white' : 'title'}
          >
            {title || 'no-title'}
          </h2>
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
