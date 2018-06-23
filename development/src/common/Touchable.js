import React from 'react';
import PropTypes from 'prop-types';

import './styles/Touchable.css';

function Touchable({
  onPress,
  icon,
  id,
}) {
  return (
    <div
      id={id}
      className="Touchable"
      onClick={onPress}
    >
      <i className={icon} />
    </div>
  );
}


Touchable.propTypes = {
  onPress: PropTypes.func.isRequired,
  id: PropTypes.string,
  icon: PropTypes.string.isRequired,
};

Touchable.defaultProps = {
  id: '',
};

export default Touchable;
