/* eslint-disable prefer-destructuring */
import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';

import { ColorLegend } from '@neuprint/miniroiheatmap';
import NeuronInputField from './shared/NeuronInputField';
import AdvancedNeuronInput from './shared/AdvancedNeuronInput';
import NeuronFilter from './shared/NeuronFilter';
import BrainRegionInput from './shared/BrainRegionInput';
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
  },
  formControl: {
    marginBottom: '1em'
  }
});

// this should match the name of the file this plugin is stored in.
const pluginName = 'FindNeurons';
const pluginAbbrev = 'fn';

function rejectRowCheck(type, roiInfo, roisToCheck) {
  // if no ROIs were selected to filter, then return
  if (roisToCheck.length === 0) {
    return false;
  }
  // if roi is in any of the check locations then return false
  for (let i = 0; i < roisToCheck.length; i += 1) {
    const roi = roisToCheck[i];
    if (roiInfo[roi][type] > 0) {
      return false;
    }
  }
  return true;
}

function findMinSortValue(row, inputROIs, outputROIs) {
  const counts = [];
  const roiInfoObject = JSON.parse(row[4]);
  // get pre for all outputs
  outputROIs.forEach(roi => counts.push(roiInfoObject[roi].pre));
  // get post for all inputs
  inputROIs.forEach(roi => counts.push(roiInfoObject[roi].post));
  // return min value
  return Math.min(...counts);
}

