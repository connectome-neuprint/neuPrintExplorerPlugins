import React from 'react';
import PropTypes from 'prop-types';

function ColorBox({ margin, width, height, backgroundColor, title, text, color='#000' }) {
  const styles = {
    margin: `${margin}px`,
    width: `${width}px`,
    minWidth: `${width}px`,
    height: `${height}px`,
    minHeight: `${height}px`,
    backgroundColor,
    color,
    overflow: 'visible',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column'
  };
  return (
    <div style={styles} title={title}>
      {text}
    </div>
  );
}

ColorBox.propTypes = {
  margin: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  backgroundColor: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  text: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired
};

export default ColorBox;
