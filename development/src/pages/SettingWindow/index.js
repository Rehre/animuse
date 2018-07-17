/* eslint-env browser */
import React from 'react';

import './styles/SettingWindow.css';
import HeaderTitle from '../../common/HeaderTitle';

import SettingItem from './components/SettingItem';

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
          <SettingItem
            title="Notification"
            onClick={() => ipcRenderer.send('change-setting', {
              properties: 'notification',
              value: !(setting.notification),
            })}
            custom={() => {
              return (
                <input
                  type="checkbox"
                  readOnly
                  defaultChecked={setting.notification}
                />
              );
            }}
          />
        </div>
      </div>
    );
  }
}

export default SettingWindow;
