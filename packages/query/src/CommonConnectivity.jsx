/*
 * Queries common inputs/outputs given list of bodyIds
 */
import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import TextField from '@material-ui/core/TextField';

import NeuronFilter from './shared/NeuronFilter';

const styles = theme => ({
  formControl: {
    margin: theme.spacing.unit
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap'
  }
});

const pluginName = 'CommonConnectivity';
const pluginAbbrev = 'cc';

const groupBy = (inputJson, key) =>
  inputJson.reduce((accumulator, currentValue) => {
    // name of the common input/output
    const { name, type } = currentValue;
    // first element of the keys array is X_weight where X is the body id of a queried neuron
    let weights = Object.keys(currentValue)[0];
    // in case order of keys changes check that this is true and if not find the correct key
    if (!weights.endsWith('weight')) {
      for (let i = 1; i < Object.keys(currentValue).length; i += 1) {
        if (Object.keys(currentValue)[i].endsWith('weight')) {
          weights = Object.keys(currentValue)[i];
          break;
        }
      }
    }
    (accumulator[currentValue[key]] = accumulator[currentValue[key]] || {})[weights] =
      currentValue[weights];
    accumulator[currentValue[key]].name = name;
    accumulator[currentValue[key]].type = type;
    return accumulator;
  }, {});

