import React from 'react';
import PropTypes from 'prop-types';
import AsyncSelect from 'react-select/async';
import InputLabel from '@material-ui/core/InputLabel';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  regexWarning: {
    fontSize: '0.9em'
  },
  select: {
    fontFamily: theme.typography.fontFamily,
    margin: '0.5em 0 1em 0'
  }
});

class NeuronInputField extends React.Component {
  handleChange = selected => {
    const { onChange } = this.props;
    if (selected && selected.value) {
      onChange(selected.value);
    } else {
      onChange(selected);
    }
  };

  handleKeyDown = event => {
    const { handleSubmit } = this.props;
    // submit request if user presses enter
    if (event.keyCode === 13) {
      event.preventDefault();
      handleSubmit();
    }
  };

  fetchOptions = inputValue => {
    const { dataSet } = this.props;

    const convertedInput = parseInt(inputValue, 10);

    let bodyId = -1;

    if (!Number.isNaN(convertedInput)) {
      bodyId = convertedInput;
    }

    // query neo4j
    const cypherString = `MATCH (neuron :Neuron)
    WHERE neuron.bodyId = ${bodyId}
    OR toLower(neuron.type) CONTAINS toLower('${inputValue}')
    OR toLower(neuron.instance) CONTAINS toLower('${inputValue}')
    RETURN neuron.bodyId AS bodyid, neuron.type AS type, neuron.instance AS instance
    ORDER BY neuron.instance`;

    const body = JSON.stringify({
      cypher: cypherString,
      dataSet
    });

    const settings = {
      headers: {
        'content-type': 'application/json',
        Accept: 'application/json'
      },
      body,
      method: 'POST',
      credentials: 'include'
    };

    const queryUrl = '/api/custom/custom';

    return fetch(queryUrl, settings)
      .then(result => result.json())
      .then(resp => {
        // sort the results in the data key. Need to split out instances, types
        // and bodyids into separate categories then load them in different
        // sections of the drop down.

        const bodyIds = new Set();
        const types = new Set();
        const instances = new Set();

        resp.data.forEach(item => {
          if (item[0]) {
            bodyIds.add(item[0].toString());
          }
          if (item[1]) {
            types.add(item[1]);
          }
          if (item[2]) {
            instances.add(item[2]);
          }
        });

        const options = [];

        if (types.size) {
          options.push({
            label: 'Types',
            options: [...types].sort().slice(0,9).map(item => ({ value: item, label: item }))
          });
        }
        if (instances.size) {
          options.push({
            label: 'Instances',
            options: [...instances].sort().slice(0,9).map(item => ({ value: item, label: item }))
          });
        }
        if (bodyIds.size) {
          options.push({
            label: 'Body Ids',
            options: [...bodyIds].sort((a,b) => a - b).slice(0,9).map(item => ({ value: item, label: item }))
          });
        }

        return options;
      });
  };

  render() {
    const { value, classes } = this.props;
    const selectValue = value ? { label: value, value } : null;
    return (
      <React.Fragment>
        <InputLabel htmlFor="select-multiple-chip">
          Neuron Instance, Type or BodyId (optional)
        </InputLabel>
        <AsyncSelect
          className={classes.select}
          placeholder="Type or Paste text for options"
          value={selectValue}
          isClearable
          loadOptions={this.fetchOptions}
          onChange={this.handleChange}
        />
      </React.Fragment>
    );
  }
}

NeuronInputField.propTypes = {
  classes: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func,
  dataSet: PropTypes.string.isRequired,
  value: PropTypes.string
};

NeuronInputField.defaultProps = {
  onChange: () => {},
  value: ''
};

export default withStyles(styles)(NeuronInputField);
