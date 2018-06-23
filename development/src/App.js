import React from 'react';
import '@fortawesome/fontawesome-free/css/all.css';

import MainWindow from './pages/MainWindow';

class App extends React.PureComponent {
  render() {
    return (
      <div className="react-app">
        <MainWindow />
      </div>
    );
  }
}

export default App;
