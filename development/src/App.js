import React from 'react';
import '@fortawesome/fontawesome-free/css/all.css';
import { HashRouter, Switch, Route } from 'react-router-dom';

import MainWindow from './pages/MainWindow';
import ListWindow from './pages/ListWindow';

class App extends React.PureComponent {
  render() {
    return (
      <HashRouter>
        <div className="react-app">
          <Switch>
            <Route exact path="/" component={MainWindow} />
            <Route path="/list" component={ListWindow} />
          </Switch>
        </div>
      </HashRouter>
    );
  }
}

export default App;
