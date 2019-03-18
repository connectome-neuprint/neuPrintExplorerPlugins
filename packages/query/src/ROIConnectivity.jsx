/*
 * Supports simple, custom neo4j query.
 */
import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import InputLabel from '@material-ui/core/InputLabel';
import { withStyles } from '@material-ui/core/styles';

import { sortRois } from '@neuprint/support';

import ColorBox from './visualization/ColorBox';

const styles = theme => ({
  clickable: {
    cursor: 'pointer'
  },
  select: {
    fontFamily: theme.typography.fontFamily,
    margin: '0.5em 0 1em 0'
  }
});

const pluginName = 'ROIConnectivity';
const pluginAbbrev = 'rc';

// default color for max connection
const WEIGHTCOLOR = '255,100,100,';

class ROIConnectivity extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: 'ROI Connectivity',
      abbr: pluginAbbrev,
      description: 'Extract connectivity matrix for a dataset',
      visType: 'HeatMapTable'
    };
  }

  static fetchParameters() {
    return {
      queryString: '/npexplorer/roiconnectivity',
    };
  }

  static processResults(query, apiResponse, actions, submit) {
    const bodyInputCountsPerRoi = {};
    const { squareSize } = query.visProps;
    const { pm: parameters } = query;
    const { rois } = parameters;

    const neuronsInRoisQuery = (inputRoi, outputRoi) => ({
      dataSet: parameters.dataset,
      parameters: {
        dataset: parameters.dataset,
        input_ROIs: [inputRoi],
        output_ROIs: [outputRoi]
      },
      pluginCode: 'fn',
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

    let sortedRoisInQuery = Array.from(roisInQuery)
      .sort(sortRois);

    // if rois list is > 0 then filter, otherwise show everything
    if (rois && rois.length > 0) {
      sortedRoisInQuery = sortedRoisInQuery.filter(roi => rois.includes(roi));
    }

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
              className="heatmapbutton"
              onClick={() => submit(neuronsQuery)}
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
      debug: apiResponse.debug,
      title: 'ROI Connectivity (column: inputs, row: outputs)',
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      rois: []
    };
  }

  processRequest = () => {
    const { dataSet, submit } = this.props;
    const { rois } = this.state;

    const query = {
      dataSet,
      visProps: { squareSize: 75 },
      plugin: pluginName,
      pluginCode: pluginAbbrev,
      parameters: {
        dataset: dataSet,
        rois
      },
    };
    submit(query);
    return query;
  };

  handleChangeROIs = selected => {
    const rois = selected.map(item => item.value);
    this.setState({ rois });
  };

  render() {
    const { isQuerying, availableROIs, classes } = this.props;
    const { rois } = this.state;

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
  classes: PropTypes.object.isRequired,
  isQuerying: PropTypes.bool.isRequired,
  submit: PropTypes.func.isRequired
};

export default withStyles(styles)(ROIConnectivity);
