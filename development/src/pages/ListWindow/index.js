/* eslint-env browser */
import React from 'react';
import update from 'immutability-helper';

import './styles/ListWindow.css';
import Touchable from '../../common/Touchable';
import HeaderTitle from '../../common/HeaderTitle';
import Modal from '../../common/Modal';

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
      sortValue: '',
      isSearchBarShow: false,
      isLoadingShow: false,
      isAddModalShow: false,
      isSortModalShow: false,
    };

    this.toggleModal = this.toggleModal.bind(this);
    this.toggleSorter = this.toggleSorter.bind(this);
    this.runStorageChecker = this.runStorageChecker.bind(this);
    this.runTagUpdater = this.runTagUpdater.bind(this);
    this.deleteSingleListFile = this.deleteSingleListFile.bind(this);
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
    this.renderLoading = this.renderLoading.bind(this);
    this.renderAddModal = this.renderAddModal.bind(this);
    this.renderSortModal = this.renderSortModal.bind(this);
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

    ipcRenderer.on('show-loading', (ev, arg) => {
      if (arg === 'show') {
        this.setState({ isLoadingShow: true });
      } else {
        this.setState({ isLoadingShow: false });
      }
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

  toggleModal(modal) {
    const { isAddModalShow, isSortModalShow } = this.state;

    if (modal === 'add') this.setState({ isAddModalShow: !isAddModalShow });
    if (modal === 'sort') this.setState({ isSortModalShow: !isSortModalShow });
  }

  toggleSorter(value) {
    if (value === 'default') {
      localStorage.setItem('sort-value', '');
      this.setState({ sortValue: '' });
    }

    if (value === 'title') {
      localStorage.setItem('sort-value', 'title');
      this.setState({ sortValue: 'title' });
    }
  }

  runStorageChecker() {
    const audiolist = JSON.parse(localStorage.getItem('music-list')) || [];
    const totalSize = JSON.parse(localStorage.getItem('music-total-size')) || 0;
    const totalTime = JSON.parse(localStorage.getItem('music-total-time')) || 0;
    const sortValue = localStorage.getItem('sort-value') || '';

    this.setState({
      audiolist,
      totalSize,
      totalTime,
      sortValue,
    }, this.runTagUpdater);
  }

  runTagUpdater() {
    const { audiolist } = this.state;

    if (audiolist.length === 0) return;

    audiolist.forEach((item) => {
      if (!(item.errorTag) && (!(item.size) || !(item.tags) || !(item.duration))) {
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

  addSingleFile() {
    ipcRenderer.send('open-file', 'add');
  }

  deleteSingleListFile(id) {
    const { audiolist } = this.state;

    const newAudioList = audiolist.filter(item => item.id !== id);

    localStorage.setItem('music-list', JSON.stringify(newAudioList));
    this.setState({ audiolist: newAudioList });
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
      if (currentIndex >= audiolist.length - 1) {
        this.setState({ selectedItem: '' });

        return;
      }

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
    const {
      audiolist,
      selectedItem,
      searchTerm,
      sortValue,
    } = this.state;

    if (audiolist.length <= 0) {
      return <i id="list-ui-null" className="fas fa-list-ul" />;
    }

    let filteredAudioList;

    if (searchTerm.length > 0) {
      filteredAudioList = update(audiolist, {
        $apply: (appl) => {
          return appl.filter((item) => {
            if (item.tags && item.tags.title) {
              if (item.tags.title.toLowerCase().includes(searchTerm.toLowerCase())) return item;
            }

            if (item.title.toLowerCase().includes(searchTerm.toLowerCase())) return item;
          });
        },
      });
    }

    let sortedFilteredAudioList;

    if (sortValue.length > 0) {
      sortedFilteredAudioList = update((searchTerm.length > 0) ? filteredAudioList : audiolist, {
        $apply: (appl) => {
          return appl.concat().sort((a, b) => {
            if (a[sortValue] < b[sortValue]) return -1;
            if (a[sortValue] === b[sortValue]) return 0;
            if (a[sortValue] > b[sortValue]) return 1;

            return null;
          });
        },
      });
    }

    function getProcessedList() {
      if (searchTerm.length === 0 && sortValue.length === 0) {
        return audiolist;
      }

      if (searchTerm.length > 0 && sortValue.length === 0) {
        return filteredAudioList;
      }

      return sortedFilteredAudioList;
    }

    return getProcessedList().map((item) => {
      return (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onClick={() => this.sendFile(item.id, item.filePath)}
          deleteFunction={this.deleteSingleListFile}
        />
      );
    });
  }

  renderLoading() {
    const { isLoadingShow } = this.state;

    if (!isLoadingShow) return null;

    return (
      <i className="fas fa-spinner spin" />
    );
  }

  renderAddModal() {
    const { isAddModalShow } = this.state;

    if (!isAddModalShow) return null;

    return (
      <Modal
        className="wrapper-add-modal"
        closeFunction={() => this.toggleModal('add')}
      >
        <div className="add-modal">
          <div className="add-modal__button">
            <div
              className="add-modal__button__folder"
              onClick={() => {
                this.setState({ isAddModalShow: false }, () => {
                  this.openFolder('add');
                });
              }}
            >
              <span>Add directory</span>
            </div>
            <div
              className="add-modal__button__file"
              onClick={() => {
                this.setState({ isAddModalShow: false }, () => {
                  this.addSingleFile();
                });
              }}
            >
              <span>Add file</span>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  renderSortModal() {
    const { isSortModalShow, sortValue } = this.state;

    if (!isSortModalShow) return null;

    const classNameSelected = 'item-wrapper__option__selector--on';

    return (
      <Modal
        className="wrapper-sort-modal"
        closeFunction={() => this.toggleModal('sort')}
      >
        <div className="item-wrapper">
          <div
            className="item-wrapper__option item-wrapper__option--default"
            onClick={() => this.toggleSorter('default')}
          >
            <div className={`item-wrapper__option__selector ${(sortValue === '') ? classNameSelected : null}`} />
            <span>default</span>
          </div>
          <div
            className="item-wrapper__option item-wrapper__option--title"
            onClick={() => this.toggleSorter('title')}
          >
            <div className={`item-wrapper__option__selector ${(sortValue === 'title') ? classNameSelected : null}`} />
            <span>title</span>
          </div>
        </div>
      </Modal>
    );
  }

  render() {
    const { totalSize } = this.state;

    return (
      <div className="ListWindow">
        <HeaderTitle
          onClose={() => this.toggleCloseMinimize('close')}
          onMinimize={() => this.toggleCloseMinimize('minimize')}
        />
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
          <Touchable
            onClick={() => this.toggleModal('add')}
            icon="fas fa-plus"
            className="button-add-file"
          />
          <Touchable
            onClick={() => this.toggleModal('sort')}
            icon="fas fa-sort"
            className="button-sort-list"
          />
          {this.renderAddModal()}
          {this.renderSortModal()}
          <div className="list-description">
            {this.renderLoading()}
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
