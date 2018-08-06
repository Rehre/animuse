import React from 'react';
import PropTypes from 'prop-types';

import './styles/ListGroup.css';
import List from './List';

class ListGroup extends React.Component {
  constructor(props) {
    super(props);

    this.toggleList = this.toggleList.bind(this);
    this.renderList = this.renderList.bind(this);
    this.renderContent = this.renderContent.bind(this);
    this.renderButton = this.renderButton.bind(this);
  }

  toggleList() {
    const {
      grouplist,
      groupValue,
      listValue,
      toggleGroupShow,
    } = this.props;
    const newGroupList = { ...grouplist };
    const newGroupItemList = grouplist[groupValue].map((item) => {
      if (item.title === listValue.title) {
        return {
          title: listValue.title,
          show: !(listValue.show),
        };
      }

      return item;
    });

    newGroupList[groupValue] = newGroupItemList;

    toggleGroupShow(newGroupList);
  }

  renderList() {
    const {
      audiolist,
      selectedItem,
      groupValue,
      listValue,
      deleteSingleListFile,
      sendFile,
      playlist,
      currentPlaylist,
    } = this.props;

    if (audiolist.length <= 0) {
      return <i id="list-ui-null" className="fas fa-list-ul" />;
    }

    return audiolist.map((item) => {
      if (item.group[groupValue].title === listValue.title) {
        return (
          <List
            key={item.id}
            item={item}
            selectedItem={selectedItem}
            onClick={() => sendFile(item.id, item)}
            deleteFunction={deleteSingleListFile}
            playlist={playlist}
            currentPlaylist={currentPlaylist}
          />
        );
      }

      return null;
    });
  }

  renderContent() {
    const { listValue } = this.props;

    if (!(listValue.show)) return null;

    return (
      <div className="ListGroup__content">
        {this.renderList()}
      </div>
    );
  }

  renderButton() {
    const { audiolist, groupValue, listValue } = this.props;

    const key = listValue.title;
    const length = audiolist.filter(item => item.group[groupValue].title === key).length;

    if (length <= 0) return null;

    const listName = (key.length > 30) ? `${key.substr(0, 30)} ...` : key;
    const className = (listValue.show) ? 'fas fa-chevron-circle-down' : 'fas fa-chevron-circle-up';

    return (
      <div className="ListGroup__button" onClick={this.toggleList}>
        <i className={`${className} ListGroup__button__icon`} />
        <h4 className="ListGroup__button__title">{listName}</h4>
        <h4 className="ListGroup__button__length">{length}</h4>
      </div>
    );
  }

  render() {
    return (
      <div className="ListGroup">
        {this.renderButton()}
        {this.renderContent()}
      </div>
    );
  }
}

ListGroup.propTypes = {
  audiolist: PropTypes.array.isRequired,
  selectedItem: PropTypes.string.isRequired,
  groupValue: PropTypes.string.isRequired,
  listValue: PropTypes.object.isRequired,
  deleteSingleListFile: PropTypes.func.isRequired,
  sendFile: PropTypes.func.isRequired,
  toggleGroupShow: PropTypes.func.isRequired,
  playlist: PropTypes.array.isRequired,
  currentPlaylist: PropTypes.object.isRequired,
  grouplist: PropTypes.object.isRequired,
};

export default ListGroup;
