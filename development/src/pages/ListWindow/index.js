/* eslint-env browser */
import React from 'react';

import './styles/ListWindow.css';
import Statusbar from '../../common/Statusbar';
import Touchable from '../../common/Touchable';

const { ipcRenderer, remote } = window.require('electron');

class ListWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      audiolist: [],
      selectedItem: '',
    };

    this.renderList = this.renderList.bind(this);
    this.listenToFile = this.listenToFile.bind(this);
    this.sendFile = this.sendFile.bind(this);
    this.changeSong = this.changeSong.bind(this);
    this.clearList = this.clearList.bind(this);
    this.moveItem = this.moveItem.bind(this);
    this.renderHead = this.renderHead.bind(this);
    this.updateTags = this.updateTags.bind(this);
  }

  componentDidMount() {
    const audiolist = JSON.parse(localStorage.getItem('music-list')) || [];
    this.setState({ audiolist });

    ipcRenderer.on('add-file-to-list', (event, arg) => {
      this.listenToFile(arg);
    });

    ipcRenderer.on('clear-list', () => {
      this.setState({ audiolist: [] });
    });

    ipcRenderer.on('change-song', (event, arg) => {
      this.changeSong(arg);
    });

    ipcRenderer.on('update-tags', (event, arg) => {
      this.updateTags(arg);
    });
  }

  toggleCloseMinimize(status) {
    if (status === 'close') {
      remote.getCurrentWindow().close();
    }

    if (status === 'minimize') {
      remote.getCurrentWindow().minimize();
    }
  }

  openFolder() {
    ipcRenderer.send('open-folder');
  }

  listenToFile(file) {
    const { audiolist } = this.state;
    const newAudioList = [...audiolist];

    const id = file.filePath.substring(file.filePath.length, file.filePath.lastIndexOf('\\') + 1) + Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 1000);
    const title = file.filePath.substring(file.filePath.length, file.filePath.lastIndexOf('\\') + 1);
    const objectFile = {
      id,
      title,
      filePath: file.filePath,
    };

    newAudioList.push(objectFile);

    localStorage.setItem('music-list', JSON.stringify(newAudioList));

    this.setState({ audiolist: newAudioList }, () => {
      setTimeout(() => ipcRenderer.send('get-song-tags', objectFile), 1000);
    });
  }

  updateTags(file) {
    const { audiolist } = this.state;
    const newAudioList = [...audiolist];

    const currentIndex = newAudioList.findIndex(item => item.id === file.id);

    newAudioList[currentIndex] = file;

    localStorage.setItem('music-list', JSON.stringify(newAudioList));

    this.setState({ audiolist: newAudioList });
  }

  changeSong(state) {
    const { audiolist, selectedItem } = this.state;

    let currentIndex = audiolist.findIndex(item => item.id === selectedItem);

    if (state === 'next') {
      if (currentIndex >= audiolist.length - 1) return;

      const itemtoSend = audiolist[++currentIndex];

      this.sendFile(itemtoSend.id, itemtoSend.filePath);
    }

    if (state === 'previous') {
      if (currentIndex <= 0) return;

      const itemtoSend = audiolist[--currentIndex];

      this.sendFile(itemtoSend.id, itemtoSend.filePath);
    }
  }

  moveItem(id, idMoveTo) {
    const { audioList } = this.state;
    const newList = [...audioList];

    const itemIndex = newList.findIndex(item => item.id === id);
    const itemToIndex = newList.findIndex(item => item.id === idMoveTo);

    newList.splice(itemToIndex - 1, 0, newList[itemIndex]);
    newList.splice(itemIndex, 1);
  }

  sendFile(id, filepath) {
    this.setState({ selectedItem: id });

    ipcRenderer.send('send-file', filepath);
  }

  clearList() {
    localStorage.removeItem('music-list');
    this.setState({ audiolist: [], selectedItem: '' });
  }

  renderList() {
    const { audiolist, selectedItem } = this.state;

    if (audiolist.length <= 0) {
      return <i id="list-ui-null" className="fas fa-list-ul" />;
    }

    return audiolist.map((item) => {
      const className = (selectedItem === item.id) ? 'music-list music-list-selected' : 'music-list';

      let titleHeader = item.title.substring(0, item.title.indexOf('.mp3'));
      let artistHeader = 'unknown artist';
      let albumHeader = 'unknown album';
      let sizeHeader = 'unknown size';

      if (item.size) sizeHeader = `${item.size}MB`;

      if (item.tags) {
        if (item.tags.title) {
          titleHeader = item.tags.title;
        }

        if (item.tags.artist) {
          artistHeader = item.tags.artist;
        }

        if (item.tags.album) {
          albumHeader = item.tags.album;
        }
      }

      let title = `${titleHeader} - ${artistHeader}`;
      title = (title.length > 40) ? `${title.substring(0, 40)}...` : title;
      let albumAndSize = `${albumHeader} - ${sizeHeader}`;
      albumAndSize = (albumAndSize.length > 40) ? `${albumAndSize.substring(0, 40)}...` : albumAndSize;

      return (
        <div
          className={className}
          key={item.id}
          onClick={() => this.sendFile(item.id, item.filePath)}
        >
          <Touchable
            onPress={() => {}}
            icon="fas fa-align-justify"
            id="button-move-item"
          />
          <h4 id="title-song">{title}</h4>
          <span id="album-and-size">{albumAndSize}</span>
        </div>
      );
    });
  }

  renderHead() {
    const { audiolist, selectedItem } = this.state;

    const selectedIndex = audiolist.findIndex(item => item.id === selectedItem);

    return (
      <div className="head">
        <span>{selectedIndex + 1} / {audiolist.length}</span>
      </div>
    );
  }

  render() {
    return (
      <div className="ListWindow">
        <div className="header">
          <Statusbar
            onClose={() => this.toggleCloseMinimize('close')}
            onMinimze={() => this.toggleCloseMinimize('minimize')}
          />
        </div>
        {this.renderHead()}
        <div className="content">
          {this.renderList()}
        </div>
        <div className="footer">
          <Touchable
            onPress={this.openFolder}
            icon="fas fa-folder-open"
            id="button-folder-open"
          />
          <Touchable
            onPress={this.clearList}
            icon="fas fa-ban"
            id="button-list-clear"
          />
        </div>
      </div>
    );
  }
}

export default ListWindow;
