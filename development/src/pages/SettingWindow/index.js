/* eslint-env browser */
import React from 'react';

import './styles/SettingWindow.css';
import HeaderTitle from '../../common/HeaderTitle';

import SettingItem from './components/SettingItem';
import Modal from '../../common/Modal';

const { ipcRenderer, remote } = window.require('electron');
class SettingWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      setting: {},
      isColorPickerShow: {
        show: false,
        modal: '',
      },
    };

    this.renderColorPickerModal = this.renderColorPickerModal.bind(this);
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

  renderColorPickerModal() {
    const { isColorPickerShow, setting } = this.state;

    if (!(isColorPickerShow.show)) return null;

    let className = 'hover';
    let color = setting.iconHoverColor;

    if (isColorPickerShow.modal === 'text') {
      className = 'text';
      color = setting.textColor;
    }

    function getColor(arg) {
      if (arg === 'red') return parseInt(`0x${color.substr(1, 2)}`, 16);
      if (arg === 'green') return parseInt(`0x${color.substr(3, 2)}`, 16);

      return parseInt(`0x${color.substr(5, 2)}`, 16);
    }

    function onChangeInput(value, arg) {
      let hex = parseInt(value, 10).toString(16);
      hex = `${'00'.substr(hex.length)}${hex}`;

      let newColor = '#';

      if (arg === 'red') newColor = `${newColor}${hex}${color.substr(3)}`;
      if (arg === 'green') newColor = `${newColor}${color.substr(1, 2)}${hex}${color.substr(5)}`;
      if (arg === 'blue') newColor = `${newColor}${color.substr(1, 4)}${hex}`;

      ipcRenderer.send('change-setting', {
        properties: (className === 'hover') ? 'iconHoverColor' : 'textColor',
        value: newColor,
        sendToAll: true,
      });
    }

    const close = () => this.setState({ isColorPickerShow: { show: false, modal: '' } });

    return (
      <Modal
        className="color-picker"
        closeFunction={close}
      >
        <div className="color-picker__wrapper">
          <div className={`color-picker__viewer color-picker__viewer--${className}`} />
          <span className="color-picker__color">{color.toUpperCase()}</span>
          <div className="color-picker__input">
            <div className="color-picker__input__red">
              <span>R</span>
              <input
                type="range"
                min="0"
                max="255"
                value={getColor('red')}
                onChange={ev => onChangeInput(ev.target.value, 'red')}
              />
            </div>
            <div className="color-picker__input__green">
              <span>G</span>
              <input
                type="range"
                min="0"
                max="255"
                value={getColor('green')}
                onChange={ev => onChangeInput(ev.target.value, 'green')}
              />
            </div>
            <div className="color-picker__input__blue">
              <span>B</span>
              <input
                type="range"
                min="0"
                max="255"
                value={getColor('blue')}
                onChange={ev => onChangeInput(ev.target.value, 'blue')}
              />
            </div>
          </div>
          <div
            className="color-picker__confirm"
            onClick={close}
          >
            <span>Confirm</span>
          </div>
        </div>
      </Modal>
    );
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
          <SettingItem
            title="Hover color"
            onClick={() => this.setState({ isColorPickerShow: { show: true, modal: 'hover' } })}
            custom={() => <div className="color-viewer" />}
          />
          <SettingItem
            title="Text color"
            onClick={() => this.setState({ isColorPickerShow: { show: true, modal: 'text' } })}
            custom={() => <div className="text-color-viewer" />}
          />
          {this.renderColorPickerModal()}
        </div>
      </div>
    );
  }
}

export default SettingWindow;
