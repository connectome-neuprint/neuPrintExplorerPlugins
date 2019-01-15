/*
 * Queries common inputs/outputs given list of bodyIds
 */
import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import randomColor from 'randomcolor';

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

class CommonConnectivity extends React.Component {
  static get queryName() {
    return 'Common connectivity';
  }

  static get queryDescription() {
    return 'Finds common inputs/outputs for a group of bodies and weights of their connections to these inputs/outputs.';
  }

  static get isExperimental() {
    return true;
  }

  constructor(props) {
    super(props);
    this.state = {
      limitNeurons: true,
      statusFilters: [],
      preThreshold: 0,
      postThreshold: 0
    };
  }

  processResults = (query, apiResponse) => {
    const { parameters } = query;

    const queryKey = parameters.find_inputs ? 'input' : 'output';
    const connectionArray = apiResponse.data[0][0];

    const columns = [
      `${queryKey[0].toUpperCase() + queryKey.substring(1)} BodyId`,
      `${queryKey[0].toUpperCase() + queryKey.substring(1)} Name`
    ];

    const groupBy = (inputJson, key) =>
      inputJson.reduce((accumulator, currentValue) => {
        // name of the common input/output
        const { name } = currentValue;
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
        return accumulator;
      }, {});

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
      const singleRow = [parseInt(inputOrOutput, 10), groupedByInputOrOutputId[inputOrOutput].name];
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
      debug: apiResponse.debug
    };
  };

  processRequest = () => {
    const { dataSet, actions, history } = this.props;
    const { limitNeurons, preThreshold, postThreshold, statusFilters } = this.state;
    const queryParams = actions.getQueryObject()[pluginAbbrev];
    const { bodyIds = '', typeValue = 'input' } = queryParams || {};

    const parameters = {
      dataset: dataSet,
      statuses: statusFilters,
      find_inputs: typeValue !== 'output',
      neuron_ids: bodyIds === '' ? [] : bodyIds.split(',').map(Number),
      all_segments: !limitNeurons
    };

    if (preThreshold > 0) {
      parameters.pre_threshold = preThreshold;
    }

    if (postThreshold > 0) {
      parameters.post_threshold = postThreshold;
    }

    const selectedNeurons = parameters.neuron_ids;

    const query = {
      dataSet,
      queryString: '/npexplorer/commonconnectivity',
      visType: 'SimpleTable',
      plugin: pluginName,
      parameters,
      title: `Common ${typeValue}s for ${selectedNeurons} in ${dataSet}`,
      menuColor: randomColor({ luminosity: 'light', hue: 'random' }),
      processResults: this.processResults
    };

    actions.submit(query);
    // redirect to the results page.
    history.push({
      pathname: '/results',
      search: actions.getQueryString()
    });
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
    const { actions } = this.props;
    actions.setQueryString({
      [pluginAbbrev]: {
        bodyIds: event.target.value
      }
    });
  };

  setInputOrOutput = event => {
    const { actions } = this.props;
    actions.setQueryString({
      [pluginAbbrev]: {
        typeValue: event.target.value
      }
    });
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
    const { bodyIds = '', typeValue = 'input' } = actions.getQueryObject()[pluginAbbrev] || {};
    return (
      <div>
        <FormControl fullWidth className={classes.formControl}>
          <TextField
            label="Neuron bodyIds"
            multiline
            fullWidth
            rows={1}
            value={bodyIds}
            name="bodyIds"
            rowsMax={4}
            helperText="Separate ids with commas."
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
  neoServerSettings: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

export default withRouter(withStyles(styles, { withTheme: true })(CommonConnectivity));
