import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';

import randomColor from 'randomcolor';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import { withStyles } from '@material-ui/core/styles';
import { round } from 'mathjs';
import { setColumnIndices } from './shared/pluginhelpers';

const pluginName = 'SynapsesForConnection';

const styles = () => ({
  textField: {
    width: 300,
    margin: '0 0 1em 0'
  },
  button: {
    margin: 4,
    display: 'block'
  },
  formControl: {}
});

const pluginAbbrev = 'sfc';

export class SynapsesForConnection extends React.Component {
  static get queryName() {
    return 'Synapses for connection';
  }

  static get queryDescription() {
    return 'Retrieves synapses involved in a connection.';
  }

  static get queryAbbreviation() {
    return pluginAbbrev;
  }

  processRequest = () => {
    const { dataSet, actions, history } = this.props;
    const { bodyId1 = '', bodyId2 = '' } = actions.getQueryObject(pluginAbbrev);
    const query = {
      dataSet,
      cypherQuery: `MATCH (a:\`${dataSet}-Neuron\`{bodyId:${bodyId1}})<-[:From]-(c:ConnectionSet)-[:To]->(b{bodyId:${bodyId2}}), (c)-[:Contains]->(s:Synapse) RETURN s.type, s.location.x ,s.location.y ,s.location.z, s.confidence, keys(s)`,
      visType: 'SimpleTable',
      plugin: pluginName,
      parameters: {},
      title: `Synapses involved in connection between ${bodyId1} and ${bodyId2}`,
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

  processResults = (query, apiResponse) => {
    const { actions } = this.props;
    const indexOf = setColumnIndices(['type', 'location', 'confidence', 'rois']);

    if (apiResponse.data.length > 0) {
      const data = apiResponse.data.map(row => {
        const type = row[0];
        const x = row[1];
        const y = row[2];
        const z = row[3];
        const confidence = row[4];
        const properties = row[5];

        const converted = [];
        converted[indexOf.type] = type;
        converted[indexOf.location] = `[${x},${y},${z}]`;
        converted[indexOf.confidence] = round(confidence, 4);
        converted[indexOf.rois] = properties.filter(
          value =>
            value !== 'type' &&
            value !== 'location' &&
            value !== 'confidence' &&
            value !== 'timeStamp'
        );

        return converted;
      });

      const columns = [];
      columns[indexOf.type] = 'type';
      columns[indexOf.location] = 'location';
      columns[indexOf.confidence] = 'confidence';
      columns[indexOf.rois] = 'rois';

      return {
        columns,
        data,
        debug: apiResponse.debug
      };
    }

    actions.pluginResponseError('No connection found');
    return {
      columns: [],
      data: [],
      debug: apiResponse.debug
    };
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

  // render() is the main function that handles displaying the form. This requires
  // a few properties passed in from neuPrintExplorer, but will take no direct
  // arguments.
  render() {
    const { actions, classes, isQuerying } = this.props;
    const { bodyId1 = '', bodyId2 = '' } = actions.getQueryObject(pluginAbbrev);

    return (
      <FormControl className={classes.formControl}>
        <TextField
          label="Neuron ID A"
          multiline
          fullWidth
          rows={1}
          value={bodyId1}
          rowsMax={1}
          className={classes.textField}
          onChange={this.addBodyId1}
        />
        <TextField
          label="Neuron ID B"
          multiline
          fullWidth
          rows={1}
          value={bodyId2}
          rowsMax={1}
          className={classes.textField}
          onChange={this.addBodyId2}
        />
        <Button
          variant="contained"
          className={classes.button}
          onClick={this.processRequest}
          color="primary"
          disabled={isQuerying}
        >
          Submit
        </Button>
      </FormControl>
    );
  }
}

// property Types or propTypes describe the items that will be passed
// to the plugin and you will be required to add them. It is probably
// sufficient to copy this data structure into your plugin and change
// 'Example' to your plugin name.
SynapsesForConnection.propTypes = {
  classes: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  dataSet: PropTypes.string.isRequired,
  history: PropTypes.object.isRequired,
  isQuerying: PropTypes.bool.isRequired
};

// Finally we need to export the plugin into the main application so that
// it is registered with the site. This will add it to the Query selection
// menu and allow users to select it.
export default withStyles(styles)(withRouter(SynapsesForConnection));
