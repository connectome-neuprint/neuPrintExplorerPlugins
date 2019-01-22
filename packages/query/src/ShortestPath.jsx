/*
 * Query to find shortest path between two neurons.
 */
import React from 'react';
import PropTypes from 'prop-types';
import randomColor from 'randomcolor';
import { withRouter } from 'react-router';

import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';

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
  button: {
    margin: 4,
    display: 'block'
  },
  clickable: {
    cursor: 'pointer'
  }
});

const pluginName = 'ShortestPath';
const pluginAbbrev = 'sp';

class ShortestPath extends React.Component {

  static get queryName() {
    return 'Shortest path';
  }

  static get queryCategory() {
    return 'recon';
  }

  static get queryDescription() {
    return 'Find all neurons along the shortest path between two neurons.';
  }

  static get isExperimental() {
    return true;
  }

  processResults = (query, apiResponse) => {
    const data = apiResponse.data.map(row => [row[0], row[1], row[2], row[3], row[4]]);

    return {
      columns: ['bodyId', 'name', 'status', '#pre', '#post'],
      data,
      debug: apiResponse.debug
    };
  };

  // creates query object and sends to callback
  processRequest = () => {
    const { dataSet, actions, history } = this.props;
    const { bodyId1 = '', bodyId2 = '', minWeight = 0 } = actions.getQueryObject(pluginAbbrev);

    const shortestPathQuery = `MATCH path=shortestPath((a:\`${dataSet}-Neuron\`{bodyId:${bodyId1}})-[r:ConnectsTo*]-(b:\`${dataSet}-Neuron\`{bodyId:${bodyId2}})) WHERE all(rs in r WHERE rs.weight>=${minWeight}) WITH nodes(path) AS ns UNWIND ns AS n RETURN n.bodyId, n.name, n.status, n.pre, n.post`;
    const query = {
      dataSet,
      cypherQuery: shortestPathQuery,
      visType: 'SimpleTable',
      plugin: pluginName,
      parameters: { dataset: dataSet },
      title: `Neurons along path between ${bodyId1} and ${bodyId2}`,
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

  addBodyId1 = event => {
    const { actions } = this.props;
    actions.setQueryString({
      [pluginAbbrev]: {
        bodyId1: event.target.value
      }
    });
  };

  addBodyId2 = event => {
    const { actions } = this.props;
    actions.setQueryString({
      [pluginAbbrev]: {
        bodyId2: event.target.value
      }
    });
  };

  addMinWeight = event => {
    const { actions } = this.props;
    actions.setQuryString({
      [pluginAbbrev]: {
        minWeight: event.target.value
      }
    });
  };

  render() {
    const { isQuerying, actions, classes } = this.props;
    const { bodyId1 = '', bodyId2 = '', minWeight = 0 } = actions.getQueryObject(pluginAbbrev);

    return (
      <div>
        <FormControl fullWidth className={classes.formControl}>
          <TextField
            label="Body ID A"
            multiline
            fullWidth
            rows={1}
            value={bodyId1}
            rowsMax={1}
            className={classes.textField}
            onChange={this.addBodyId1}
          />
          <TextField
            label="Body ID B"
            multiline
            fullWidth
            rows={1}
            value={bodyId2}
            rowsMax={1}
            className={classes.textField}
            onChange={this.addBodyId2}
          />
          <TextField
            label="Minimum weight"
            multiline
            fullWidth
            type="number"
            rows={1}
            value={minWeight}
            rowsMax={1}
            className={classes.textField}
            onChange={this.addMinWeight}
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

ShortestPath.propTypes = {
  dataSet: PropTypes.string.isRequired,
  isQuerying: PropTypes.bool.isRequired,
  actions: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

export default withRouter(withStyles(styles, { withTheme: true })(ShortestPath));
