import React from 'react';
import PropTypes from 'prop-types';

import './styles/Modal.css';

class Modal extends React.Component {
  render() {
    const {
      children,
      className,
      closeFunction,
      wrapperClassName,
    } = this.props;

    return (
      <div className={`Modal ${wrapperClassName}`}>
        <div className="Modal__transparent-box" />
        <div className={`Modal__modal-box ${className}`}>
          <i
            className="fas fa-times-circle Modal__close-modal-button"
            onClick={closeFunction}
          />
          {children}
        </div>
      </div>
    );
  }
}

Modal.propTypes = {
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  children: PropTypes.object.isRequired,
  closeFunction: PropTypes.func.isRequired,
};

Modal.defaultProps = {
  className: '',
  wrapperClassName: '',
};

export default Modal;
