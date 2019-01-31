/*
 * Query to find shortest path between two neurons.
 */

// TODO: add graph viz and change to all shortest paths
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
    return 'Shortest paths';
  }

  static get queryDescription() {
    return 'Find all neurons along the shortest paths between two neurons.';
  }

  static get queryAbbreviation() {
    return pluginAbbrev;
  }

  static get isExperimental() {
    return true;
  }

  processResults = (query, apiResponse) => {
    const { actions } = this.props;

    if (apiResponse.data.length === 0) {
      actions.pluginResponseError('No path found.');
      return {
        columns: [],
        data: [],
        debug: apiResponse.debug
      };
    }

    let maxObsWeight;
    let minObsWeight;

    const nodes = [];
    const edges = [];

    const startId = apiResponse.data[0][1][0][0];
    const startName = apiResponse.data[0][1][0][1];
    const startNode = {
      data: { id: startId, label: startName !== null ? `${startName}\n(${startId})` : startId }
    };

    const endId = apiResponse.data[0][1][apiResponse.data[0][1].length - 1][0];
    const endName = apiResponse.data[0][1][apiResponse.data[0][1].length - 1][1];
    const endNode = {
      data: { id: endId, label: endName !== null ? `${endName}\n(${endId})` : endId }
    };

    nodes.push(startNode, endNode);

    apiResponse.data.forEach(path => {
      const pathIdList = path[1].filter((id, index) => index > 0 && index < path[1].length - 1);
      const weightList = path[2];

      pathIdList.forEach(node => {
        nodes.push({
          data: {
            id: node[0],
            label: node[1] !== null ? `${node[1]}\n(${node[0]})` : node[0]
          }
        });
      });

      weightList.forEach((weight, index) => {
        edges.push({
          data: {
            source: path[1][index][0],
            target: path[1][index + 1][0],
            label: weight,
            classes: 'autorotate'
          }
        });
        if (maxObsWeight === undefined || maxObsWeight < weight) {
          maxObsWeight = weight;
        }
        if (minObsWeight === undefined || minObsWeight > weight) {
          minObsWeight = weight;
        }
      });
    });

    return {
      columns: ['length(path)', 'ids', 'weights'],
      data: apiResponse.data,
      graph: { elements: { nodes, edges }, minWeight: minObsWeight, maxWeight: maxObsWeight },
      debug: apiResponse.debug
    };
  };

  // creates query object and sends to callback
  processRequest = () => {
    const { dataSet, actions, history } = this.props;
    const { bodyId1 = '', bodyId2 = '', minWeight = 0 } = actions.getQueryObject(pluginAbbrev);

    const shortestPathQuery = `MATCH path=allShortestPaths((a:\`${dataSet}-Neuron\`{bodyId:${bodyId1}})-[r:ConnectsTo*]->(b:\`${dataSet}-Neuron\`{bodyId:${bodyId2}})) WHERE all(rs in r WHERE rs.weight>=${minWeight}) WITH extract(n IN nodes(path) | [n.bodyId,n.name]) AS ids,extract(rst IN rels(path) | rst.weight) AS weights, path RETURN length(path), ids, weights`;
    const query = {
      dataSet,
      cypherQuery: shortestPathQuery,
      visType: 'Graph',
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
    actions.setQueryString({
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
