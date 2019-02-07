import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';

import randomColor from 'randomcolor';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import { withStyles } from '@material-ui/core/styles';
import { round } from 'mathjs';
import Select from 'react-select';
import { setColumnIndices } from './shared/pluginhelpers';

const pluginName = 'SynapsesForConnection';

const styles = theme => ({
  textField: {
    width: 300,
    margin: '0 0 1em 0'
  },
  button: {
    margin: 4,
    display: 'block'
  },
  formControl: {},
  select: {
    fontFamily: theme.typography.fontFamily,
    margin: '0.5em 0 1em 0'
  }
});

const pluginAbbrev = 'sfc';

export class SynapsesForConnection extends React.Component {
  static get queryName() {
    return 'Synapses for connection';
  }

  static get queryDescription() {
    return 'Retrieves synapses involved in a connection.';
  }

  static get isExperimental() {
    return true;
  }

  static get queryAbbreviation() {
    return pluginAbbrev;
  }

  processRequest = () => {
    const { dataSet, actions, history } = this.props;
    const { bodyId1 = '', bodyId2 = '', rois = [] } = actions.getQueryObject(pluginAbbrev);

    let roiPredicate = '';
    if (rois.length > 0) {
      roiPredicate = ' WHERE (';
      rois.forEach(roi => {
        roiPredicate += `exists(s.\`${roi}\`) AND `;
      });
      roiPredicate = roiPredicate.slice(0, -5);
      roiPredicate += ')';
    }

    const cypherQuery = `MATCH (a:\`${dataSet}-Neuron\`{bodyId:${bodyId1}})<-[:From]-(c:ConnectionSet)-[:To]->(b{bodyId:${bodyId2}}), (c)-[:Contains]->(s:Synapse)${roiPredicate} RETURN s.type, s.location.x ,s.location.y ,s.location.z, s.confidence, keys(s)`;

    const query = {
      dataSet,
      cypherQuery,
      visType: 'SimpleTable',
      plugin: pluginName,
      parameters: { bodyId1, bodyId2, rois },
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
    const { parameters = {} } = query;
    const { bodyId1 = '', bodyId2 = '', rois = [] } = parameters;
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

    actions.pluginResponseError(
      `No synapses between ${bodyId1} and ${bodyId2} in specified rois (${rois})`
    );
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

  handleChangeRois = selected => {
    const { actions } = this.props;
    const rois = selected.map(item => item.value);
    actions.setQueryString({
      [pluginAbbrev]: {
        rois
      }
    });
  };

  render() {
    const { actions, classes, isQuerying, availableROIs } = this.props;
    const { bodyId1 = '', bodyId2 = '', rois = [] } = actions.getQueryObject(pluginAbbrev);

    const roiOptions = availableROIs.map(name => ({
      label: name,
      value: name
    }));

    const roiValues = rois.map(roi => ({
      label: roi,
      value: roi
    }));

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
        <Select
          className={classes.select}
          isMulti
          value={roiValues}
          onChange={this.handleChangeRois}
          options={roiOptions}
          closeMenuOnSelect={false}
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

SynapsesForConnection.propTypes = {
  classes: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  dataSet: PropTypes.string.isRequired,
  history: PropTypes.object.isRequired,
  isQuerying: PropTypes.bool.isRequired,
  availableROIs: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default withStyles(styles)(withRouter(SynapsesForConnection));
