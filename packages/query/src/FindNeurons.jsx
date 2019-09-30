/* eslint-disable prefer-destructuring */
import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Typography from '@material-ui/core/Typography';

import { ColorLegend } from './visualization/MiniRoiHeatMap';
import NeuronHelp from './shared/NeuronHelp';
import NeuronInputField from './shared/NeuronInputField';
import NeuronFilter from './shared/NeuronFilter';
import {
  setColumnIndices,
  createSimpleConnectionQueryObject,
  generateRoiHeatMapAndBarGraph,
  getBodyIdForTable
} from './shared/pluginhelpers';

const styles = theme => ({
  select: {
    fontFamily: theme.typography.fontFamily,
    margin: '0.5em 0 1em 0'
  },
  clickable: {
    cursor: 'pointer'
  },
  regexWarning: {
    fontSize: '0.9em'
  }
});

// this should match the name of the file this plugin is stored in.
const pluginName = 'FindNeurons';
const pluginAbbrev = 'fn';

function rejectRowCheck(type, roiInfo, roisToCheck) {
  // if roi is in any of the check locations then return false
  for (let i = 0; i < roisToCheck.length; i += 1) {
    const roi = roisToCheck[i];
    if (roiInfo[roi][type] > 0) {
      return false;
    }
  }
  return true;
}

