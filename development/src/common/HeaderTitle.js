import React from 'react';
import PropTypes from 'prop-types';

import './styles/HeaderTitle.css';
import TitleBar from './TitleBar';

function HeaderTitle({ onClose, onMinimize }) {
  return (
    <div className="header">
      <TitleBar
        onClose={onClose}
        onMinimize={onMinimize}
      />
    </div>
  );
}

HeaderTitle.propTypes = {
  onClose: PropTypes.func.isRequired,
  onMinimize: PropTypes.func.isRequired,
};

export default HeaderTitle;