class CommonConnectivity extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: 'Common connectivity',
      abbr: pluginAbbrev,
      description:
        'Finds common inputs/outputs for a group of bodies and weights of their connections to these inputs/outputs.',
      visType: 'SimpleTable'
    };
  }

  static fetchParameters() {
    return {
      queryString: '/npexplorer/commonconnectivity'
    };
  }

  static processDownload(response) {
    const { find_inputs, neuron_ids, neuron_names } = response.params.pm;

    const queryKey = find_inputs ? 'input' : 'output';
    const connectionArray = response.result.data[0][0];

    const columnHeaders = [
      `${queryKey[0].toUpperCase() + queryKey.substring(1)} ID`,
      `${queryKey[0].toUpperCase() + queryKey.substring(1)} Name`,
      `${queryKey[0].toUpperCase() + queryKey.substring(1)} Type`
    ];

    const groupedByInputOrOutputId = groupBy(connectionArray, queryKey);

    let selectedNeurons = [];
    if (neuron_ids.length > 0) {
      selectedNeurons = neuron_ids;
    } else {
      selectedNeurons = neuron_names;
    }

    const selectedWeightHeadings = selectedNeurons.map(neuron => `${neuron}_weight`);
    selectedWeightHeadings.forEach(neuronWeightHeading => {
      columnHeaders.push(neuronWeightHeading);
    });

    const data = [];
    Object.keys(groupedByInputOrOutputId).forEach(inputOrOutput => {
      const singleRow = [parseInt(inputOrOutput, 10), groupedByInputOrOutputId[inputOrOutput].name, groupedByInputOrOutputId[inputOrOutput].type];
      selectedWeightHeadings.forEach(selectedWeightHeading => {
        const selectedWeightValue =
          groupedByInputOrOutputId[inputOrOutput][selectedWeightHeading] || 0;
        singleRow.push(parseInt(selectedWeightValue, 10));
      });
      data.push(singleRow);
    });

    return [columnHeaders, data.join('\n')].join('\n');

  }

  static processResults(query, apiResponse) {
    const { pm: parameters } = query;

    const queryKey = parameters.find_inputs ? 'input' : 'output';
    const connectionArray = apiResponse.data[0][0];

    const columns = [
      `${queryKey[0].toUpperCase() + queryKey.substring(1)} ID`,
      `${queryKey[0].toUpperCase() + queryKey.substring(1)} Name`,
      `${queryKey[0].toUpperCase() + queryKey.substring(1)} Type`
    ];

    const groupedByInputOrOutputId = groupBy(connectionArray, queryKey);

    let selectedNeurons = [];
    if (parameters.neuron_ids.length > 0) {
      selectedNeurons = parameters.neuron_ids;
    } else {
      selectedNeurons = parameters.neuron_names;
    }

    const selectedWeightHeadings = selectedNeurons.map(neuron => `${neuron}_weight`);
    selectedWeightHeadings.forEach(neuronWeightHeading => {
      columns.push(neuronWeightHeading);
    });

    const data = [];
    Object.keys(groupedByInputOrOutputId).forEach(inputOrOutput => {
      const singleRow = [parseInt(inputOrOutput, 10), groupedByInputOrOutputId[inputOrOutput].name, groupedByInputOrOutputId[inputOrOutput].type];
      selectedWeightHeadings.forEach(selectedWeightHeading => {
        const selectedWeightValue =
          groupedByInputOrOutputId[inputOrOutput][selectedWeightHeading] || 0;
        singleRow.push(parseInt(selectedWeightValue, 10));
      });
      data.push(singleRow);
    });

    return {
      columns,
      data,
      debug: apiResponse.debug,
      title: `Common ${queryKey}s for ${selectedNeurons} in ${parameters.dataset}`
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      limitNeurons: true,
      statusFilters: [],
      preThreshold: 0,
      postThreshold: 0,
      bodyIds: '',
      typeValue: 'input'
    };
  }

  processRequest = () => {
    const { dataSet, submit, actions } = this.props;
    const { limitNeurons, preThreshold, postThreshold, statusFilters } = this.state;
    const { bodyIds, typeValue } = this.state;

    const parameters = {
      dataset: dataSet,
      statuses: statusFilters,
      find_inputs: typeValue !== 'output',
      neuron_ids: bodyIds === '' ? [] : bodyIds.split(',').map(Number),
      all_segments: !limitNeurons
    };

    if (parameters.neuron_ids.length > 100) {
      actions.metaInfoError(`You entered ${parameters.neuron_ids.length} Neuron IDs. Please limit the list to 100 or less`);
      return
    }

    if (preThreshold > 0) {
      parameters.pre_threshold = preThreshold;
    }

    if (postThreshold > 0) {
      parameters.post_threshold = postThreshold;
    }

    const query = {
      dataSet,
      plugin: pluginName,
      pluginCode: pluginAbbrev,
      parameters
    };

    submit(query);
  };

  loadNeuronFilters = params => {
    this.setState({
      limitNeurons: params.limitNeurons,
      statusFilters: params.statusFilters,
      preThreshold: parseInt(params.preThreshold, 10),
      postThreshold: parseInt(params.postThreshold, 10)
    });
  };

  addNeuronBodyIds = event => {
    this.setState({
      bodyIds: event.target.value
    });
  };

  setInputOrOutput = event => {
    this.setState({ typeValue: event.target.value });
  };

  catchReturn = event => {
    // submit request if user presses enter
    if (event.keyCode === 13) {
      event.preventDefault();
      this.processRequest();
    }
  };

  render() {
    const { classes, dataSet, actions, neoServerSettings } = this.props;
    const { bodyIds, typeValue } = this.state;

    return (
      <div>
        <FormControl fullWidth className={classes.formControl}>
          <TextField
            label="Neuron IDs"
            multiline
            fullWidth
            rows={1}
            value={bodyIds}
            name="bodyIds"
            rowsMax={4}
            helperText="Separate IDs with commas. Max 100"
            onChange={this.addNeuronBodyIds}
            onKeyDown={this.catchReturn}
          />
        </FormControl>
        <RadioGroup
          aria-label="Type Of Connections"
          name="type"
          value={typeValue}
          onChange={this.setInputOrOutput}
        >
          <FormControlLabel value="input" control={<Radio color="primary" />} label="Inputs" />
          <FormControlLabel value="output" control={<Radio color="primary" />} label="Outputs" />
        </RadioGroup>
        <NeuronFilter
          callback={this.loadNeuronFilters}
          datasetstr={dataSet}
          actions={actions}
          neoServer={neoServerSettings.get('neoServer')}
        />
        <Button variant="contained" color="primary" onClick={this.processRequest}>
          Submit
        </Button>
      </div>
    );
  }
}

CommonConnectivity.propTypes = {
  dataSet: PropTypes.string.isRequired,
  actions: PropTypes.object.isRequired,
  submit: PropTypes.func.isRequired,
  neoServerSettings: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

export default withStyles(styles, { withTheme: true })(CommonConnectivity);
