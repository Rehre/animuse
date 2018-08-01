import React from 'react';
import PropTypes from 'prop-types';

import './styles/PlaylistModal.css';
import Modal from '../../../common/Modal';
import Touchable from '../../../common/Touchable';

class PlaylistModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isConfirmModalShow: false,
      isTextAdderShow: false,
      textInput: '',
    };

    this.toggleModal = this.toggleModal.bind(this);
    this.renderAdder = this.renderAdder.bind(this);
    this.renderModal = this.renderModal.bind(this);
    this.renderPlaylist = this.renderPlaylist.bind(this);
  }

  toggleModal(value) {
    const { isTextAdderShow } = this.state;

    if (value === 'adder') this.setState({ isTextAdderShow: !isTextAdderShow });
  }

  renderAdder() {
    const { isTextAdderShow, textInput } = this.state;
    const { addPlaylist } = this.props;

    if (!isTextAdderShow) {
      return (
        <div className="playlist__list__item" onClick={() => this.toggleModal('adder')}>
          <span>Add playlist...</span>
        </div>
      );
    }

    return (
      <div className="playlist-adder">
        <input
          type="text"
          className="playlist-adder__input"
          value={textInput}
          maxLength={22}
          onChange={ev => this.setState({ textInput: ev.target.value })}
          placeholder="Playlist title..."
        />
        <Touchable
          onClick={() => {
            this.toggleModal('adder');
            this.setState({ textInput: '' });
          }}
          icon="fas fa-ban"
          className="button-adder-playlist-cancel"
        />
        <Touchable
          onClick={() => {
            addPlaylist(textInput);
            this.toggleModal('adder');
            this.setState({ textInput: '' });
          }}
          icon="fas fa-check-circle"
          className="button-adder-playlist-confirm"
        />
      </div>
    );
  }

  renderPlaylist() {
    const { playlist, currentPlaylist, changePlaylist } = this.props;

    return playlist.map((item) => {
      let className;
      if (currentPlaylist.id === item.id) className = 'selector--active';

      return (
        <div className="playlist__list__item" key={item.id} onClick={() => changePlaylist(item.id)}>
          <div className={`selector ${className}`} />
          <span>{item.title}</span>
        </div>
      );
    });
  }

  renderModal() {
    const { isConfirmModalShow } = this.state;
    const {
      closeFunction,
    } = this.props;

    if (isConfirmModalShow) {
      return (
        <Modal
          closeFunction={closeFunction}
          className="PlaylistModal__list"
        >
          <div className="playlist__container">
            <h2>Playlist</h2>
            <span>Are you sure ?</span>
          </div>
        </Modal>
      );
    }

    return (
      <Modal
        closeFunction={closeFunction}
        className="PlaylistModal__list"
      >
        <div className="playlist__container">
          <h2>Playlist</h2>
          <div className="playlist__list__container">
            {this.renderPlaylist()}
            {this.renderAdder()}
          </div>
        </div>
      </Modal>
    );
  }

  render() {
    return (
      <div className="PlaylistModal">
        {this.renderModal()}
      </div>
    );
  }
}

PlaylistModal.propTypes = {
  playlist: PropTypes.array.isRequired,
  closeFunction: PropTypes.func.isRequired,
  currentPlaylist: PropTypes.object.isRequired,
  addPlaylist: PropTypes.func.isRequired,
  changePlaylist: PropTypes.func.isRequired,
};

export default PlaylistModal;
