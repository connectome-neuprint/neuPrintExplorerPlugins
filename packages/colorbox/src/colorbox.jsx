import React from 'react';
import PropTypes from 'prop-types';

function ColorBox({ margin, width, height, backgroundColor, title, text, color }) {
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

  let displayText = text;

  // check here if text string is empty and replace it with a '.' and
  // change the text color to match the background color.
  // Do this to prevent weird rendering of the divs where the empty one
  // is positioned above the one with text in it.
  if (text === '') {
    styles.color = backgroundColor;
    displayText = '.';
  }
  return (
    <div style={styles} title={title}>
      {displayText}
    </div>
  );
}

ColorBox.defaultProps = {
  color: '#000'
};

ColorBox.propTypes = {
  margin: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  backgroundColor: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  color: PropTypes.string,
  text: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired
};

export default ColorBox;
