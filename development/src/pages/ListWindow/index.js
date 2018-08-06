/* eslint-env browser */
import React from 'react';
import update from 'immutability-helper';

import './styles/ListWindow.css';
import Touchable from '../../common/Touchable';
import HeaderTitle from '../../common/HeaderTitle';
import Modal from '../../common/Modal';

import List from './components/List';
import ListGroup from './components/ListGroup';
import PlaylistModal from './components/PlaylistModal';

const { ipcRenderer, remote } = window.require('electron');

class ListWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      audiolist: [],
      playlist: [],
      currentPlaylist: '',
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
      isPlaylistModalShow: false,
    };

    this.needToSort = false;

    this.toggleModal = this.toggleModal.bind(this);
    this.toggleSorter = this.toggleSorter.bind(this);
    this.toggleGroupBy = this.toggleGroupBy.bind(this);
    this.toggleGroupShow = this.toggleGroupShow.bind(this);
    this.runStorageChecker = this.runStorageChecker.bind(this);
    this.runTagUpdater = this.runTagUpdater.bind(this);
    this.addPlaylist = this.addPlaylist.bind(this);
    this.deletePlaylist = this.deletePlaylist.bind(this);
    this.changePlaylist = this.changePlaylist.bind(this);
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
    this.renderPlaylistModal = this.renderPlaylistModal.bind(this);
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
    const {
      isAddModalShow,
      isSortModalShow,
      isGroupByModalShow,
      isPlaylistModalShow,
    } = this.state;

    if (modal === 'add') this.setState({ isAddModalShow: !isAddModalShow });
    if (modal === 'sort') this.setState({ isSortModalShow: !isSortModalShow });
    if (modal === 'group') this.setState({ isGroupByModalShow: !isGroupByModalShow });
    if (modal === 'playlist') this.setState({ isPlaylistModalShow: !isPlaylistModalShow });
  }

  toggleSorter(value) {
    const { currentPlaylist } = this.state;

    if (value === 'default') {
      let copy = JSON.parse(localStorage.getItem('music-list')) || [];
      localStorage.setItem('sort-value', '');

      copy = copy.filter((item) => {
        if (item.playlist.some(itemX => itemX.id === currentPlaylist.id)) {
          return true;
        }

        return false;
      });

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

  toggleGroupShow(grouplist) {
    localStorage.setItem('group-list', JSON.stringify(grouplist));

    this.setState({ grouplist });
  }

  runStorageChecker() {
    const defaultPlaylist = {
      id: Date.now(),
      title: 'default',
    };

    let audiolist = JSON.parse(localStorage.getItem('music-list')) || [];
    const playlist = JSON.parse(localStorage.getItem('playlist')) || [defaultPlaylist];
    const currentPlaylist = JSON.parse(localStorage.getItem('current-playlist')) || defaultPlaylist;
    const sortValue = localStorage.getItem('sort-value') || '';
    const grouplist = JSON.parse(localStorage.getItem('group-list')) || { folder: [] };
    const groupByValue = localStorage.getItem('group-value') || '';
    // if the playlist is not added in the localStorage always add the default playlist
    if (!(JSON.parse(localStorage.getItem('playlist')))) {
      localStorage.setItem('playlist', JSON.stringify(playlist));
      localStorage.setItem('current-playlist', JSON.stringify(currentPlaylist));
    }

    audiolist = audiolist.filter((item) => {
      if (item.playlist.some(itemX => itemX.id === currentPlaylist.id)) {
        return true;
      }

      return false;
    });

    this.setState({
      audiolist,
      playlist,
      currentPlaylist,
      sortValue,
      grouplist,
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
    let totalTime = 0;
    let totalSize = 0;

    audiolist.forEach((item) => {
      if (item.duration !== undefined) {
        totalTime += item.duration;
      }

      if (item.size !== undefined) {
        totalSize += item.size;
      }
      // get the file grouping item
      newGroupListKeys.forEach((key, index) => {
        if (!(item.group)) return;
        if (!(item.group[key])) return;

        // if there is group item already in values of newGroupList then dont push
        if (newGroupListValues[index].every(itemX => itemX.title !== item.group[key].title)) {
          newGroupListValues[index].push(item.group[key]);
        }

        newGroupList[key] = newGroupListValues[index];
      });
      // run tag updater
      if (!(item.errorTag) && (!(item.isTagged) || !(item.duration))) {
        ipcRenderer.send('get-song-tags', item);
      }
    });

    localStorage.setItem('group-list', JSON.stringify(newGroupList));

    this.setState({ grouplist: newGroupList, totalTime, totalSize });
  }

  openFolder(arg) {
    if (arg === 'add') {
      ipcRenderer.send('open-folder', 'add');
      return;
    }

    ipcRenderer.send('open-folder');
  }

  addPlaylist(value) {
    const { playlist } = this.state;
    const id = Date.now();
    const newPlaylist = [...playlist];
    if (value.trim().length <= 0) return;

    newPlaylist.push({
      id,
      title: value,
    });
    localStorage.setItem('playlist', JSON.stringify(newPlaylist));

    this.setState({ playlist: newPlaylist });
  }

  addSingleFile() {
    ipcRenderer.send('open-file', 'add');
  }

  changePlaylist(id) {
    const { playlist } = this.state;
    ipcRenderer.send('cancel-all-async-function');

    const item = playlist.find(itemX => itemX.id === id);
    localStorage.setItem('current-playlist', JSON.stringify(item));

    this.setState({ currentPlaylist: item }, () => {
      let audiolist = JSON.parse(localStorage.getItem('music-list')) || [];

      audiolist = audiolist.filter((itemY) => {
        if (itemY.playlist.some(itemX => itemX.id === id)) {
          return true;
        }

        return false;
      });

      this.setState({
        audiolist,
        totalTime: 0,
        totalSize: 0,
      }, this.runTagUpdater);
    });
  }

  deletePlaylist(id) {
    const { playlist, currentPlaylist } = this.state;

    const newPlaylist = [...playlist];
    let newCurrentPlaylist = { ...currentPlaylist };
    // delete the playlist from local playlist
    const deletedIndex = newPlaylist.findIndex(item => item.id === id);
    newPlaylist.splice(deletedIndex, 1);
    // get the copy of audiolist
    const audiolistCopy = JSON.parse(localStorage.getItem('music-list')) || [];
    // get the item in audiolist that has this playlist
    const filteredAudiolistCopy = audiolistCopy.filter((item) => {
      if (item.playlist.some(itemX => itemX.id === id)) return true;

      return false;
    });
    // foreach item in filtered
    // get the index of item in audiolistcopy
    // delete the playlist in item
    // if the playlist in item is equal to 0, delete it !
    filteredAudiolistCopy.forEach((item) => {
      const currentItemIndex = audiolistCopy.findIndex(itemX => itemX.id === item.id);
      const itemToModify = audiolistCopy[currentItemIndex];

      const playlistIndex = itemToModify.playlist.findIndex(itemX => itemX.id === id);
      itemToModify.playlist.splice(playlistIndex, 1);

      if (itemToModify.playlist.length <= 0) audiolistCopy.splice(currentItemIndex, 1);
    });
    // save the modified audiolistcopy to localstorage
    localStorage.setItem('music-list', JSON.stringify(audiolistCopy));
    // get the current playlist
    // if the deleted playlist is in index 0 the give playlist of index 0
    // else give the before index of -1
    if (newCurrentPlaylist.id === id) {
      if (deletedIndex - 1 <= -1) {
        newCurrentPlaylist = newPlaylist[0];
      } else {
        newCurrentPlaylist = newPlaylist[deletedIndex - 1];
      }
    }

    // if newPlaylist is already empty then add default playlist
    // and set current to 0
    if (newPlaylist.length <= 0) {
      newPlaylist.push({
        id: Date.now(),
        title: 'default',
      });

      newCurrentPlaylist = newPlaylist[0];
    }
    // save the playlist
    localStorage.setItem('playlist', JSON.stringify(newPlaylist));
    // update the state and change the current playlist with currentPlaylist
    this.setState({
      playlist: newPlaylist,
    }, () => this.changePlaylist(newCurrentPlaylist.id));
  }

  deleteSingleListFile(id) {
    const {
      audiolist,
      totalTime,
      totalSize,
      grouplist,
    } = this.state;

    const currentItem = audiolist.find(item => item.id === id);
    const groupValues = { folder: currentItem.group.folder };
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

    // delete item from audiolist
    const newAudioList = audiolist.filter(item => item.id !== id);

    // delete the group in state this item has
    const newGroupList = {};
    let newGroupListValues = Object.values(grouplist.folder);

    // if there is still some file has the group then return
    if (!(newAudioList.some(item => item.group.folder.title === groupValues.folder.title))) {
      newGroupListValues = newGroupListValues.filter((item) => {
        return item.title !== groupValues.folder.title;
      });
    }

    newGroupList.folder = newGroupListValues;

    localStorage.setItem('group-list', JSON.stringify(newGroupList));

    let arrTemp = JSON.parse(localStorage.getItem('music-list')) || [];
    this.needToSort = true;

    arrTemp = arrTemp.filter(item => item.id !== id);
    localStorage.setItem('music-list', JSON.stringify(arrTemp));
    arrTemp = []; // clean memory

    this.setState({
      audiolist: newAudioList,
      totalTime: newTotalTime,
      totalSize: newTotalSize,
      grouplist: newGroupList,
    });
  }

  clearList() {
    const { audiolist, currentPlaylist } = this.state;
    // cancel all the asynchronous function in ipcManager
    ipcRenderer.send('cancel-all-async-function');

    let copy = JSON.parse(localStorage.getItem('music-list')) || [];
    let filteredList = audiolist.filter((item) => {
      if (item.playlist.some(itemX => itemX.id === currentPlaylist.id)) {
        return true;
      }

      return false;
    });

    filteredList.forEach((item) => {
      const currentIndex = copy.findIndex(itemX => item.id === itemX.id);
      const itemModify = copy[currentIndex];

      const playlistIndex = itemModify.playlist.findIndex(itemX => itemX.id === currentPlaylist.id);
      itemModify.playlist.splice(playlistIndex, 1);

      if (itemModify.playlist.length <= 0) copy.splice(currentIndex, 1);
    });

    localStorage.setItem('music-list', JSON.stringify(copy));
    filteredList = null; // clean memory

    copy = copy.filter((item) => {
      if (item.playlist.some(itemX => itemX.id === currentPlaylist.id)) {
        return true;
      }

      return false;
    });

    localStorage.setItem('group-list', JSON.stringify({ folder: [] }));

    this.setState({
      audiolist: copy,
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
    const {
      audiolist,
      grouplist,
      currentPlaylist,
    } = this.state;
    const newAudioList = [...audiolist];
    const newGroupList = {};
    const newGroupListValues = Object.values(grouplist);
    // get the folder name for grouping
    const id = file.filePath.substring(file.filePath.length, file.filePath.lastIndexOf('\\') + 1) + Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 1000);
    const title = file.filePath.substring(file.filePath.length, file.filePath.lastIndexOf('\\') + 1);
    const regex = file.filePath.match(/\\.+?\\/g);

    const folder = regex[regex.length - 1].replace(/\\/g, '');

    const objectFile = {
      id,
      title,
      filePath: file.filePath,
      group: {
        folder: {
          title: folder,
          show: true,
        },
      },
      playlist: [currentPlaylist],
    };

    // set the grouping
    ['folder'].forEach((key, index) => {
      // if the group values from objectfile not included in grouplist state
      if (newGroupListValues[index].every(item => item.title !== objectFile.group[key].title)) {
        // push the values into newGroupListValues array
        newGroupListValues[index].push(objectFile.group[key]);
      }
      // set the new group list values in group state with the same key
      newGroupList[key] = newGroupListValues[index];
    });

    newAudioList.push(objectFile);

    let arrTemp = JSON.parse(localStorage.getItem('music-list')) || [];
    this.needToSort = true;

    arrTemp.push(objectFile);
    localStorage.setItem('music-list', JSON.stringify(arrTemp));
    arrTemp = []; // clean memory

    localStorage.setItem('group-list', JSON.stringify(newGroupList));

    this.setState({ audiolist: newAudioList, grouplist: newGroupList }, () => {
      ipcRenderer.send('get-song-tags', objectFile);
    });
  }

  // this will automatically send the get-song-duration event to ipcManager
  updateTags(file) {
    const { audiolist, totalSize } = this.state;

    const newAudioList = [...audiolist];
    const currentIndex = newAudioList.findIndex(item => item.id === file.id);

    newAudioList[currentIndex] = Object.assign({}, newAudioList[currentIndex], file);
    let newTotalSize = totalSize;
    // if the updatetags run for the second size for getting the duration then dont run this
    // it will cause the size to be added twice to this item
    // and also if item is deleted then dont run this too
    if (currentIndex > -1 && !(audiolist[currentIndex].size)) {
      newTotalSize = totalSize + file.size;
    }

    let arrTemp = JSON.parse(localStorage.getItem('music-list')) || [];
    this.needToSort = true;

    const currentIndexA = arrTemp.findIndex(item => item.id === file.id);
    arrTemp[currentIndexA] = Object.assign({}, arrTemp[currentIndexA], file);
    localStorage.setItem('music-list', JSON.stringify(arrTemp));
    arrTemp = []; // clean memory


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

    let newTotalTime = totalTime;
    // if the updatetags run for the second time for getting the duration then dont run this
    // it will cause the time to be added twice to this item
    // and also if item is deleted then dont run this too
    if (currentIndex > -1 && !(audiolist[currentIndex].duration)) {
      newTotalTime = totalTime + file.duration;
    }

    let arrTemp = JSON.parse(localStorage.getItem('music-list')) || [];
    this.needToSort = true;

    const currentIndexA = arrTemp.findIndex(item => item.id === file.id);
    arrTemp[currentIndexA] = Object.assign({},
      arrTemp[currentIndexA],
      { duration: file.duration });

    localStorage.setItem('music-list', JSON.stringify(arrTemp));
    arrTemp = []; // clean memory


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
      playlist,
      currentPlaylist,
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
    // only sort if this.needToSort is on
    // so this function will not always sort everytime the list item clicked
    let sortedFilteredAudioList = filteredAudioList || audiolist;
    if (sortValue.length > 0 && this.needToSort) {
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

      this.needToSort = false;
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
          playlist={playlist}
          currentPlaylist={currentPlaylist}
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
      playlist,
      currentPlaylist,
    } = this.state;

    const { audiolist } = this.state;

    if (audiolist.length <= 0) {
      return <i id="list-ui-null" className="fas fa-list-ul" />;
    }
    // only sort if this.needToSort is on
    // so this function will not always sort everytime the list item clicked
    if (sortValue.length > 0 && this.needToSort) {
      grouplist[groupByValue].forEach((item) => {
        // get the item that match this grouping value
        let list = audiolist.filter(itemX => itemX.group[groupByValue] === item);
        // sort the matched item
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
        // forEach item in list we find it index in audiolist and remove it from audiolist
        // and then push the item into audiolist
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
          grouplist={grouplist}
          groupValue={groupByValue}
          listValue={item}
          sortValue={sortValue}
          deleteSingleListFile={this.deleteSingleListFile}
          sendFile={this.sendFile}
          playlist={playlist}
          currentPlaylist={currentPlaylist}
          toggleGroupShow={this.toggleGroupShow}
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
            <span>none</span>
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

  renderPlaylistModal() {
    const {
      isPlaylistModalShow,
      playlist,
      currentPlaylist,
    } = this.state;

    if (!isPlaylistModalShow) return null;

    return (
      <PlaylistModal
        closeFunction={() => this.toggleModal('playlist')}
        playlist={playlist}
        currentPlaylist={currentPlaylist}
        addPlaylist={this.addPlaylist}
        changePlaylist={this.changePlaylist}
        deletePlaylist={this.deletePlaylist}
      />
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
          <Touchable
            onClick={() => this.toggleModal('playlist')}
            icon="fas fa-list-alt"
            className="button-playlist"
          />
          {this.renderAddModal()}
          {this.renderSortModal()}
          {this.renderPlaylistModal()}
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
