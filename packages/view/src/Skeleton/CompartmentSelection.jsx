import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  select: {
    width: '10em'
  }
});

class CompartmentSelection extends React.Component {
  handleROIChange = chosen => {
    const { actions, selectedROIs } = this.props;
    const chosenList = chosen.map(item => item.value);
    // loop over the already selected and remove those that
    // aren't in the chosen list.
    selectedROIs.keySeq().forEach(roi => {
      if (!chosenList.includes(roi)) {
        actions.removeROI(roi);
      }
    });
    // loop over the chosen ROIs
    // if not in the list of already selected then fire off
    // an action to load it.
    chosenList.forEach(choice => {
      if (!selectedROIs.has(choice)) {
        actions.addROI(choice);
      }
    });
  };

  render() {
    const { classes, availableROIs, selectedROIs } = this.props;

    if (!availableROIs.hemibrain) {
      return '';
    }

    const queryOptions = availableROIs.hemibrain.map(roi => ({
      value: roi,
      label: roi
    }));

    const selectedValue = selectedROIs.keySeq().map(key => ({
      label: key,
      value: key
    }));

    return (
      <Select
        isMulti
        className={classes.select}
        value={selectedValue.toJS()}
        onChange={this.handleROIChange}
        options={queryOptions}
        closeMenuOnSelect={false}
      />
    );
  }
}

CompartmentSelection.propTypes = {
  actions: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  availableROIs: PropTypes.object.isRequired,
  selectedROIs: PropTypes.object.isRequired
};

export default withStyles(styles, { withTheme: true })(CompartmentSelection);
