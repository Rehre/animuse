import React from 'react';
import PropTypes from 'prop-types';

import './styles/Statusbar.css';

function Statusbar({ onClose, onMinimze }) {
  return (
    <div className="status-bar">
      <div
        className="button-status"
        id="minimize-button"
        onClick={onMinimze}
      />
      <div
        className="button-status"
        id="close-button"
        onClick={onClose}
      />
    </div>
  );
}

Statusbar.propTypes = {
  onClose: PropTypes.func.isRequired,
  onMinimze: PropTypes.func.isRequired,
};

export default Statusbar;
