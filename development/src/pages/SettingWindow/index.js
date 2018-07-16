/* eslint-env browser */
import React from 'react';

import './styles/SettingWindow.css';
import HeaderTitle from '../../common/HeaderTitle';

const { remote } = window.require('electron');
class SettingWindow extends React.Component {
  toggleCloseMinimize(arg) {
    if (arg === 'close') remote.getCurrentWindow().close();
    if (arg === 'minimize') remote.getCurrentWindow().minimize();
  }

  render() {
    return (
      <div className="SettingWindow">
        <HeaderTitle
          onClose={() => this.toggleCloseMinimize('close')}
          onMinimize={() => this.toggleCloseMinimize('minimize')}
        />
      </div>
    );
  }
}

export default SettingWindow;
