import React from 'react';
import PropTypes from 'prop-types';

import './styles/List.css';
import Touchable from '../../../common/Touchable';

function List({
  id,
  className,
  title,
  albumAndSize,
  duration,
  onClick,
}) {
  return (
    <div
      className={`music-list ${className}`}
      key={id}
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
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  title: PropTypes.string.isRequired,
  albumAndSize: PropTypes.string.isRequired,
  duration: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

List.defaultProps = {
  className: '',
};

export default List;
