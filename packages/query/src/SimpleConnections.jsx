/*
 * Supports simple, custom neo4j query.
 */
import React from 'react';
import PropTypes from 'prop-types';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { withStyles } from '@material-ui/core/styles';

import NeuronHelp from './shared/NeuronHelp';
import { createSimpleConnectionsResult } from './shared/pluginhelpers';

const styles = () => ({
  textField: {},
  formControl: {
    margin: '0.5em 0 1em 0',
    width: '100%'
  },
  badge: {
    right: '-10px',
    width: '100px',
    height: '50px',
    top: '-10px'
  }
});

const pluginName = 'SimpleConnection';
const pluginAbbrev = 'sc';

export class SimpleConnections extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: 'Simple Connections',
      abbr: pluginAbbrev,
      description: 'List inputs or outputs to selected neuron(s)',
      visType: 'SimpleConnectionsView'
    };
  }

  static fetchParameters() {
    return {
      queryString: '/npexplorer/simpleconnections'
    };
  }

  static processDownload(response) {
    const headers = [
      'id',
      'neuron',
      'status',
      '#connections',
      '#post(inputs)',
      '#pre(outputs)',
      '#voxels'
    ];

    const roiList = response.result.data[0][11];
    roiList.sort().forEach(roi => {
      headers.push(`${roi} post`);
      headers.push(`${roi} pre`);
    });

    const data = response.result.data
      .map(row => {
        const [
          queryBodyName,
          targetBodyName,
          targetBodyId,
          connections,
          queryBodyId,
          ,
          traceStatus,
          roiCounts,
          voxels,
          outputs,
          inputs,
          rois,
          highConfConnections
        ] = row;
        const roiInfoObject = JSON.parse(roiCounts);

        const converted = [
          targetBodyId,
          targetBodyName,
          traceStatus,
          connections,
          inputs,
          outputs,
          voxels
        ];
        // figure out roi counts.
        if (rois.length > 0) {
          rois.sort().forEach(roi => {
            if (roiInfoObject[roi]) {
              converted.push(roiInfoObject[roi].post);
              converted.push(roiInfoObject[roi].pre);
            }
          });
        }

        return converted;
      })
      .join('\n');
    return [headers, data].join('\n');
  }

  static processResults(query, apiResponse, actions, submit, isPublic) {
    // settings for whether or not the application is in public mode
    let includeWeightHP;
    if (isPublic) {
      includeWeightHP = false;
    } else {
      includeWeightHP = true;
    }
    const tables = [];
    const inputs = query.pm.find_inputs;

    let currentTable = [];
    let lastBody = -1;
    let lastName = '';

    const { columns, data } = createSimpleConnectionsResult(
      query.ds,
      apiResponse,
      actions,
      submit,
      inputs,
      includeWeightHP
    );

    apiResponse.data.forEach((row, index) => {
      const neuron1Id = row[4];
      if (lastBody !== -1 && neuron1Id !== lastBody) {
        let tableName = `${lastName} id=(${String(lastBody)})`;
        if (inputs === false) {
          tableName = `${tableName} => ...`;
        } else {
          tableName = `... => ${tableName}`;
        }

        tables.push({
          columns,
          data: currentTable,
          name: tableName
        });
        currentTable = [];
      }
      // change code here to use common code
      lastBody = neuron1Id;
      [lastName] = row;

      // let neuron2Name = row[1];
      // if (neuron2Name === null) {
      //   neuron2Name = '';
      // }
      // currentTable.push([row[2], neuron2Name, row[3]]);
      currentTable.push(data[index]);
      //
    });

    if (lastBody !== -1) {
      let tableName = `${lastName} id=(${String(lastBody)})`;
      if (inputs === true) {
        tableName = `${tableName} <= ...`;
      } else {
        tableName = `${tableName} => ...`;
      }

      tables.push({
        columns,
        data: currentTable,
        name: tableName
      });
    }

    // Title choices.
    const neuronSrc = query.pm.neuron_name || query.pm.neuron_id;
    const preOrPost = inputs ? 'pre' : 'post';

    return {
      data: tables,
      debug: apiResponse.debug,
      title: `Neurons ${preOrPost}synaptic to ${neuronSrc}`
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      neuronName: '',
      neuronType: '',
      preOrPost: 'post'
    };
  }

  processRequest = () => {
    const { dataSet, actions, submit } = this.props;
    const { neuronName, preOrPost } = this.state;
    if (neuronName !== '') {
      const parameters = { dataset: dataSet };
      if (/^\d+$/.test(neuronName)) {
        parameters.neuron_id = parseInt(neuronName, 10);
      } else {
        parameters.neuron_name = neuronName;
      }
      if (preOrPost === 'post') {
        parameters.find_inputs = false;
      } else {
        parameters.find_inputs = true;
      }
      const query = {
        dataSet,
        plugin: pluginName,
        pluginCode: pluginAbbrev,
        visProps: { paginateExpansion: true },
        parameters
      };

      submit(query);
      return query;
    }
    actions.formError('Please enter a neuron name.');
    return {};
  };

  handleNeuronName = event => {
    this.setState({ neuronName: event.target.value });
  };

  handleNeuronType = event => {
    this.setState({ neuronType: event.target.value });
  };

  handleDirection = event => {
    this.setState({ preOrPost: event.target.value });
  };

  catchReturn = event => {
    // submit request if user presses enter
    if (event.keyCode === 13) {
      event.preventDefault();
      this.processRequest();
    }
  };

  render() {
    const { classes, isQuerying } = this.props;
    const { preOrPost, neuronName, neuronType } = this.state;
    return (
      <div>
        <FormControl className={classes.formControl}>
          <NeuronHelp>
            <TextField
              label="Neuron name"
              multiline
              fullWidth
              rows={1}
              value={neuronName}
              rowsMax={4}
              className={classes.textField}
              onChange={this.handleNeuronName}
              onKeyDown={this.catchReturn}
            />
            <TextField
              label="Neuron type"
              multiline
              fullWidth
              rows={1}
              value={neuronType}
              rowsMax={4}
              className={classes.textField}
              onChange={this.handleNeuronType}
              onKeyDown={this.catchReturn}
            />
          </NeuronHelp>
        </FormControl>
        <FormControl className={classes.formControl}>
          <FormLabel component="legend">Neuron Direction</FormLabel>
          <RadioGroup
            aria-label="preOrPost"
            name="preOrPost"
            className={classes.group}
            value={preOrPost}
            onChange={this.handleDirection}
          >
            <FormControlLabel
              value="post"
              control={<Radio color="primary" />}
              label="Find postsynaptic partners (outputs)"
            />
            <FormControlLabel
              value="pre"
              control={<Radio color="primary" />}
              label="Find presynaptic partners (inputs)"
            />
          </RadioGroup>
        </FormControl>
        <Button
          variant="contained"
          disabled={isQuerying}
          color="primary"
          onClick={this.processRequest}
        >
          Submit
        </Button>
      </div>
    );
  }
}

SimpleConnections.propTypes = {
  classes: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  submit: PropTypes.func.isRequired,
  isQuerying: PropTypes.bool.isRequired,
  dataSet: PropTypes.string.isRequired
};

export default withStyles(styles)(SimpleConnections);
