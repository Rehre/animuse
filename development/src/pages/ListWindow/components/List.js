import React from 'react';
import PropTypes from 'prop-types';

import './styles/List.css';
import Touchable from '../../../common/Touchable';
import Modal from '../../../common/Modal';

class List extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isDescriptionShow: false,
    };

    this.getItemDetail = this.getItemDetail.bind(this);
    this.toggleDescriptionModal = this.toggleDescriptionModal.bind(this);
    this.renderDescriptionModal = this.renderDescriptionModal.bind(this);
  }

  getItemDetail() {
    const { item, selectedItem, onClick } = this.props;

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

    return {
      id: item.id,
      className,
      onClick,
      albumAndSize,
      title,
      duration,
      filePath: item.filePath,
    };
  }

  toggleDescriptionModal(ev) {
    ev.stopPropagation();
    const { isDescriptionShow } = this.state;

    this.setState({ isDescriptionShow: !isDescriptionShow });
  }

  renderDescriptionModal() {
    const { isDescriptionShow } = this.state;
    const {
      id,
      title,
      albumAndSize,
      filePath,
      duration,
    } = this.getItemDetail();
    const { deleteFunction } = this.props;

    if (!isDescriptionShow) return null;

    const realTitle = title.split(' - ')[0];
    const artist = title.split(' - ')[1];
    const album = albumAndSize.split(' - ')[0];
    const size = albumAndSize.split(' - ')[1];

    return (
      <Modal
        closeFunction={this.toggleDescriptionModal}
        wrapperClassName="modal-item-description"
      >
        <div className="modal-description">
          <div className="modal-description__item--title">
            <span>Title: {realTitle}</span>
          </div>
          <div className="modal-description__item--artist">
            <span>Artist: {artist}</span>
          </div>
          <div className="modal-description__item--album">
            <span>Album: {album}</span>
          </div>
          <div className="modal-description__item--size">
            <span>Size: {size}</span>
          </div>
          <div className="modal-description__item--size">
            <span>Duration: {duration}</span>
          </div>
          <div className="modal-description__item--path">
            <span>Dir: {filePath}</span>
          </div>
          <Touchable
            onClick={() => deleteFunction(id)}
            icon="fas fa-ban"
            className="modal-description__item--delete-button"
          />
        </div>
      </Modal>
    );
  }

  render() {
    const {
      className,
      onClick,
      title,
      albumAndSize,
      duration,
    } = this.getItemDetail();

    return (
      <div className="music-item">
        {this.renderDescriptionModal()}
        <div
          className={`music-list ${className}`}
          onClick={onClick}
        >
          <Touchable
            onClick={ev => this.toggleDescriptionModal(ev)}
            icon="fas fa-ellipsis-v"
            className="music-list__button-move-item"
          />
          <h4 className="music-list__title-song">
            {title}
          </h4>
          <span className="music-list__album-and-size">
            {albumAndSize}
          </span>
          <span className="music-list__duration">
            {duration}
          </span>
        </div>
      </div>
    );
  }
}

List.propTypes = {
  item: PropTypes.object.isRequired,
  selectedItem: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  deleteFunction: PropTypes.func.isRequired,
};

export default List;
