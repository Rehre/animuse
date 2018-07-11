/* eslint-env browser */
import React from 'react';

import './styles/ListWindow.css';
import TitleBar from '../../common/TitleBar';
import Touchable from '../../common/Touchable';

import List from './components/List';

const { ipcRenderer, remote } = window.require('electron');

class ListWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      audiolist: [],
      selectedItem: '',
      totalTime: 0,
      totalSize: 0,
      searchTerm: '',
      isSearchBarShow: false,
    };

    this.runStorageChecker = this.runStorageChecker.bind(this);
    this.runTagUpdater = this.runTagUpdater.bind(this);
    this.clearList = this.clearList.bind(this);
    this.listenToFile = this.listenToFile.bind(this);
    this.updateTags = this.updateTags.bind(this);
    this.updateDuration = this.updateDuration.bind(this);
    this.changeSong = this.changeSong.bind(this);
    this.sendFile = this.sendFile.bind(this);
    this.renderTotalTime = this.renderTotalTime.bind(this);
    this.renderSearchBar = this.renderSearchBar.bind(this);
    this.renderHead = this.renderHead.bind(this);
    this.renderList = this.renderList.bind(this);
  }

  componentDidMount() {
    this.runStorageChecker();

    ipcRenderer.on('add-file-to-list', (event, arg) => {
      this.listenToFile(arg);
    });

    ipcRenderer.on('clear-list', () => {
      this.clearList();
    });

    ipcRenderer.on('change-song', (event, arg) => {
      this.changeSong(arg);
    });

    ipcRenderer.on('update-tags', (event, arg) => {
      this.updateTags(arg);
    });

    ipcRenderer.on('update-duration', (event, arg) => {
      this.updateDuration(arg);
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

  runStorageChecker() {
    const audiolist = JSON.parse(localStorage.getItem('music-list')) || [];
    const totalSize = JSON.parse(localStorage.getItem('music-total-size')) || 0;
    const totalTime = JSON.parse(localStorage.getItem('music-total-time')) || 0;
    this.setState({ audiolist, totalSize, totalTime }, this.runTagUpdater);
  }

  runTagUpdater() {
    const { audiolist } = this.state;

    if (audiolist.length === 0) return;

    audiolist.forEach((item) => {
      if (!(item.size) || !(item.tags) || !(item.duration)) {
        ipcRenderer.send('get-song-tags', item);
      }
    });
  }

  openFolder(arg) {
    if (arg === 'add') {
      ipcRenderer.send('open-folder', 'add');
      return;
    }

    ipcRenderer.send('open-folder');
  }

  clearList() {
    localStorage.removeItem('music-list');
    localStorage.removeItem('music-total-size');
    localStorage.removeItem('music-total-time');
    // cancel all the asynchronous function in ipcManager
    ipcRenderer.send('cancel-all-async-function');

    this.setState({
      audiolist: [],
      selectedItem: '',
      totalTime: 0,
      totalSize: 0,
    });
  }

  // this will automatically send the get-song-tags event to ipcManager
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
      ipcRenderer.send('get-song-tags', objectFile);
    });
  }

  // this will automatically send the get-song-duration event to ipcManager
  updateTags(file) {
    const { audiolist, totalSize } = this.state;
    const newAudioList = [...audiolist];
    const currentIndex = newAudioList.findIndex(item => item.id === file.id);

    newAudioList[currentIndex] = Object.assign({}, newAudioList[currentIndex], file);
    const newTotalSize = totalSize + file.size;

    localStorage.setItem('music-list', JSON.stringify(newAudioList));
    localStorage.setItem('music-total-size', JSON.stringify(newTotalSize));

    this.setState({ audiolist: newAudioList, totalSize: newTotalSize }, () => {
      ipcRenderer.send('get-song-duration', file);
    });
  }

  updateDuration(file) {
    const { audiolist, totalTime } = this.state;
    const newAudioList = [...audiolist];

    const currentIndex = newAudioList.findIndex(item => item.id === file.id);

    newAudioList[currentIndex] = Object.assign({},
      newAudioList[currentIndex],
      { duration: file.duration });
    const newTotalTime = totalTime + file.duration;

    localStorage.setItem('music-list', JSON.stringify(newAudioList));
    localStorage.setItem('music-total-time', JSON.stringify(newTotalTime));

    this.setState({ audiolist: newAudioList, totalTime: newTotalTime });
  }

  changeSong(state) {
    const { audiolist, selectedItem } = this.state;

    let currentIndex = audiolist.findIndex(item => item.id === selectedItem);

    if (state === 'random') {
      if (audiolist.length <= 0) return;

      const index = Math.abs(Math.round(Math.random() * audiolist.length - 1));
      const itemToSend = audiolist[index];

      this.sendFile(itemToSend.id, itemToSend.filePath);
    }

    if (state === 'loop-all-next') {
      let [itemToSend] = audiolist;

      if (currentIndex < audiolist.length - 1) {
        itemToSend = audiolist[++currentIndex];
      }

      this.sendFile(itemToSend.id, itemToSend.filePath);
    }

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

  // send file to mainWindow
  sendFile(id, filepath) {
    const { selectedItem } = this.state;

    if (selectedItem === id) return;

    this.setState({ selectedItem: id });

    ipcRenderer.send('send-file', filepath);
  }

  renderTotalTime() {
    const { totalTime } = this.state;

    const hours = `${Math.trunc(totalTime / 3600)}`;
    const newtotalTime = totalTime % 3600;
    const minutes = `${Math.trunc(newtotalTime / 60)}`;
    const seconds = `${Math.trunc(newtotalTime % 60)}`;

    return (
      <span className="list-description_duration">
        {'00'.substr(hours.length) + hours}
        :
        {'00'.substr(minutes.length) + minutes}
        :
        {'00'.substr(seconds.length) + seconds}
      </span>
    );
  }

  renderSearchBar() {
    const { isSearchBarShow } = this.state;

    if (isSearchBarShow) {
      return (
        <div className="search-bar">
          <Touchable
            onClick={() => this.setState({ isSearchBarShow: false, searchTerm: '' })}
            icon="fas fa-times-circle"
            className="search-bar__close-input"
          />
          <input
            className="search-bar__input"
            type="text"
            onChange={event => this.setState({ searchTerm: event.target.value })}
            placeholder="Type the song title..."
            autoFocus
          />
        </div>
      );
    }

    return (
      <div className="search-bar">
        <Touchable
          onClick={() => this.setState({ isSearchBarShow: true })}
          icon="fas fa-search"
          className="search-bar__open-input"
        />
      </div>
    );
  }

  renderHead() {
    const { audiolist, selectedItem } = this.state;

    const selectedIndex = audiolist.findIndex(item => item.id === selectedItem);

    return (
      <div className="head">
        <span># {selectedIndex + 1} / {audiolist.length}</span>
        {this.renderSearchBar()}
      </div>
    );
  }

  renderList() {
    const { audiolist, selectedItem, searchTerm } = this.state;

    if (audiolist.length <= 0) {
      return <i id="list-ui-null" className="fas fa-list-ul" />;
    }

    let filteredAudioList = audiolist;

    if (searchTerm.length > 0) {
      filteredAudioList = audiolist.filter((item) => {
        return item.title.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return filteredAudioList.map((item) => {
      const className = (selectedItem === item.id) ? 'music-list music-list--selected' : '';

      let titleHeader = item.title.substring(0, item.title.indexOf('.mp3'));
      let artistHeader = 'unknown artist';
      let albumHeader = 'unknown album';
      let sizeHeader = 'unknown size';
      let duration = '';

      if (item.size) sizeHeader = `${item.size}MB`;

      if (item.duration) {
        const secs = Math.trunc(item.duration % 60).toString();
        const minutes = Math.trunc(item.duration / 60).toString();

        duration = `${'00'.substr(minutes.length) + minutes}:${'00'.substr(secs.length) + secs}`;
      }

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
      title = (title.length > 30) ? `${title.substring(0, 30)}...` : title;
      let albumAndSize = `${albumHeader} - ${sizeHeader}`;
      albumAndSize = (albumAndSize.length > 30) ? `${albumAndSize.substring(0, 30)}...` : albumAndSize;

      return (
        <List
          id={item.id}
          key={item.id}
          onClick={() => this.sendFile(item.id, item.filePath)}
          className={className}
          title={title}
          albumAndSize={albumAndSize}
          duration={duration}
        />
      );
    });
  }

  render() {
    const { totalSize } = this.state;

    return (
      <div className="ListWindow">
        <div className="header">
          <TitleBar
            onClose={() => this.toggleCloseMinimize('close')}
            onMinimize={() => this.toggleCloseMinimize('minimize')}
          />
        </div>
        {this.renderHead()}
        <div className="content">
          {this.renderList()}
        </div>
        <div className="footer">
          <Touchable
            onClick={this.openFolder}
            icon="fas fa-folder-open"
            className="button-folder-open"
          />
          <Touchable
            onClick={this.clearList}
            icon="fas fa-ban"
            className="button-list-clear"
          />
          <div className="list-description">
            <span className="list-description__size">{totalSize.toFixed(2)} MB</span>
            {' '}
            /
            {' '}
            {this.renderTotalTime()}
          </div>
        </div>
      </div>
    );
  }
}

export default ListWindow;
