import React from 'react';
import PropTypes from 'prop-types';

import './styles/SettingItem.css';

function SettingItem({
  onClick,
  title,
  custom,
}) {
  return (
    <div
      className="setting-list__item"
      onClick={onClick}
    >
      <h4 className="setting-list__item__title">{title}</h4>
      <div className="setting-list__item__custom">
        {custom()}
      </div>
    </div>
  );
}

SettingItem.propTypes = {
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  custom: PropTypes.func,
};

SettingItem.defaultProps = {
  custom: () => {},
};

export default SettingItem;
