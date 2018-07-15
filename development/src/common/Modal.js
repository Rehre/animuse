import React from 'react';
import PropTypes from 'prop-types';

import './styles/Modal.css';

class Modal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: true,
    };
  }

  render() {
    const { children, className } = this.props;
    const { show } = this.state;

    if (!show) return null;

    return (
      <div className="Modal">
        <div className="Modal__transparent-box" />
        <div className={`Modal__modal-box ${className}`}>
          <i
            className="fas fa-times-circle Modal__close-modal-button"
            onClick={() => this.setState({ show: false })}
          />
          {children}
        </div>
      </div>
    );
  }
}

Modal.propTypes = {
  className: PropTypes.string,
  children: PropTypes.object.isRequired,
};

Modal.defaultProps = {
  className: '',
};

export default Modal;
