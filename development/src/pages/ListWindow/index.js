/* eslint-env browser */
import React from 'react';
import update from 'immutability-helper';

import './styles/ListWindow.css';
import Touchable from '../../common/Touchable';
import HeaderTitle from '../../common/HeaderTitle';
import Modal from '../../common/Modal';

import List from './components/List';
import ListGroup from './components/ListGroup';

const { ipcRenderer, remote } = window.require('electron');

class ListWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      audiolist: [],
      grouplist: {
        folder: [],
      },
      selectedItem: '',
      totalTime: 0,
      totalSize: 0,
      searchTerm: '',
      sortValue: '',
      groupByValue: '',
      isSearchBarShow: false,
      isLoadingShow: false,
      isAddModalShow: false,
      isSortModalShow: false,
      isGroupByModalShow: false,
    };

    this.needToSort = false;

    this.toggleModal = this.toggleModal.bind(this);
    this.toggleSorter = this.toggleSorter.bind(this);
    this.toggleGroupBy = this.toggleGroupBy.bind(this);
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
    this.renderListByGroup = this.renderListByGroup.bind(this);
    this.renderLoading = this.renderLoading.bind(this);
    this.renderAddModal = this.renderAddModal.bind(this);
    this.renderSortModal = this.renderSortModal.bind(this);
    this.renderGroupByModal = this.renderGroupByModal.bind(this);
    this.renderedList = this.renderedList.bind(this);
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
    const { isAddModalShow, isSortModalShow, isGroupByModalShow } = this.state;

    if (modal === 'add') this.setState({ isAddModalShow: !isAddModalShow });
    if (modal === 'sort') this.setState({ isSortModalShow: !isSortModalShow });
    if (modal === 'group') this.setState({ isGroupByModalShow: !isGroupByModalShow });
  }

  toggleSorter(value) {
    if (value === 'default') {
      const copy = JSON.parse(localStorage.getItem('music-list')) || [];
      localStorage.setItem('sort-value', '');
      this.setState({ sortValue: '', audiolist: copy }, () => {
        this.needToSort = true;
      });
    }

    if (value === 'title') {
      localStorage.setItem('sort-value', 'title');
      this.setState({ sortValue: 'title' }, () => {
        this.needToSort = true;
      });
    }
  }

  toggleGroupBy(value) {
    localStorage.setItem('group-value', value);

    this.setState({ groupByValue: value });
  }

  runStorageChecker() {
    const audiolist = JSON.parse(localStorage.getItem('music-list')) || [];
    const totalSize = JSON.parse(localStorage.getItem('music-total-size')) || 0;
    const totalTime = JSON.parse(localStorage.getItem('music-total-time')) || 0;
    const sortValue = localStorage.getItem('sort-value') || '';
    const groupByValue = localStorage.getItem('group-value') || '';

    this.setState({
      audiolist,
      totalSize,
      totalTime,
      sortValue,
      groupByValue,
    }, this.runTagUpdater);
  }

  runTagUpdater() {
    const { audiolist, grouplist, sortValue } = this.state;

    if (sortValue.length > 0) this.needToSort = true;
    if (audiolist.length === 0) return;

    const newGroupList = {};
    const newGroupListKeys = Object.keys(grouplist);
    const newGroupListValues = Object.values(grouplist);

    audiolist.forEach((item) => {
      // get the file grouping item
      newGroupListKeys.forEach((key, index) => {
        if (!(item.group)) return;
        if (!(item.group[key])) return;

        // if there is group item already in values of newGroupList then dont push
        if (!(newGroupListValues[index].includes(item.group[key]))) {
          newGroupListValues[index].push(item.group[key]);
        }

        newGroupList[key] = newGroupListValues[index];
      });
      // run tag updater
      if (!(item.errorTag) && (!(item.isTagged) || !(item.duration))) {
        ipcRenderer.send('get-song-tags', item);
      }
    });

    this.setState({ grouplist: newGroupList });
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
    const {
      audiolist,
      totalTime,
      totalSize,
      grouplist,
      sortValue,
    } = this.state;

    const currentItem = audiolist.find(item => item.id === id);
    const groupValues = {
      folder: currentItem.group.folder,
    };

    // delete total time and duration this item has
    let newTotalTime = 0;
    let newTotalSize = 0;
    // if this item not the last item in list then substract the last item
    if (audiolist.length > 1) {
      if (currentItem.duration !== undefined) {
        newTotalTime = totalTime - currentItem.duration;
      } else {
        newTotalTime = totalTime;
      }

      newTotalSize = (currentItem.size !== undefined) ? totalSize - currentItem.size : totalSize;
    }

    localStorage.setItem('music-total-time', JSON.stringify(newTotalTime));
    localStorage.setItem('music-total-size', JSON.stringify(newTotalSize));

    // delete item from audiolist
    const newAudioList = audiolist.filter(item => item.id !== id);

    // delete the group in state this item has
    const newGroupList = {};
    const newGroupListValues = Object.values(grouplist);

    // if there is still some file has the group then return
    if (!(newAudioList.some(item => item.group.folder === groupValues.folder))) {
      newGroupListValues[0] = newGroupListValues[0].filter(item => item !== groupValues.folder);
    }

    newGroupList.folder = newGroupListValues[0];

    if (sortValue.length > 0) {
      let arrTemp = JSON.parse(localStorage.getItem('music-list')) || [];
      this.needToSort = true;

      arrTemp = arrTemp.filter(item => item.id !== id);
      localStorage.setItem('music-list', JSON.stringify(arrTemp));
      arrTemp = []; // clean memory
    } else {
      localStorage.setItem('music-list', JSON.stringify(newAudioList));
    }

    this.setState({
      audiolist: newAudioList,
      totalTime: newTotalTime,
      totalSize: newTotalSize,
      grouplist: newGroupList,
    });
  }

  clearList() {
    localStorage.removeItem('music-list');
    localStorage.removeItem('music-total-size');
    localStorage.removeItem('music-total-time');
    // cancel all the asynchronous function in ipcManager
    ipcRenderer.send('cancel-all-async-function');

    this.setState({
      audiolist: [],
      grouplist: {
        folder: [],
      },
      selectedItem: '',
      totalTime: 0,
      totalSize: 0,
    });
  }

  // this will automatically send the get-song-tags event to ipcManager
  listenToFile(file) {
    const { audiolist, grouplist, sortValue } = this.state;
    const newAudioList = [...audiolist];
    const newGroupList = {};
    const newGroupListValues = Object.values(grouplist);

    const id = file.filePath.substring(file.filePath.length, file.filePath.lastIndexOf('\\') + 1) + Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 1000);
    const title = file.filePath.substring(file.filePath.length, file.filePath.lastIndexOf('\\') + 1);
    const regex = file.filePath.match(/\\.+?\\/g);

    const folder = regex[regex.length - 1].replace(/\\/g, '');

    const objectFile = {
      id,
      title,
      filePath: file.filePath,
      group: {
        folder,
      },
    };

    // set the grouping
    ['folder'].forEach((key, index) => {
      if (!(newGroupListValues[index].includes(objectFile.group[key]))) {
        newGroupListValues[index].push(objectFile.group[key]);
      }

      newGroupList[key] = newGroupListValues[index];
    });

    newAudioList.push(objectFile);

    if (sortValue.length > 0) {
      let arrTemp = JSON.parse(localStorage.getItem('music-list')) || [];
      this.needToSort = true;

      arrTemp.push(objectFile);
      localStorage.setItem('music-list', JSON.stringify(arrTemp));
      arrTemp = []; // clean memory
    } else {
      localStorage.setItem('music-list', JSON.stringify(newAudioList));
    }

    this.setState({ audiolist: newAudioList, grouplist: newGroupList }, () => {
      ipcRenderer.send('get-song-tags', objectFile);
    });
  }

  // this will automatically send the get-song-duration event to ipcManager
  updateTags(file) {
    const { audiolist, totalSize, sortValue } = this.state;

    const newAudioList = [...audiolist];
    const currentIndex = newAudioList.findIndex(item => item.id === file.id);

    newAudioList[currentIndex] = Object.assign({}, newAudioList[currentIndex], file);
    let newTotalSize = totalSize;
    // if the updatetags run for the second time for getting the duration
    if (currentIndex > -1 && !(audiolist[currentIndex].size)) {
      newTotalSize = totalSize + file.size;
    }

    if (sortValue.length > 0) {
      let arrTemp = JSON.parse(localStorage.getItem('music-list')) || [];
      this.needToSort = true;

      const currentIndexA = arrTemp.findIndex(item => item.id === file.id);
      arrTemp[currentIndexA] = Object.assign({}, arrTemp[currentIndexA], file);
      localStorage.setItem('music-list', JSON.stringify(arrTemp));
      arrTemp = []; // clean memory
    } else {
      localStorage.setItem('music-list', JSON.stringify(newAudioList));
    }

    localStorage.setItem('music-total-size', JSON.stringify(newTotalSize));

    this.setState({ audiolist: newAudioList, totalSize: newTotalSize }, () => {
      ipcRenderer.send('get-song-duration', file);
    });
  }

  updateDuration(file) {
    const { audiolist, totalTime, sortValue } = this.state;
    const newAudioList = [...audiolist];

    const currentIndex = newAudioList.findIndex(item => item.id === file.id);

    newAudioList[currentIndex] = Object.assign({},
      newAudioList[currentIndex],
      { duration: file.duration });

    let newTotalTime = totalTime;
    // if the updatetags run for the second time for getting the duration
    if (currentIndex > -1 && !(audiolist[currentIndex].duration)) {
      newTotalTime = totalTime + file.duration;
    }

    if (sortValue.length > 0) {
      let arrTemp = JSON.parse(localStorage.getItem('music-list')) || [];
      this.needToSort = true;

      const currentIndexA = arrTemp.findIndex(item => item.id === file.id);
      arrTemp[currentIndexA] = Object.assign({},
        arrTemp[currentIndexA],
        { duration: file.duration });

      localStorage.setItem('music-list', JSON.stringify(arrTemp));
      arrTemp = []; // clean memory
    } else {
      localStorage.setItem('music-list', JSON.stringify(newAudioList));
    }

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

      this.sendFile(itemToSend.id, itemToSend);
    }

    if (state === 'loop-all-next') {
      let [itemToSend] = audiolist; // this will get the first item

      if (currentIndex < audiolist.length - 1) {
        itemToSend = audiolist[++currentIndex]; // this will change if currentindex < audiolist
      }

      this.sendFile(itemToSend.id, itemToSend);
    }

    if (state === 'next') {
      let itemtoSend = audiolist[0];

      if (currentIndex >= audiolist.length - 1) {
        this.sendFile(itemtoSend.id, itemtoSend);

        return;
      }

      itemtoSend = audiolist[++currentIndex];

      this.sendFile(itemtoSend.id, itemtoSend);
    }

    if (state === 'previous') {
      let itemtoSend = audiolist[audiolist.length - 1];

      if (currentIndex <= 0) {
        this.sendFile(itemtoSend.id, itemtoSend);

        return;
      }

      itemtoSend = audiolist[--currentIndex];

      this.sendFile(itemtoSend.id, itemtoSend);
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
        <Touchable
          onClick={() => this.toggleModal('group')}
          icon="fas fa-object-group"
          className="button-group-list"
        />
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
          return appl.sort((a, b) => {
            let titleA = a[sortValue];
            let titleB = b[sortValue];

            if (a.tags) {
              if (a.tags.title) titleA = a.tags.title;
            }

            if (b.tags) {
              if (b.tags.title) titleB = b.tags.title;
            }

            if (titleA < titleB) return -1;
            if (titleA === titleB) return 0;
            if (titleA > titleB) return 1;

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
          onClick={() => this.sendFile(item.id, item)}
          deleteFunction={this.deleteSingleListFile}
        />
      );
    });
  }

  renderListByGroup() {
    const {
      selectedItem,
      groupByValue,
      grouplist,
      sortValue,
    } = this.state;

    const { audiolist } = this.state;

    if (sortValue.length > 0 && this.needToSort) {
      grouplist[groupByValue].forEach((item) => {
        let list = audiolist.filter(itemX => itemX.group[groupByValue] === item);

        list.sort((a, b) => {
          let titleA = a[sortValue];
          let titleB = b[sortValue];

          if (a.tags) {
            if (a.tags.title) titleA = a.tags.title;
          }

          if (b.tags) {
            if (b.tags.title) titleB = b.tags.title;
          }

          if (titleA < titleB) return -1;
          if (titleA === titleB) return 0;
          if (titleA > titleB) return 1;

          return null;
        });

        list.forEach((itemX) => {
          const currentIndex = audiolist.findIndex(itemY => itemY.id === itemX.id);

          audiolist.splice(currentIndex, 1);
          audiolist.push(itemX);
        });

        list = []; // clean memory
      });

      this.needToSort = false;
    }

    return grouplist[groupByValue].map((item, index) => {
      return (
        <ListGroup
          key={index}
          audiolist={audiolist}
          selectedItem={selectedItem}
          groupValue={groupByValue}
          listValue={item}
          sortValue={sortValue}
          deleteSingleListFile={this.deleteSingleListFile}
          sendFile={this.sendFile}
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
          <h3 className="item-wrapper__title">Sort By</h3>
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

  renderGroupByModal() {
    const { isGroupByModalShow, groupByValue } = this.state;

    if (!isGroupByModalShow) return null;

    const classNameSelected = 'item-wrapper__option__selector--on';

    return (
      <Modal
        className="wrapper-groupBy-modal"
        closeFunction={() => this.toggleModal('group')}
      >
        <div className="item-wrapper">
          <h3 className="item-wrapper__title">Group By</h3>
          <div
            className="item-wrapper__option item-wrapper__option--default"
            onClick={() => this.toggleGroupBy('')}
          >
            <div className={`item-wrapper__option__selector ${(groupByValue === '') ? classNameSelected : null}`} />
            <span>default</span>
          </div>
          <div
            className="item-wrapper__option item-wrapper__option--folder"
            onClick={() => this.toggleGroupBy('folder')}
          >
            <div className={`item-wrapper__option__selector ${(groupByValue === 'folder') ? classNameSelected : null}`} />
            <span>folder</span>
          </div>
        </div>
      </Modal>
    );
  }

  renderedList() {
    const {
      searchTerm,
      groupByValue,
    } = this.state;

    if (searchTerm.length <= 0 && groupByValue.length > 0) {
      return this.renderListByGroup();
    }

    return this.renderList();
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
        {this.renderGroupByModal()}
        <div className="content">
          {this.renderedList()}
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