export class FindNeurons extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: 'Find neurons',
      abbr: pluginAbbrev,
      description: 'Find neurons that have inputs or outputs in ROIs',
      visType: 'SimpleTable'
    };
  }

  static fetchParameters() {
    return {
      queryString: '/npexplorer/findneurons'
    };
  }

  static processDownload(response) {
    const headers = ['id', 'instance', 'type', 'status', '#post(inputs)', '#pre(outputs)'];

    const { input_ROIs: inputROIs = [], output_ROIs: outputROIs = [] } = response.params.pm;
    const rois = inputROIs && outputROIs ? [...new Set(inputROIs.concat(outputROIs))] : [];
    if (rois.length > 0) {
      rois.forEach(roi => {
        headers.push(`${roi} #post`);
        headers.push(`${roi} #pre`);
      });
    }

    headers.push('#voxels');

    const data = response.result.data
      .map(row => {
        const bodyId = row[0];
        const totalPre = row[6];
        const totalPost = row[7];
        const voxelCount = row[5];
        const roiInfoObject = JSON.parse(row[4]);
        const bodyName = row[1] || '';
        const bodyType = row[2] || '';

        const converted = [
          bodyId,
          bodyName.replace(/[\n\r]/g, ''),
          bodyType,
          row[3],
          totalPost,
          totalPre
        ];
        // figure out roi counts.
        if (rois.length > 0) {
          rois.forEach(roi => {
            converted.push(roiInfoObject[roi].post);
            converted.push(roiInfoObject[roi].pre);
          });
        }

        // add voxel count as the last column
        converted.push(voxelCount);

        return converted;
      })
      .join('\n');
    return [headers, data].join('\n');
  }

  static getColumnHeaders(query) {
    const { input_ROIs: inputROIs = [], output_ROIs: outputROIs = [] } = query.pm;
    const rois = inputROIs && outputROIs ? [...new Set(inputROIs.concat(outputROIs))] : [];

    const columnIds = [
      { name: 'id', status: true },
      { name: 'instance', status: false },
      { name: 'type', status: true },
      { name: 'status', status: true },
      { name: '#post (inputs)', status: true },
      { name: '#pre (outputs)', status: true }
    ];

    if (rois.length > 0) {
      rois.forEach(roi => {
        columnIds.push({ name: `${roi} #post`, status: true });
        columnIds.push({ name: `${roi} #pre`, status: true });
      });
    }
    columnIds.push(
      { name: '#voxels', status: false },
      { name: 'roi breakdown', status: true },
      { name: 'roi heatmap', status: false }
    );
    return columnIds;
  }

  // this function will parse the results from the query to the
  // Neo4j server and place them in the correct format for the
  // visualization plugin.
  static processResults(query, apiResponse, actions, submit) {
    const { input_ROIs: inputROIs = [], output_ROIs: outputROIs = [] } = query.pm;
    const rois = inputROIs && outputROIs ? [...new Set(inputROIs.concat(outputROIs))] : [];

    // assigns data properties to column indices for convenient access/modification
    const columnIds = ['bodyId', 'instance', 'type', 'status', 'post', 'pre'];
    if (rois.length > 0) {
      rois.forEach(roi => {
        columnIds.push(`${roi}Post`);
        columnIds.push(`${roi}Pre`);
      });
    }
    columnIds.push('size', 'roiBarGraph', 'roiHeatMap');

    const indexOf = setColumnIndices(columnIds);

    const data = apiResponse.data.map(row => {
      const hasSkeleton = row[8];
      const bodyId = row[0];
      const roiList = row[8];
      const totalPre = row[6];
      const totalPost = row[7];
      const roiInfoObject = JSON.parse(row[4]);

      // filter out the rows that don't have the selected inputs or outputs.
      if (rejectRowCheck('post', roiInfoObject, inputROIs)) {
        return null;
      }
      if (rejectRowCheck('pre', roiInfoObject, outputROIs)) {
        return null;
      }

      const converted = [];
      converted[indexOf.bodyId] = getBodyIdForTable(query.ds, bodyId, hasSkeleton, actions);
      converted[indexOf.instance] = row[1];
      converted[indexOf.type] = row[2];
      converted[indexOf.status] = row[3];
      converted[indexOf.post] = '-'; // empty unless roiInfoObject present
      converted[indexOf.pre] = '-';
      converted[indexOf.size] = row[5];
      converted[indexOf.roiHeatMap] = '';
      converted[indexOf.roiBarGraph] = '';

      // make sure none is added to the rois list.
      roiList.push('none');
      if (roiInfoObject) {
        const { heatMap, barGraph } = generateRoiHeatMapAndBarGraph(
          roiInfoObject,
          roiList,
          totalPre,
          totalPost
        );
        converted[indexOf.roiHeatMap] = heatMap;
        converted[indexOf.roiBarGraph] = barGraph;

        const postQuery = createSimpleConnectionQueryObject(query.ds, true, bodyId, pluginAbbrev);
        converted[indexOf.post] = {
          value: totalPost,
          action: () => submit(postQuery)
        };

        const preQuery = createSimpleConnectionQueryObject(query.ds, false, bodyId, pluginAbbrev);
        converted[indexOf.pre] = {
          value: totalPre,
          action: () => submit(preQuery)
        };

        if (rois.length > 0) {
          rois.forEach(roi => {
            converted[indexOf[`${roi}Post`]] = roiInfoObject[roi].post;
            converted[indexOf[`${roi}Pre`]] = roiInfoObject[roi].pre;
          });
        }
      }

      return converted;
    }).filter(row => row !== null);
    const columns = [];
    columns[indexOf.bodyId] = 'id';
    columns[indexOf.instance] = 'instance';
    columns[indexOf.type] = 'type';
    columns[indexOf.status] = 'status';
    columns[indexOf.post] = '#post (inputs)';
    columns[indexOf.pre] = '#pre (outputs)';
    columns[indexOf.size] = '#voxels';
    columns[indexOf.roiHeatMap] = (
      <div>
        roi heatmap <ColorLegend />
      </div>
    );
    columns[indexOf.roiBarGraph] = 'roi breakdown';
    if (rois.length > 0) {
      rois.forEach(roi => {
        columns[indexOf[`${roi}Post`]] = `${roi} #post`;
        columns[indexOf[`${roi}Pre`]] = `${roi} #pre`;
      });
    }

    return {
      columns,
      data,
      debug: apiResponse.debug,
      title: `Neurons with inputs in [${inputROIs}] and outputs in [${outputROIs}]`
    };
  }

  constructor(props) {
    super(props);
    // set the default state for the query input.
    this.state = {
      limitNeurons: true,
      statusFilters: [],
      preThreshold: 0,
      postThreshold: 0,
      neuronInstance: '',
      inputROIs: [],
      outputROIs: [],
      regexMatch: false
    };
  }

  // use this method to cleanup your form data, perform validation
  // and generate the query object.
  processRequest = () => {
    const { dataSet, submit } = this.props;
    const {
      statusFilters,
      limitNeurons,
      preThreshold,
      postThreshold,
      neuronInstance,
      neuronType,
      inputROIs,
      outputROIs
    } = this.state;

    const parameters = {
      dataset: dataSet,
      input_ROIs: inputROIs,
      output_ROIs: outputROIs,
      statuses: statusFilters,
      all_segments: !limitNeurons
    };

    if (neuronInstance !== '') {
      if (/^\d+$/.test(neuronInstance)) {
        parameters.neuron_id = parseInt(neuronInstance, 10);
      } else {
        parameters.neuron_name = neuronInstance;
      }
    }

    if (neuronType !== '') {
      parameters.neuron_type = neuronType;
    }

    if (preThreshold > 0) {
      parameters.pre_threshold = preThreshold;
    }

    if (postThreshold > 0) {
      parameters.post_threshold = postThreshold;
    }

    const query = {
      dataSet, // <string> for the data set selected
      plugin: pluginName, // <string> the name of this plugin.
      pluginCode: pluginAbbrev,
      parameters,
      visProps: {
        rowsPerPage: 25
      }
    };
    submit(query);
  };

  handleChangeROIsIn = selected => {
    const rois = selected.map(item => item.value);
    this.setState({ inputROIs: rois });
  };

  handleChangeROIsOut = selected => {
    const rois = selected.map(item => item.value);
    this.setState({ outputROIs: rois });
  };

  addNeuronInstance = neuronInstance => {
    this.setState({ neuronInstance });
  };

  addNeuronType = event => {
    const neuronType = event.target.value;
    this.setState({ neuronType });
  };

  loadNeuronFilters = params => {
    this.setState({
      limitNeurons: params.limitNeurons,
      statusFilters: params.statusFilters,
      preThreshold: parseInt(params.preThreshold, 10),
      postThreshold: parseInt(params.postThreshold, 10)
    });
  };

  // use this function to generate the form that will accept and
  // validate the variables for your Neo4j query.
  render() {
    const { classes, isQuerying, availableROIs, dataSet, actions, neoServerSettings } = this.props;
    const { neuronInstance = '', inputROIs = [], outputROIs = [], regexMatch } = this.state;

    const inputOptions = availableROIs.map(name => ({
      label: name,
      value: name
    }));

    const inputValue = inputROIs.map(roi => ({
      label: roi,
      value: roi
    }));

    const outputOptions = availableROIs.map(name => ({
      label: name,
      value: name
    }));

    const outputValue = outputROIs.map(roi => ({
      label: roi,
      value: roi
    }));

    return (
      <div>
        <InputLabel htmlFor="select-multiple-chip">Input ROIs</InputLabel>
        <Select
          className={classes.select}
          isMulti
          value={inputValue}
          onChange={this.handleChangeROIsIn}
          options={inputOptions}
          closeMenuOnSelect={false}
        />
        <InputLabel htmlFor="select-multiple-chip">Output ROIs</InputLabel>
        <Select
          className={classes.select}
          isMulti
          value={outputValue}
          onChange={this.handleChangeROIsOut}
          options={outputOptions}
          closeMenuOnSelect={false}
        />
        <FormControl fullWidth className={classes.formControl}>
          <NeuronHelp>
            <NeuronInputField onChange={this.addNeuronInstance} value={neuronInstance} />
          </NeuronHelp>
          {regexMatch && (
            <Typography color="error" className={classes.regexWarning}>
              Warning!! This is a regular expression search and characters like &#39;&#40;&#39; must
              be escaped. eg: to search for &#39;c(SFS)_R&#39; you would need to type
              &#39;c\\(SFS\\)_R&#39; For more details on how to write regular expressions, please
              see{' '}
              <a href="https://www.regular-expressions.info/">
                https://www.regular-expressions.info/
              </a>
            </Typography>
          )}
        </FormControl>
        <NeuronFilter
          callback={this.loadNeuronFilters}
          datasetstr={dataSet}
          actions={actions}
          neoServer={neoServerSettings.get('neoServer')}
        />
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

// data that will be provided to your form. Use it to build
// inputs, selections and for validation.
FindNeurons.propTypes = {
  actions: PropTypes.object.isRequired,
  availableROIs: PropTypes.arrayOf(PropTypes.string).isRequired,
  dataSet: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  submit: PropTypes.func.isRequired,
  isQuerying: PropTypes.bool.isRequired,
  neoServerSettings: PropTypes.object.isRequired
};

export default withStyles(styles)(FindNeurons);
