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
      willBeDeletedPlaylist: '',
    };

    this.toggleModal = this.toggleModal.bind(this);
    this.renderAdder = this.renderAdder.bind(this);
    this.renderModal = this.renderModal.bind(this);
    this.renderPlaylist = this.renderPlaylist.bind(this);
  }

  toggleModal(value, id) {
    const { isTextAdderShow, isConfirmModalShow } = this.state;

    if (value === 'adder') this.setState({ isTextAdderShow: !isTextAdderShow, textInput: '' });
    if (value === 'confirm') {
      this.setState({
        textInput: '',
        isTextAdderShow: false,
        willBeDeletedPlaylist: id,
        isConfirmModalShow: !isConfirmModalShow,
      });
    }
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
          maxLength={20}
          onChange={ev => this.setState({ textInput: ev.target.value })}
          placeholder="Playlist title..."
        />
        <Touchable
          onClick={() => this.toggleModal('adder')}
          icon="fas fa-ban"
          className="button-adder-playlist-cancel"
        />
        <Touchable
          onClick={() => {
            addPlaylist(textInput);
            this.toggleModal('adder');
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
          <div className="playlist__list__item__span">
            <span>{item.title}</span>
          </div>
          <Touchable
            onClick={(event) => {
              event.stopPropagation();
              this.toggleModal('confirm', item.id);
            }}
            icon="fas fa-ban"
            className="button-playlist-delete"
          />
        </div>
      );
    });
  }

  renderModal() {
    const { isConfirmModalShow, willBeDeletedPlaylist } = this.state;
    const {
      closeFunction,
      deletePlaylist,
    } = this.props;

    if (isConfirmModalShow) {
      return (
        <Modal
          closeFunction={closeFunction}
          className="PlaylistModal__list"
        >
          <div className="playlist__container">
            <h2>Playlist</h2>
            <span className="confirm-text">Are you sure ?</span>
            <Touchable
              onClick={() => {
                this.toggleModal('confirm');
              }}
              icon="fas fa-ban"
              className="button-confirm-playlist-cancel"
            />
            <Touchable
              onClick={() => {
                deletePlaylist(willBeDeletedPlaylist);
                this.toggleModal('confirm');
              }}
              icon="fas fa-check-circle"
              className="button-confirm-playlist-confirm"
            />
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
  deletePlaylist: PropTypes.func.isRequired,
};

export default PlaylistModal;
