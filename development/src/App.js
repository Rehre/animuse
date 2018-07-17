/* eslint-env browser */
import React from 'react';
import '@fortawesome/fontawesome-free/css/all.css';
import { HashRouter, Switch, Route } from 'react-router-dom';

import MainWindow from './pages/MainWindow';
import ListWindow from './pages/ListWindow';
import SettingWindow from './pages/SettingWindow';

const { ipcRenderer } = window.require('electron');

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userTheme: {
        textColor: '',
        iconHoverColor: '',
      },
    };

    this.setThemeColor = this.setThemeColor.bind(this);
  }

  componentDidMount() {
    ipcRenderer.send('get-setting');

    ipcRenderer.on('sended-setting', (event, arg) => {
      this.setState({
        userTheme: Object.assign({}, {
          textColor: arg.textColor,
          iconHoverColor: arg.iconHoverColor,
        }),
      }, this.setThemeColor);
    });
  }

  setThemeColor() {
    const { userTheme } = this.state;

    document.body.style.setProperty('--text-color', userTheme.textColor);
    document.body.style.setProperty('--icon-hover-color', userTheme.iconHoverColor);
  }

  render() {
    return (
      <HashRouter>
        <div className="react-app">
          <Switch>
            <Route exact path="/" component={MainWindow} />
            <Route path="/list" component={ListWindow} />
            <Route path="/setting" component={SettingWindow} />
          </Switch>
        </div>
      </HashRouter>
    );
  }
}

export default App;
