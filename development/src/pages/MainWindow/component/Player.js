import React from 'react';
import PropTypes from 'prop-types';

import './styles/Player.css';
import Touchable from '../../../common/Touchable';

class Player extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isPlayed: false,
      duration: 0,
      currentTime: 0,
      isRandomized: false,
      isLooped: false,
      isLoopedAll: false,
    };

    this.setSongTime = this.setSongTime.bind(this);
    this.changePlayerSong = this.changePlayerSong.bind(this);
    this.togglePlayPause = this.togglePlayPause.bind(this);
    this.toggleLoop = this.toggleLoop.bind(this);
    this.toggleRandom = this.toggleRandom.bind(this);
    this.renderPlayButton = this.renderPlayButton.bind(this);
    this.renderRandomButton = this.renderRandomButton.bind(this);
    this.renderToggleLoop = this.renderToggleLoop.bind(this);
    this.renderDuration = this.renderDuration.bind(this);
    this.renderSlider = this.renderSlider.bind(this);
  }

  componentDidMount() {
    this.audio.addEventListener('canplay', () => {
      this.audio.play();
      this.setState({ isPlayed: true });
    });
    // this event will run only if isLooped is false
    this.audio.addEventListener('ended', () => {
      this.setState({ currentTime: 0 }, () => {
        this.togglePlayPause();
        this.changePlayerSong('next');
      });
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.setState({
        duration: this.audio.duration,
        currentTime: this.audio.currentTime,
      });
    });

    this.audio.addEventListener('timeupdate', () => {
      this.setState({ currentTime: this.audio.currentTime });
    });
  }

  setSongTime(event) {
    this.audio.currentTime = event.target.value;
  }

  setPlayerVolume(event) {
    this.audio.volume = event.target.value;
  }

  changePlayerSong(state) {
    const { isRandomized, isLoopedAll } = this.state;
    const { changeSong } = this.props;

    if (isRandomized) {
      changeSong('random');

      return;
    }

    if (isLoopedAll) {
      changeSong('loop-all-next');

      return;
    }

    changeSong(state);
  }

  togglePlayPause() {
    const { isPlayed } = this.state;
    const { file } = this.props;

    if (!file) return;

    if (isPlayed) {
      this.audio.pause();
    } else {
      this.audio.play();
    }

    this.setState({ isPlayed: !isPlayed });
  }

  toggleLoop() {
    const { isLooped, isLoopedAll } = this.state;

    if (!isLooped && !isLoopedAll) {
      this.audio.loop = true;
      this.setState({ isLooped: true });
    }

    if (isLooped && !isLoopedAll) {
      this.audio.loop = false;
      this.setState({ isLooped: false, isLoopedAll: true });
    }

    if (isLoopedAll) {
      this.setState({ isLoopedAll: false });
    }
  }

  toggleRandom() {
    const { isRandomized } = this.state;

    this.setState({ isRandomized: !isRandomized });
  }

  renderPlayButton() {
    const { isPlayed } = this.state;
    let icon = 'fas fa-pause-circle';

    if (!isPlayed) {
      icon = 'fas fa-play-circle';
    }

    return (
      <Touchable
        onPress={this.togglePlayPause}
        icon={icon}
        id="button-pause-play"
      />
    );
  }

  renderToggleLoop() {
    const { isLooped, isLoopedAll } = this.state;

    if (isLoopedAll) {
      return (
        <Touchable
          onPress={this.toggleLoop}
          icon="fas fa-circle-notch"
          id="button-loop-all"
        />
      );
    }

    if (isLooped) {
      return (
        <Touchable
          onPress={this.toggleLoop}
          icon="fas fa-redo"
          id="button-loop-colored"
        />
      );
    }

    return (
      <Touchable
        onPress={this.toggleLoop}
        icon="fas fa-redo"
        id="button-loop"
      />
    );
  }

  renderRandomButton() {
    const { isRandomized } = this.state;
    let id = 'button-random';

    if (isRandomized) {
      id = 'button-random-colored';
    }

    return (
      <Touchable
        onPress={this.toggleRandom}
        icon="fas fa-random"
        id={id}
      />
    );
  }

  renderDuration() {
    const { duration, currentTime } = this.state;

    const minutes = (Math.trunc(duration / 60)).toString();
    const seconds = (Math.trunc(duration % 60)).toString();
    const currentMinutes = (Math.trunc(currentTime / 60)).toString();
    let currentSeconds = (Math.trunc(currentTime % 60)).toString();

    currentSeconds = (currentSeconds === '60') ? '0' : currentSeconds;

    return (
      <p id="duration">
        {'00'.substr(currentMinutes.length) + currentMinutes}
        :
        {'00'.substr(currentSeconds.length) + currentSeconds}
        {' '}
        /
        {' '}
        {'00'.substr(minutes.length) + minutes}
        :
        {'00'.substr(seconds.length) + seconds}
      </p>
    );
  }

  renderSlider() {
    const { duration, currentTime } = this.state;

    return (
      <input
        id="slider"
        type="range"
        max={Math.trunc(duration)}
        value={Math.trunc(currentTime)}
        onChange={this.setSongTime}
      />
    );
  }

  render() {
    const { file, openFile, openWindow } = this.props;

    return (
      <div className="Player">
        <audio ref={node => this.audio = node} src={file} />
        <Touchable
          onPress={openFile}
          icon="fas fa-file-audio"
          id="button-open"
        />
        <Touchable
          onPress={() => openWindow('list')}
          icon="fas fa-align-justify"
          id="button-open-list"
        />
        {this.renderSlider()}
        {this.renderRandomButton()}
        <Touchable
          onPress={() => this.changePlayerSong('previous')}
          icon="fas fa-backward"
          id="button-previous"
        />
        {this.renderPlayButton()}
        <Touchable
          onPress={() => this.changePlayerSong('next')}
          icon="fas fa-forward"
          id="button-next"
        />
        {this.renderToggleLoop()}
        {this.renderDuration()}
      </div>
    );
  }
}

Player.propTypes = {
  file: PropTypes.string.isRequired,
  openFile: PropTypes.func.isRequired,
  changeSong: PropTypes.func.isRequired,
  openWindow: PropTypes.func.isRequired,
};

export default Player;
