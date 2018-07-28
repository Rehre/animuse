import React from 'react';
import update from 'immutability-helper';
import PropTypes from 'prop-types';

import './styles/ListGroup.css';
import List from './List';

class ListGroup extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isContentShowed: false,
    };

    this.toggleList = this.toggleList.bind(this);
    this.renderList = this.renderList.bind(this);
    this.renderContent = this.renderContent.bind(this);
    this.renderButton = this.renderButton.bind(this);
  }

  toggleList() {
    const { isContentShowed } = this.state;

    this.setState({ isContentShowed: !isContentShowed });
  }

  renderList() {
    const {
      audiolist,
      selectedItem,
      groupValue,
      listValue,
      sortValue,
      deleteSingleListFile,
      sendFile,
    } = this.props;

    if (audiolist.length <= 0) {
      return <i id="list-ui-null" className="fas fa-list-ul" />;
    }

    const filteredAudioList = audiolist.filter(item => item.group[groupValue] === listValue);

    let sortedFilteredAudioList;

    if (sortValue.length > 0) {
      sortedFilteredAudioList = update(filteredAudioList, {
        $apply: (appl) => {
          return appl.concat().sort((a, b) => {
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
      if (sortValue.length > 0) {
        return sortedFilteredAudioList;
      }

      return filteredAudioList;
    }

    return getProcessedList().map((item) => {
      return (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onClick={() => sendFile(item.id, item)}
          deleteFunction={deleteSingleListFile}
        />
      );
    });
  }

  renderContent() {
    const { isContentShowed } = this.state;

    if (!isContentShowed) return null;

    return (
      <div className="ListGroup__content">
        {this.renderList()}
      </div>
    );
  }

  renderButton() {
    const { isContentShowed } = this.state;
    const { audiolist, groupValue } = this.props;
    let { listValue } = this.props;

    const length = audiolist.filter(item => item.group[groupValue] === listValue).length;
    listValue = (listValue.length > 30) ? `${listValue.substr(0, 30)} ...` : listValue;
    const className = (isContentShowed) ? 'fas fa-chevron-circle-down' : 'fas fa-chevron-circle-up';

    return (
      <div className="ListGroup__button" onClick={this.toggleList}>
        <i className={`${className} ListGroup__button__icon`} />
        <h4 className="ListGroup__button__title">{listValue}</h4>
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
  listValue: PropTypes.string.isRequired,
  sortValue: PropTypes.string.isRequired,
  deleteSingleListFile: PropTypes.func.isRequired,
  sendFile: PropTypes.func.isRequired,
};

export default ListGroup;
