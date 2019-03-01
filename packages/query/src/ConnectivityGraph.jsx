import React from 'react';
import PropTypes from 'prop-types';
import randomColor from 'randomcolor';
import { withRouter } from 'react-router';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';

const pluginName = 'ConnectivityGraph';
const pluginAbbrev = 'cg';

// TODO: add colors based on similar name?

const styles = theme => ({
  formControl: {
    marginBottom: theme.spacing.unit,
    marginTop: theme.spacing.unit,
    maxWidth: 400,
    display: 'block'
  },
  button: {
    display: 'block'
  },
  clickable: {
    cursor: 'pointer'
  }
});

class ConnectivityGraph extends React.Component {
  static get queryName() {
    return 'Connectivity graph';
  }

  static get queryDescription() {
    return 'View a graph displaying connectivity between neurons.';
  }

  static get queryAbbreviation() {
    return pluginAbbrev;
  }

  static get isExperimental() {
    return true;
  }

  processResults = (query, apiResponse) => {
    const { actions } = this.props;
    const { includeAutapses = true, minWeight = 1 } = actions.getQueryObject(pluginAbbrev);

    let maxObsWeight;
    let minObsWeight;

    const edges = [];
    const bodyIdToName = {};

    apiResponse.data.forEach(row => {
      const start = row[0];
      const end = row[1];
      const weight = row[2];
      const startName = row[3];
      const endName = row[4];

      if (maxObsWeight === undefined || maxObsWeight < weight) {
        maxObsWeight = weight;
      }
      if (minObsWeight === undefined || minObsWeight > weight) {
        minObsWeight = weight;
      }
      if ((includeAutapses || start !== end) && weight > minWeight) {
        edges.push({
          data: { source: start, target: end, label: weight, classes: 'autorotate' }
        });
      }

      if (!bodyIdToName[start]) {
        bodyIdToName[start] = startName;
      }
      if (!bodyIdToName[end]) {
        bodyIdToName[end] = endName;
      }
    });

    const nodes = query.parameters.bodyIds.map(bodyId => {
      const label =
        bodyIdToName[bodyId] && bodyIdToName[bodyId] !== null
          ? `${bodyIdToName[bodyId]}\n(${bodyId})`
          : bodyId;
      return { data: { id: bodyId, label } };
    });

    return {
      columns: ['start', 'end', 'weight', 'startName', 'endName'],
      data: apiResponse.data,
      graph: { elements: { nodes, edges }, minWeight: minObsWeight, maxWeight: maxObsWeight },
      debug: apiResponse.debug
    };
  };

  // creates query object and sends to callback
  processRequest = () => {
    const { dataSet, actions, history } = this.props;
    const { bodyIds } = actions.getQueryObject(pluginAbbrev);

    const cypherQuery = `WITH [${bodyIds}] AS input MATCH (n:\`${dataSet}-Neuron\`)-[c:ConnectsTo]->(m) WHERE n.bodyId IN input AND m.bodyId IN input RETURN n.bodyId AS start, m.bodyId AS end, c.weight AS weight, n.name AS startName, m.name AS endName`;

    const query = {
      dataSet,
      cypherQuery,
      visType: 'Graph',
      plugin: pluginName,
      parameters: {
        dataset: dataSet,
        bodyIds: bodyIds === '' ? [] : bodyIds.split(',').map(Number)
      },
      title: `Connectivity graph for ${bodyIds}`,
      menuColor: randomColor({ luminosity: 'light', hue: 'random' }),
      processResults: this.processResults
    };
    actions.submit(query);
    history.push({
      pathname: '/results',
      search: actions.getQueryString()
    });
    return query;
  };

  addNeuronBodyIds = event => {
    const { actions } = this.props;
    actions.setQueryString({
      [pluginAbbrev]: {
        bodyIds: event.target.value
      }
    });
  };

  handleMinWeightChange = event => {
    const { actions } = this.props;
    actions.setQueryString({
      [pluginAbbrev]: {
        minWeight: event.target.value
      }
    });
  };

  toggleAutapses = () => {
    const { actions } = this.props;
    const { includeAutapses } = actions.getQueryObject(pluginAbbrev);
    actions.setQueryString({
      [pluginAbbrev]: {
        includeAutapses: !includeAutapses
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
    const { isQuerying, classes, actions } = this.props;
    const { bodyIds = '', includeAutapses = true, minWeight = 1 } = actions.getQueryObject(
      pluginAbbrev
    );

    return (
      <div>
        <FormControl fullWidth className={classes.formControl}>
          <TextField
            label="Neuron IDs"
            multiline
            fullWidth
            margin="dense"
            rows={1}
            value={bodyIds}
            name="bodyIds"
            rowsMax={4}
            helperText="Separate IDs with commas."
            onChange={this.addNeuronBodyIds}
            onKeyDown={this.catchReturn}
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <TextField
            label="minimum weight"
            type="number"
            margin="dense"
            rows={1}
            value={minWeight}
            rowsMax={1}
            onChange={this.handleMinWeightChange}
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <FormControlLabel
            control={
              <Switch checked={includeAutapses} onChange={this.toggleAutapses} color="primary" />
            }
            label="Include autapses"
          />
        </FormControl>
        <Button
          disabled={isQuerying}
          color="primary"
          variant="contained"
          onClick={this.processRequest}
        >
          Submit
        </Button>
      </div>
    );
  }
}

ConnectivityGraph.propTypes = {
  dataSet: PropTypes.string.isRequired,
  isQuerying: PropTypes.bool.isRequired,
  actions: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

export default withRouter(withStyles(styles, { withTheme: true })(ConnectivityGraph));
