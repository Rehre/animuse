import React from 'react';
import PropTypes from 'prop-types';

import './styles/TitleBar.css';

function TitleBar({ className, onClose, onMinimize }) {
  return (
    <div className={`title-bar ${className}`}>
      <div
        className="title-bar__button title-bar__button--yellow"
        onClick={onMinimize}
      />
      <div
        className="title-bar__button title-bar__button--red"
        onClick={onClose}
      />
    </div>
  );
}

TitleBar.propTypes = {
  className: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onMinimize: PropTypes.func.isRequired,
};

TitleBar.defaultProps = {
  className: '',
}

export default TitleBar;
