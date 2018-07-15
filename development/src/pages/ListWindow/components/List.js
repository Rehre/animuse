import React from 'react';
import PropTypes from 'prop-types';

import './styles/List.css';
import Touchable from '../../../common/Touchable';

function List({
  item,
  selectedItem,
  onClick,
}) {
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
    <div
      className={`music-list ${className}`}
      onClick={onClick}
    >
      <Touchable
        onClick={() => {}}
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
  );
}

List.propTypes = {
  item: PropTypes.object.isRequired,
  selectedItem: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default List;
