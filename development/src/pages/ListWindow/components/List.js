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
        className="button-move-item"
      />
      <h4 id="title-song">
        {title}
      </h4>
      <span id="album-and-size">
        {albumAndSize}
      </span>
      <span id="duration">
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
