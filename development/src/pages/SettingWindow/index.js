/* eslint-env browser */
import React from 'react';

import './styles/SettingWindow.css';
import HeaderTitle from '../../common/HeaderTitle';

const { ipcRenderer, remote } = window.require('electron');
class SettingWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      setting: {},
    };
  }

  componentDidMount() {
    ipcRenderer.send('get-setting');

    ipcRenderer.on('sended-setting', (event, arg) => {
      this.setState({ setting: arg });
    });
  }

  toggleCloseMinimize(arg) {
    if (arg === 'close') remote.getCurrentWindow().close();
    if (arg === 'minimize') remote.getCurrentWindow().minimize();
  }

  render() {
    const { setting } = this.state;

    return (
      <div className="SettingWindow">
        <HeaderTitle
          onClose={() => this.toggleCloseMinimize('close')}
          onMinimize={() => this.toggleCloseMinimize('minimize')}
        />
        <div className="setting-list">
          <div
            className="setting-list__item"
            onClick={() => ipcRenderer.send('change-setting', {
              properties: 'notification',
              value: !(setting.notification),
            })}
          >
            <h4 className="setting-list__item__title">Notification</h4>
            <input
              className="setting-list__item__input"
              type="checkbox"
              readOnly
              defaultChecked={setting.notification}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default SettingWindow;