export class FindNeurons extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: 'Find neurons',
      abbr: pluginAbbrev,
      category: 'top-level',
      description: 'Find neurons that have inputs or outputs in selected brain regions',
      visType: 'SimpleTable'
    };
  }

  static fetchParameters() {
    return {
      queryString: '/npexplorer/findneurons'
    };
  }

  static clipboardCallback = apiResponse => (columns) => {
    const csv = apiResponse.result.data.map(row => {
      const filteredRow = columns.map((column, index) => {
        if (!column) {
          return null;
        }

        if (row[index] && typeof row[index] === 'object') {
          return row[index].sortBy || row[index].value
        }

        if (!row[index]) {
          return '';
        }

        return row[index];
      }).filter(item => item !== null).join(',')
      return filteredRow;
    }).join('\n');
    return csv;
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

        // filter out the rows that don't have the selected inputs or outputs.
        if (rejectRowCheck('post', roiInfoObject, inputROIs)) {
          return null;
        }
        if (rejectRowCheck('pre', roiInfoObject, outputROIs)) {
          return null;
        }

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
      .filter(row => row !== null)
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
      { name: 'brain region breakdown', status: true },
      { name: 'brain region heatmap', status: false }
    );
    return columnIds;
  }

  // this function will parse the results from the query to the
  // Neo4j server and place them in the correct format for the
  // visualization plugin.
  static processResults({ query, apiResponse, actions, submitFunc }) {
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

    const data = apiResponse.data
      // sort based on inputs and outputs selected.
      .sort((b, a) => {
        // determine the columns we need
        const aValue = findMinSortValue(a, inputROIs, outputROIs);
        const bValue = findMinSortValue(b, inputROIs, outputROIs);
        // return the result
        return aValue - bValue;
      })
      .map(row => {
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
        roiList.push('None');
        if (roiInfoObject) {
          const { heatMap, barGraph } = generateRoiHeatMapAndBarGraph(
            roiInfoObject,
            roiList,
            totalPre,
            totalPost
          );
          converted[indexOf.roiHeatMap] = heatMap;
          converted[indexOf.roiBarGraph] = barGraph;

          const postQuery = createSimpleConnectionQueryObject({
            dataSet: query.ds,
            isPost: true,
            queryId: bodyId
          });
          converted[indexOf.post] = {
            value: totalPost,
            action: () => submitFunc(postQuery)
          };

          const preQuery = createSimpleConnectionQueryObject({
            dataSet: query.ds,
            queryId: bodyId
          });
          converted[indexOf.pre] = {
            value: totalPre,
            action: () => submitFunc(preQuery)
          };

          if (rois.length > 0) {
            rois.forEach(roi => {
              converted[indexOf[`${roi}Post`]] = roiInfoObject[roi].post;
              converted[indexOf[`${roi}Pre`]] = roiInfoObject[roi].pre;
            });
          }
        }

        return converted;
      })
      .filter(row => row !== null);
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
    columns[indexOf.roiBarGraph] = 'brain region breakdown';
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
      useSuper: true,
      advancedSearch: JSON.parse(localStorage.getItem('neuprint_advanced_search')) || false
    };
  }

  // use this method to cleanup your form data, perform validation
  // and generate the query object.
  processRequest = () => {
    const { dataSet, submit, actions } = this.props;
    const {
      statusFilters,
      limitNeurons,
      preThreshold,
      postThreshold,
      neuronInstance,
      neuronType,
      inputROIs,
      outputROIs,
      advancedSearch
    } = this.state;

    const parameters = {
      dataset: dataSet,
      input_ROIs: inputROIs,
      output_ROIs: outputROIs,
      statuses: statusFilters,
      all_segments: !limitNeurons,
    };

    // if not using an advanced search then we want to query neo4j with
    // the CONTAINS search and not a regex search.
    if (!advancedSearch) {
      parameters.enable_contains = true;
    }

    // don't allow submission if there are no filters set.
    if (neuronInstance === '' && inputROIs.length === 0 && outputROIs.length === 0) {
      actions.formError('Please apply at least one of the filters in the form.');
      return;
    }

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
    let rois = [];
    if (selected) {
      rois = selected.map(item => item.value);
    }
    this.setState({ inputROIs: rois });
  };

  handleChangeROIsOut = selected => {
    let rois = [];
    if (selected) {
      rois = selected.map(item => item.value);
    }
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
      statusFilters: params.statusFilters,
      preThreshold: parseInt(params.preThreshold, 10),
      postThreshold: parseInt(params.postThreshold, 10)
    });
  };

  toggleSuper = event => {
    // TODO: check to see if ROIs are valid. Remove if they are no longer valid.
    this.setState({ useSuper: !event.target.checked, inputROIs: [], outputROIs: [] });
  };

  toggleAdvanced = event => {
    localStorage.setItem('neuprint_advanced_search', event.target.checked);
    this.setState({ advancedSearch: event.target.checked, neuronInstance: '' });
  };

  // use this function to generate the form that will accept and
  // validate the variables for your Neo4j query.
  render() {
    const {
      classes,
      isQuerying,
      availableROIs,
      superROIs,
      roiInfo,
      dataSet,
      actions,
      neoServerSettings
    } = this.props;
    const {
      useSuper,
      neuronInstance = '',
      inputROIs = [],
      outputROIs = [],
      advancedSearch
    } = this.state;

    // decide to use super ROIs (default) or all ROIs
    const selectedROIs = useSuper ? superROIs : availableROIs;
    const inputValue = inputROIs.map(roi => ({
      label: roi,
      value: roi
    }));
    const outputValue = outputROIs.map(roi => ({
      label: roi,
      value: roi
    }));

    return (
      <div>
        {advancedSearch ? (
          <AdvancedNeuronInput
            onChange={this.addNeuronInstance}
            value={neuronInstance}
            dataSet={dataSet}
            handleSubmit={this.processRequest}
          />
        ) : (
          <NeuronInputField
            onChange={this.addNeuronInstance}
            value={neuronInstance}
            dataSet={dataSet}
            handleSubmit={this.processRequest}
          />
        )}
        <InputLabel htmlFor="select-multiple-chip">Input Brain Regions</InputLabel>
        <BrainRegionInput
          rois={selectedROIs}
          value={inputValue}
          roiInfo={roiInfo}
          onChange={this.handleChangeROIsIn}
        />
        <InputLabel htmlFor="select-multiple-chip">Output Brain Regions</InputLabel>
        <BrainRegionInput
          rois={selectedROIs}
          value={outputValue}
          roiInfo={roiInfo}
          onChange={this.handleChangeROIsOut}
        />
        <FormControl className={classes.formControl}>
          <FormControlLabel
            control={<Switch checked={!useSuper} onChange={this.toggleSuper} color="primary" />}
            label={
              <Typography variant="subtitle1" style={{ display: 'inline-flex' }}>
                Allow all brain regions
              </Typography>
            }
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <FormControlLabel
            control={<Switch checked={advancedSearch} onChange={this.toggleAdvanced} color="primary" />}
            label={
              <Typography variant="subtitle1" style={{ display: 'inline-flex' }}>
                Advanced input
              </Typography>
            }
          />
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
  superROIs: PropTypes.arrayOf(PropTypes.string).isRequired,
  roiInfo: PropTypes.object,
  dataSet: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  submit: PropTypes.func.isRequired,
  isQuerying: PropTypes.bool.isRequired,
  neoServerSettings: PropTypes.object.isRequired
};

FindNeurons.defaultProps = {
  roiInfo: {},
};

export default withStyles(styles)(FindNeurons);
