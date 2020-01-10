import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  select: {
    fontFamily: theme.typography.fontFamily,
    margin: '0.5em 0 1em 0'
  }
});

const formatOptionLabel = ({ label, additionalInfo }) => (
  <div style={{ display: 'flex' }}>
    <div>{label}</div>
    <div style={{ marginLeft: '10px', fontSize: '0.8em' }}>{additionalInfo}</div>
  </div>
);

formatOptionLabel.propTypes = {
  label: PropTypes.string.isRequired,
  additionalInfo: PropTypes.string.isRequired
};

function BrainRegionInput(props) {
  const { rois, roiInfo, onChange, value, classes } = props;

  // transform rois into inputOptions.
  const inputOptions = rois.map(name => {
    let additionalInfo = '';
    if (roiInfo[name]) {
      additionalInfo = roiInfo[name].description;
    }

    return {
      label: name,
      value: name,
      additionalInfo
    };
  });

  return (
    <Select
      className={classes.select}
      isMulti
      value={value}
      onChange={onChange}
      formatOptionLabel={formatOptionLabel}
      options={inputOptions}
      closeMenuOnSelect={false}
    />
  );
}

BrainRegionInput.propTypes = {
  rois: PropTypes.arrayOf(PropTypes.string).isRequired,
  roiInfo: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  value: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func.isRequired
};

export default withStyles(styles)(BrainRegionInput);
