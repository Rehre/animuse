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
  }

  componentDidMount() {
    const audiolist = JSON.parse(localStorage.getItem('music-list')) || '';
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
  }

  listenToFile(file) {
    const { audiolist } = this.state;
    const newAudioList = [...audiolist];

    const id = file.substring(file.length, file.lastIndexOf('\\') + 1) + Math.floor(Math.random * 1000);
    const title = file.substring(file.length, file.lastIndexOf('\\') + 1);

    newAudioList.push({
      id,
      title,
      file,
    });

    localStorage.setItem('music-list', JSON.stringify(newAudioList));

    this.setState({ audiolist: newAudioList });
  }

  changeSong(state) {
    const { audiolist, selectedItem } = this.state;

    let currentIndex = audiolist.findIndex(item => item.id === selectedItem);

    if (state === 'next') {
      if (currentIndex >= audiolist.length - 1) return;

      const itemtoSend = audiolist[++currentIndex];

      this.setState({ selectedItem: itemtoSend.id }, () => {
        ipcRenderer.send('send-file', itemtoSend.file);
      });
    }

    if (state === 'previous') {
      if (currentIndex <= 0) return;

      const itemtoSend = audiolist[--currentIndex];

      this.setState({ selectedItem: itemtoSend.id }, () => {
        ipcRenderer.send('send-file', itemtoSend.file);
      });
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

  toggleCloseMinimize(status) {
    if (status === 'close') {
      remote.getCurrentWindow().close();
    }

    if (status === 'minimize') {
      remote.getCurrentWindow().minimize();
    }
  }

  clearList() {
    localStorage.removeItem('music-list');
    this.setState({ audiolist: [] });
  }

  openFolder() {
    ipcRenderer.send('open-folder');
  }

  sendFile(id, filepath) {
    this.setState({ selectedItem: id });

    ipcRenderer.send('send-file', filepath);
  }

  renderList() {
    const { audiolist, selectedItem } = this.state;

    if (audiolist.length <= 0) {
      return <i id="list-ui-null" className="fas fa-list-ul" />;
    }

    return audiolist.map((item) => {
      const title = (item.title.length > 30) ? `${item.title.substring(0, 30)}...` : item.title;
      const className = (selectedItem === item.id) ? 'music-list music-list-selected' : 'music-list';

      return (
        <div
          className={className}
          key={item.id}
          onClick={() => this.sendFile(item.id, item.file)}
        >
          <Touchable
            onPress={() => {}}
            icon="fas fa-align-justify"
            id="button-move-item"
          />
          <h4 id="title-song">{title}</h4>
        </div>
      );
    });
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
