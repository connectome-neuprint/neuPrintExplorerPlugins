/*
 * Supports simple, custom neo4j query.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import Select from 'react-select';
import randomColor from 'randomcolor';

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import InputLabel from '@material-ui/core/InputLabel';
import { withStyles } from '@material-ui/core/styles';

import { sortRois } from '@neuprint/support';

import ColorBox from './visualization/ColorBox';
import { ColorLegend } from './visualization/MiniRoiHeatMap';
import {
  getBodyIdForTable,
  createSimpleConnectionsResult,
  generateRoiHeatMapAndBarGraph,
  setColumnIndices,
  createSimpleConnectionQueryObject
} from './shared/pluginhelpers';

const styles = theme => ({
  clickable: {
    cursor: 'pointer'
  },
  select: {
    fontFamily: theme.typography.fontFamily,
    margin: '0.5em 0 1em 0'
  },
  button: {
    padding: 0,
    border: 0,
    cursor: 'pointer'
  }
});

const pluginName = 'ROIConnectivity';
const pluginAbbrev = 'rc';

// default color for max connection
const WEIGHTCOLOR = '255,100,100,';

class ROIConnectivity extends React.Component {
  static get queryName() {
    return 'ROI Connectivity';
  }

  static get queryDescription() {
    return 'Extract connectivity matrix for a dataset';
  }

  static get queryAbbreviation() {
    return pluginAbbrev;
  }

  processResults = (query, apiResponse) => {
    const { actions, classes, availableROIs } = this.props;
    const bodyInputCountsPerRoi = {};
    const { squareSize } = query.visProps;
    let { rois } = query.parameters;

    // if no selected rois, should include all rois
    if (!rois || rois.length === 0) {
      rois = availableROIs;
    }

    const neuronsInRoisQuery = (inputRoi, outputRoi) => ({
      dataSet: query.parameters.dataset,
      queryString: '/npexplorer/findneurons',
      parameters: {
        dataset: query.parameters.dataset,
        input_ROIs: [inputRoi],
        output_ROIs: [outputRoi]
      },
      visType: 'SimpleTable',
      plugin: pluginName,
      title: `Neurons with inputs in: ${inputRoi} and outputs in: ${outputRoi}`,
      menuColor: randomColor({ luminosity: 'light', hue: 'random' }),
      processResults: this.processRoiResults
    });

    // get set of all rois included in this query
    const roisInQuery = new Set();

    apiResponse.data.forEach(row => {
      const bodyId = row[0];
      const roiInfoObject = row[1] ? JSON.parse(row[1]) : '{}';

      Object.entries(roiInfoObject).forEach(roi => {
        const [name, data] = roi;
        roisInQuery.add(name);
        if (data.post > 0) {
          if (!(bodyId in bodyInputCountsPerRoi)) {
            bodyInputCountsPerRoi[bodyId] = [[name, data.post]];
          } else {
            bodyInputCountsPerRoi[bodyId].push([name, data.post]);
          }
        }
      });
    });

    const roiRoiWeight = {};
    const roiRoiCount = {};
    let maxValue = 1;

    // grab output and add table entry
    apiResponse.data.forEach(row => {
      const bodyId = row[0];
      const roiInfoObject = row[1] ? JSON.parse(row[1]) : '{}';

      Object.entries(roiInfoObject).forEach(roi => {
        const [outputRoi, data] = roi;
        // create roi2roi based on input distribution
        const numOutputsInRoi = data.pre;
        // if body has pre in this roi and has post in any roi
        if (numOutputsInRoi > 0 && bodyId in bodyInputCountsPerRoi) {
          let totalInputs = 0;
          for (let i = 0; i < bodyInputCountsPerRoi[bodyId].length; i += 1) {
            totalInputs += bodyInputCountsPerRoi[bodyId][i][1];
          }

          for (let i = 0; i < bodyInputCountsPerRoi[bodyId].length; i += 1) {
            const inputRoi = bodyInputCountsPerRoi[bodyId][i][0];
            if (inputRoi !== '' && totalInputs !== 0) {
              const connectivityValueForBody =
                (numOutputsInRoi * bodyInputCountsPerRoi[bodyId][i][1] * 1.0) / totalInputs;
              const connectionName = `${inputRoi}=>${outputRoi}`;
              if (connectionName in roiRoiWeight) {
                roiRoiWeight[connectionName] += connectivityValueForBody;
                roiRoiCount[connectionName] += 1;
              } else {
                roiRoiWeight[connectionName] = connectivityValueForBody;
                roiRoiCount[connectionName] = 1;
              }
              const currentValue = roiRoiWeight[connectionName];
              if (currentValue > maxValue) {
                maxValue = currentValue;
              }
            }
          }
        }
      });
    });

    // make data table
    const data = [];

    const sortedRoisInQuery = Array.from(roisInQuery)
      .sort(sortRois)
      .filter(roi => rois.includes(roi));

    for (let i = 0; i < sortedRoisInQuery.length; i += 1) {
      const inputRoiName = sortedRoisInQuery[i];
      const row = [];
      row.push(inputRoiName);
      for (let j = 0; j < sortedRoisInQuery.length; j += 1) {
        const outputRoiName = sortedRoisInQuery[j];
        let connectivityValue = 0;
        let connectivityCount = 0;
        const connectionName = `${inputRoiName}=>${outputRoiName}`;
        if (connectionName in roiRoiWeight) {
          connectivityValue = parseInt(roiRoiWeight[connectionName].toFixed(), 10);
          connectivityCount = roiRoiCount[connectionName];
        }

        let scaleFactor = 0;
        if (connectivityValue > 0) {
          scaleFactor = Math.log(connectivityValue) / Math.log(maxValue);
        }
        const weightColor = `rgba(${WEIGHTCOLOR}${scaleFactor.toString()})`;

        const neuronsQuery = neuronsInRoisQuery(inputRoiName, outputRoiName);

        row.push({
          value: (
            <button
              type="button"
              className={classes.button}
              onClick={() => actions.submit(neuronsQuery)}
            >
              <ColorBox
                margin={0}
                width={squareSize}
                height={squareSize}
                backgroundColor={weightColor}
                title=""
                key={connectionName}
                text={
                  <div>
                    <Typography>{connectivityValue} </Typography>
                    <Typography variant="caption">{connectivityCount}</Typography>
                  </div>
                }
              />
            </button>
          ),
          sortBy: { rowValue: inputRoiName, columeValue: outputRoiName },
          csvValue: connectivityValue,
          uniqueId: connectionName
        });
      }
      data.push(row);
    }

    return {
      columns: ['', ...sortedRoisInQuery],
      data,
      debug: apiResponse.debug
    };
  };

  processSimpleConnections = (query, apiResponse) => {
    const { actions } = this.props;

    return createSimpleConnectionsResult(
      query,
      apiResponse,
      actions,
      pluginName,
      this.processSimpleConnections
    );
  };

  processRoiResults = (query, apiResponse) => {
    const { actions } = this.props;
    const { parameters } = query;

    const indexOf = setColumnIndices([
      'bodyId',
      'name',
      'status',
      'post',
      'pre',
      `${parameters.input_ROIs[0]}Post`,
      `${parameters.output_ROIs[0]}Pre`,
      'size',
      'roiHeatMap',
      'roiBarGraph'
    ]);

    const data = apiResponse.data.map(row => {
      const hasSkeleton = row[8];
      const roiInfoObject = row[3] ? JSON.parse(row[3]) : '{}';
      const inputRoi = parameters.input_ROIs[0];
      const outputRoi = parameters.output_ROIs[0];
      const bodyId = row[0];
      const name = row[1];
      const status = row[2];
      const size = row[4];
      const totalPre = row[5];
      const totalPost = row[6];
      const roiList = row[7];
      // make sure none is added to the rois list.
      roiList.push('none');

      const converted = [];
      converted[indexOf.bodyId] = getBodyIdForTable(query.dataSet, bodyId, hasSkeleton, actions);
      converted[indexOf.name] = name;
      converted[indexOf.status] = status;
      converted[indexOf.post] = '-'; // empty unless roiInfoObject present
      converted[indexOf.pre] = '-';
      converted[indexOf[`${parameters.input_ROIs[0]}Post`]] = roiInfoObject[inputRoi].post;
      converted[indexOf[`${parameters.output_ROIs[0]}Pre`]] = roiInfoObject[outputRoi].pre;
      converted[indexOf.size] = size;
      converted[indexOf.roiHeatMap] = '';
      converted[indexOf.roiBarGraph] = '';

      if (roiInfoObject) {
        const { heatMap, barGraph } = generateRoiHeatMapAndBarGraph(
          roiInfoObject,
          roiList,
          totalPre,
          totalPost
        );

        converted[indexOf.roiHeatMap] = heatMap;
        converted[indexOf.roiBarGraph] = barGraph;

        const postQuery = createSimpleConnectionQueryObject(
          query.dataSet,
          true,
          bodyId,
          this.processSimpleConnections,
          pluginName
        );
        converted[indexOf.post] = {
          value: totalPost,
          action: () => actions.submit(postQuery)
        };

        const preQuery = createSimpleConnectionQueryObject(
          query.dataSet,
          false,
          bodyId,
          this.processSimpleConnections,
          pluginName
        );
        converted[indexOf.pre] = {
          value: totalPre,
          action: () => actions.submit(preQuery)
        };
      }

      return converted;
    });

    const columns = [];
    columns[indexOf.bodyId] = 'id';
    columns[indexOf.name] = 'neuron';
    columns[indexOf.status] = 'status';
    columns[indexOf.post] = '#post (inputs)';
    columns[indexOf.pre] = '#pre (outputs)';
    columns[indexOf[`${parameters.input_ROIs[0]}Post`]] = `#post in ${parameters.input_ROIs[0]}`;
    columns[indexOf[`${parameters.input_ROIs[0]}Pre`]] = `#pre in ${parameters.output_ROIs[0]}`;
    columns[indexOf.size] = '#voxels';
    columns[indexOf.roiHeatMap] = (
      <div>
        roi heatmap <ColorLegend />
      </div>
    );
    columns[indexOf.roiBarGraph] = 'roi breakdown';

    return {
      columns,
      data,
      debug: apiResponse.debug
    };
  };

  processRequest = () => {
    const { dataSet, actions, history } = this.props;
    const { rois = [] } = actions.getQueryObject(pluginAbbrev);

    const query = {
      dataSet,
      queryString: '/npexplorer/roiconnectivity',
      visType: 'HeatMapTable',
      visProps: { squareSize: 75 },
      plugin: pluginName,
      parameters: {
        dataset: dataSet,
        rois
      },
      title: 'ROI Connectivity (column: inputs, row: outputs)',
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

  handleChangeROIs = selected => {
    const { actions } = this.props;
    const rois = selected.map(item => item.value);
    actions.setQueryString({
      [pluginAbbrev]: {
        rois
      }
    });
  };

  render() {
    const { isQuerying, availableROIs, actions, classes } = this.props;
    const { rois = [] } = actions.getQueryObject(pluginAbbrev);

    const roiOptions = availableROIs.map(name => ({
      label: name,
      value: name
    }));

    const roiValue = rois.map(roi => ({
      label: roi,
      value: roi
    }));

    return (
      <div>
        <InputLabel htmlFor="select-multiple-chip">ROIs (optional)</InputLabel>
        <Select
          className={classes.select}
          isMulti
          value={roiValue}
          onChange={this.handleChangeROIs}
          options={roiOptions}
          closeMenuOnSelect={false}
        />
        <Button
          variant="contained"
          color="primary"
          disabled={isQuerying}
          onClick={this.processRequest}
        >
          Submit
        </Button>
        <br />
        <br />
        <Typography style={{ fontWeight: 'bold' }}>Description</Typography>
        <Typography variant="body2">
          Within each cell of the matrix, the top number represents connections from ROI X to ROI Y
          defined as the number of synapses from neurons that have inputs in X and outputs in Y. The
          number represents the number of outputs from these neurons in Y weighted by the proportion
          of inputs that are in X. The bottom number is the number of neurons with at least one
          input in X and one output in Y. In some cases, the bottom number can be larger than the
          top number if most of the neuron inputs are not in X.
        </Typography>
      </div>
    );
  }
}

ROIConnectivity.propTypes = {
  dataSet: PropTypes.string.isRequired,
  availableROIs: PropTypes.arrayOf(PropTypes.string).isRequired,
  actions: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  isQuerying: PropTypes.bool.isRequired,
  history: PropTypes.object.isRequired
};

export default withRouter(withStyles(styles)(ROIConnectivity));
