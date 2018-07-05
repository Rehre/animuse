import React from 'react';
import PropTypes from 'prop-types';

import './styles/Touchable.css';

function Touchable({
  onClick,
  icon,
  className,
}) {
  return (
    <div
      className={`Touchable ${className}`}
      onClick={onClick}
    >
      <i className={icon} />
    </div>
  );
}


Touchable.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  icon: PropTypes.string.isRequired,
};

Touchable.defaultProps = {
  className: '',
};

export default Touchable;
