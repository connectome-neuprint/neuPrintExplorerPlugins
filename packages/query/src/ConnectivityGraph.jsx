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

const styles = theme => ({
  textField: {
    margin: 4,
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  formControl: {
    margin: theme.spacing.unit
  },
  select: {
    fontFamily: theme.typography.fontFamily,
    margin: '0.5em 0 1em 0'
  },
  button: {
    margin: 4,
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

  static get queryCategory() {
    return 'recon';
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
    const nodes = query.parameters.bodyIds.map(bodyId => ({ data: { id: bodyId } }));
    const { includeAutapses = true } = actions.getQueryObject(pluginAbbrev);

    let maxWeight;
    let minWeight;

    const edges = apiResponse.data
      .filter(row => {
        if (!includeAutapses) {
          return row[2] > 5 && row[1] !== row[0];
        }
        return row[2] > 5;
      })
      .map(row => {
        const start = row[0];
        const end = row[1];
        const weight = row[2];

        if (maxWeight === undefined || maxWeight < weight) {
          maxWeight = weight;
        }
        if (minWeight === undefined || minWeight > weight) {
          minWeight = weight;
        }

        return { data: { source: start, target: end, label: weight, classes: 'autorotate' } };
      });

    return {
      columns: [],
      data: { nodes, edges, minWeight, maxWeight },
      debug: apiResponse.debug
    };
  };

  // creates query object and sends to callback
  processRequest = () => {
    const { dataSet, actions, history } = this.props;
    const { bodyIds } = actions.getQueryObject(pluginAbbrev);

    const cypherQuery = `WITH [${bodyIds}] AS input MATCH (n:\`hemibrain-Neuron\`)-[c:ConnectsTo]->(m) WHERE n.bodyId IN input AND m.bodyId IN input RETURN n.bodyId AS start, m.bodyId AS end, c.weight AS weight, n.name AS startName, m.name AS endName`;

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
    const { bodyIds = '', includeAutapses = true } = actions.getQueryObject(pluginAbbrev);

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
