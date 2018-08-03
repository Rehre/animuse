/* eslint-env browser */
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
      isVolumeSliderShowed: false,
      volume: 100,
    };

    this.setSongTime = this.setSongTime.bind(this);
    this.setPlayerVolume = this.setPlayerVolume.bind(this);
    this.runStorageChecker = this.runStorageChecker.bind(this);
    this.changePlayerSong = this.changePlayerSong.bind(this);
    this.togglePlayPause = this.togglePlayPause.bind(this);
    this.toggleLoop = this.toggleLoop.bind(this);
    this.toggleRandom = this.toggleRandom.bind(this);
    this.renderPlayButton = this.renderPlayButton.bind(this);
    this.renderRandomButton = this.renderRandomButton.bind(this);
    this.renderVolumeSlider = this.renderVolumeSlider.bind(this);
    this.renderVolumeButton = this.renderVolumeButton.bind(this);
    this.renderToggleLoop = this.renderToggleLoop.bind(this);
    this.renderDuration = this.renderDuration.bind(this);
    this.renderSlider = this.renderSlider.bind(this);
  }

  componentDidMount() {
    this.runStorageChecker();

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
    const volume = event.target.value;

    localStorage.setItem('volume', JSON.stringify(volume));
    this.setState({ volume }, () => {
      this.audio.volume = volume / 100;
    });
  }

  runStorageChecker() {
    const volume = JSON.parse(localStorage.getItem('volume')) || 100;
    const isLooped = JSON.parse(localStorage.getItem('isLooped')) || false;
    const isLoopedAll = JSON.parse(localStorage.getItem('isLoopedAll')) || false;
    const isRandomized = JSON.parse(localStorage.getItem('isRandomized')) || false;

    this.setState({
      volume,
      isLooped,
      isLoopedAll,
      isRandomized,
    }, () => {
      this.audio.volume = volume / 100;
    });
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
      localStorage.setItem('isLooped', JSON.stringify(true));
      this.setState({ isLooped: true });
    }

    if (isLooped && !isLoopedAll) {
      this.audio.loop = false;
      localStorage.setItem('isLooped', JSON.stringify(false));
      localStorage.setItem('isLoopedAll', JSON.stringify(true));
      this.setState({ isLooped: false, isLoopedAll: true });
    }

    if (isLoopedAll) {
      localStorage.setItem('isLoopedAll', JSON.stringify(false));
      this.setState({ isLoopedAll: false });
    }
  }

  toggleRandom() {
    const { isRandomized } = this.state;

    localStorage.setItem('isRandomized', JSON.stringify(!isRandomized));
    this.setState({ isRandomized: !isRandomized });
  }

  renderVolumeSlider() {
    const { volume, isVolumeSliderShowed } = this.state;

    if (!isVolumeSliderShowed) return null;

    return (
      <div className="volume-slider">
        <input type="range" min="0" max="100" value={volume} onChange={this.setPlayerVolume} />
        <span>{volume}</span>
      </div>
    );
  }

  renderVolumeButton() {
    const { volume, isVolumeSliderShowed } = this.state;

    let icon = 'fas fa-volume-off';

    if (volume > 50) icon = 'fas fa-volume-up';

    if (volume <= 50 && volume > 0) icon = 'fas fa-volume-down';

    return (
      <Touchable
        onClick={() => this.setState({ isVolumeSliderShowed: !isVolumeSliderShowed })}
        icon={icon}
        className="button-volume"
      />
    );
  }

  renderPlayButton() {
    const { isPlayed } = this.state;
    let icon = 'fas fa-pause-circle';

    if (!isPlayed) {
      icon = 'fas fa-play-circle';
    }

    return (
      <Touchable
        onClick={this.togglePlayPause}
        icon={icon}
        className="button-pause-play"
      />
    );
  }

  renderToggleLoop() {
    const { isLooped, isLoopedAll } = this.state;

    if (isLoopedAll) {
      return (
        <Touchable
          onClick={this.toggleLoop}
          icon="fas fa-circle-notch"
          className="button-loop-all"
        />
      );
    }

    if (isLooped) {
      return (
        <Touchable
          onClick={this.toggleLoop}
          icon="fas fa-redo"
          className="button-loop-colored"
        />
      );
    }

    return (
      <Touchable
        onClick={this.toggleLoop}
        icon="fas fa-redo"
        className="button-loop"
      />
    );
  }

  renderRandomButton() {
    const { isRandomized } = this.state;
    let className = 'button-random';

    if (isRandomized) {
      className = 'button-random-colored';
    }

    return (
      <Touchable
        onClick={this.toggleRandom}
        icon="fas fa-random"
        className={className}
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
          onClick={openFile}
          icon="fas fa-file-audio"
          className="button-open"
        />
        <Touchable
          onClick={() => openWindow('list')}
          icon="fas fa-align-justify"
          className="button-open-list"
        />
        {this.renderSlider()}
        {this.renderVolumeSlider()}
        {this.renderVolumeButton()}
        {this.renderRandomButton()}
        <Touchable
          onClick={() => this.changePlayerSong('previous')}
          icon="fas fa-backward"
          className="button-previous"
        />
        {this.renderPlayButton()}
        <Touchable
          onClick={() => this.changePlayerSong('next')}
          icon="fas fa-forward"
          className="button-next"
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
