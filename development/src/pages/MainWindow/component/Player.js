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
    };

    this.renderPlayButton = this.renderPlayButton.bind(this);
    this.togglePlayPause = this.togglePlayPause.bind(this);
    this.renderDuration = this.renderDuration.bind(this);
    this.renderSlider = this.renderSlider.bind(this);
    this.setSongTime = this.setSongTime.bind(this);
  }

  componentDidMount() {
    this.audio.addEventListener('canplay', () => {
      this.audio.play();

      this.setState({ isPlayed: true });
    });

    this.audio.addEventListener('ended', () => {
      this.setState({ currentTime: 0 }, this.togglePlayPause);
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

  renderPlayButton() {
    const { isPlayed } = this.state;

    if (!isPlayed) {
      return (
        <Touchable
          onPress={this.togglePlayPause}
          icon="fas fa-play-circle"
          id="button-pause-play"
        />
      );
    }

    return (
      <Touchable
        onPress={this.togglePlayPause}
        icon="fas fa-pause-circle"
        id="button-pause-play"
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
        max={duration}
        value={currentTime}
        onChange={this.setSongTime}
      />
    );
  }

  render() {
    const { file, openFile } = this.props;

    return (
      <div className="Player">
        <audio ref={node => this.audio = node} src={file} />
        <Touchable
          onPress={openFile}
          icon="fas fa-file-audio"
          id="button-open"
        />
        {this.renderSlider()}
        {this.renderPlayButton()}
        {this.renderDuration()}
      </div>
    );
  }
}

Player.propTypes = {
  file: PropTypes.string.isRequired,
  openFile: PropTypes.func.isRequired,
};

export default Player;
