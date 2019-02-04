/*
 * Find similar neurons in a dataset.
 */

// TODO: create larger groups by merging similar groups

import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import randomColor from 'randomcolor';
import Select from 'react-select';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';

import { round } from 'mathjs';
import RoiHeatMap, { ColorLegend } from './visualization/MiniRoiHeatMap';
import {
  setColumnIndices,
  createSimpleConnectionQueryObject,
  createSimpleConnectionsResult,
  generateRoiHeatMapAndBarGraph,
  getBodyIdForTable,
  computeSimilarity,
  getScore
} from './shared/pluginhelpers';

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

const pluginName = 'FindSimilarNeurons';
const pluginAbbrev = 'fsn';

export class FindSimilarNeurons extends React.Component {
  static get queryName() {
    return 'Find similar neurons';
  }

  static get queryDescription() {
    return 'Find neurons that are similar to a neuron of interest in terms of their input and output locations (ROIs).';
  }

  static get queryAbbreviation() {
    return pluginAbbrev;
  }

  static get isExperimental() {
    return true;
  }

  // functions for processing results
  processSimilarResults = (query, apiResponse) => {
    const { actions } = this.props;
    const { parameters } = query;

    // store sub-level rois
    const subLevelRois = new Set();

    // store processed data
    let data;

    if (apiResponse.data.length === 0) {
      // produce appropriate error message depending on which query called the function
      actions.pluginResponseError(parameters.emptyDataErrorMessage);
      return {
        columns: [],
        data: [],
        debug: apiResponse.debug
      };
    }

    // store the index of the queried body id
    let queriedBodyIdIndex;

    // store super-level rois
    const roiList = apiResponse.data[0][6];
    roiList.push('none');
    const numberOfRois = roiList.length;

    const noBodyIdProvided = !parameters.bodyId;
    const shouldShowSimilarityScores = apiResponse.data.length > 1 && parameters.bodyId;
    const singleResult = apiResponse.data.length === 1 && parameters.bodyId;

    const basicColumns = [
      'bodyId',
      'name',
      'status',
      'pre',
      'post',
      'roiBarGraph',
      'roiHeatMap',
      'subLevelRoiHeatMap'
    ];
    // column names
    const columns = [];
    // set basic columns
    let indexOf = setColumnIndices([
      ...basicColumns,
      'totalSimScore',
      'inputSimScore',
      'outputSimScore'
    ]);
    columns[indexOf.totalSimScore] = 'total similarity score';
    columns[indexOf.inputSimScore] = 'input similarity score';
    columns[indexOf.outputSimScore] = 'output similarity score';

    columns[indexOf.bodyId] = 'bodyId';
    columns[indexOf.name] = 'name';
    columns[indexOf.status] = 'status';
    columns[indexOf.pre] = 'pre';
    columns[indexOf.post] = 'post';
    columns[indexOf.roiBarGraph] = 'roi breakdown (mouseover for details)';
    columns[indexOf.roiHeatMap] = (
      <div>
        roi heatmap (mouseover for details) <ColorLegend />
      </div>
    );
    columns[indexOf.subLevelRoiHeatMap] = 'sub-level roi heatmap';

    data = apiResponse.data.map((row, index) => {
      const bodyId = row[0];
      const name = row[1];
      const status = row[2];
      const totalPre = row[3];
      const totalPost = row[4];
      const hasSkeleton = row[8];
      const roiInfoObject = JSON.parse(row[5]);

      // get index of queried body id so can move this data to top of table
      if (bodyId === parseInt(parameters.bodyId, 10)) {
        queriedBodyIdIndex = index;
      }

      const converted = [];
      converted[indexOf.bodyId] = getBodyIdForTable(query.dataSet, bodyId, hasSkeleton, actions);
      converted[indexOf.name] = name;
      converted[indexOf.status] = status;
      const postQuery = createSimpleConnectionQueryObject(
        parameters.dataset,
        true,
        bodyId,
        this.processConnections,
        pluginName
      );
      converted[indexOf.post] = {
        value: totalPost,
        action: () => actions.submit(postQuery)
      };

      const preQuery = createSimpleConnectionQueryObject(
        parameters.dataset,
        false,
        bodyId,
        this.processConnections,
        pluginName
      );
      converted[indexOf.pre] = {
        value: totalPre,
        action: () => actions.submit(preQuery)
      };
      converted[indexOf.roiBarGraph] = ''; // empty unless roiInfoObject present
      converted[indexOf.roiHeatMap] = '';
      converted[indexOf.subLevelRoiHeatMap] = 'N/A';
      converted[indexOf.totalSimScore] = 0;
      converted[indexOf.inputSimScore] = 0;
      converted[indexOf.outputSimScore] = 0;

      if (roiInfoObject) {
        // calculate # pre and post in super rois (which are disjoint) to get total
        // number of synapses assigned to an roi
        let postInSuperRois = 0;
        let preInSuperRois = 0;
        // generate vector for sorting by similarity; fill with zeros
        const vector = Array(numberOfRois * 2).fill(0);
        Object.keys(roiInfoObject).forEach(roi => {
          const roiIndex = roiList.indexOf(roi);
          if (roiIndex !== -1) {
            preInSuperRois += roiInfoObject[roi].pre;
            postInSuperRois += roiInfoObject[roi].post;
            vector[roiIndex] = totalPre > 0 ? (roiInfoObject[roi].pre * 1.0) / totalPre : 0;
            vector[roiIndex + numberOfRois] =
              totalPost > 0 ? (roiInfoObject[roi].post * 1.0) / totalPost : 0;
          } else {
            subLevelRois.add(roi);
          }
        });

        // add this after the other rois have been summed.
        // records # pre and post that are not in rois
        roiInfoObject.none = {
          pre: totalPre - preInSuperRois,
          post: totalPost - postInSuperRois
        };
        const noneIndex = roiList.indexOf('none');
        vector[noneIndex] = totalPre > 0 ? (roiInfoObject.none.pre * 1.0) / totalPre : 0;
        vector[noneIndex + numberOfRois] =
          totalPost > 0 ? (roiInfoObject.none.post * 1.0) / totalPost : 0;

        const { heatMap, barGraph } = generateRoiHeatMapAndBarGraph(
          roiInfoObject,
          roiList,
          totalPre,
          totalPost
        );
        converted[indexOf.roiHeatMap] = heatMap;
        converted[indexOf.roiBarGraph] = barGraph;

        if (shouldShowSimilarityScores || noBodyIdProvided) {
          // store vector
          converted[indexOf.totalSimScore] = vector;
        }
      }

      return converted;
    });

    if (subLevelRois.size > 0) {
      indexOf = setColumnIndices([
        ...basicColumns,
        'totalSimScore',
        'inputSimScore',
        'outputSimScore',
        'subLevelSimScore'
      ]);
      columns[indexOf.totalSimScore] = 'total similarity score';
      columns[indexOf.inputSimScore] = 'input similarity score';
      columns[indexOf.outputSimScore] = 'output similarity score';
      columns[indexOf.subLevelSimScore] = 'sub-level roi similarity score';

      apiResponse.data.forEach((row, index) => {
        const roiInfo = row[5];
        const roiInfoObject = JSON.parse(roiInfo);
        const totalPre = row[3];
        const totalPost = row[4];
        const subLevelRoiList = Array.from(subLevelRois);

        // sub-level roi vector
        if (singleResult) {
          data[index][indexOf.subLevelSimScore] = 0;
        } else {
          const subLevelRoiVector = Array(subLevelRoiList.length * 2).fill(0);
          Object.keys(roiInfoObject).forEach(roi => {
            const roiIndex = subLevelRoiList.indexOf(roi);
            if (roiIndex !== -1) {
              subLevelRoiVector[roiIndex] =
                totalPre > 0 ? (roiInfoObject[roi].pre * 1.0) / totalPre : 0;
              subLevelRoiVector[roiIndex + subLevelRoiList.length] =
                totalPost > 0 ? (roiInfoObject[roi].post * 1.0) / totalPost : 0;
            }
          });
          data[index][indexOf.subLevelSimScore] = subLevelRoiVector;
        }

        // sub-level ROI heatmap
        data[index][indexOf.subLevelRoiHeatMap] = (
          <RoiHeatMap
            roiList={subLevelRoiList}
            roiInfoObject={roiInfoObject}
            preTotal={totalPre}
            postTotal={totalPost}
          />
        );
      });
    }

    if (shouldShowSimilarityScores || noBodyIdProvided) {
      // sort by similarity
      let queriedBodyVector;
      if (noBodyIdProvided) {
        // if no queried body id just use first result similarity to sort
        queriedBodyVector = data[0][indexOf.totalSimScore];
      } else {
        queriedBodyVector = data[queriedBodyIdIndex][indexOf.totalSimScore];
      }

      const dataWithSimilarityScores = data.map(row => {
        const newRow = row;
        const rawVector = row[indexOf.totalSimScore];
        const { inputScore, outputScore, totalScore } = computeSimilarity(
          rawVector,
          queriedBodyVector
        );
        // input score (pre)
        newRow[indexOf.inputSimScore] = inputScore;
        // output score (post)
        newRow[indexOf.outputSimScore] = outputScore;
        // total score
        newRow[indexOf.totalSimScore] = totalScore;

        // sub-level rois
        if (subLevelRois.size > 0) {
          let queriedBodySubLevelVector;
          if (noBodyIdProvided) {
            queriedBodySubLevelVector = data[0][indexOf.subLevelSimScore];
          } else {
            queriedBodySubLevelVector = data[queriedBodyIdIndex][indexOf.subLevelSimScore];
          }
          newRow[indexOf.subLevelSimScore] = getScore(
            queriedBodySubLevelVector,
            row[indexOf.subLevelSimScore],
            4.0,
            4
          );

          // incorporate sub-level rois into total score
          newRow[indexOf.totalSimScore] = round(
            (row[indexOf.totalSimScore] + row[indexOf.subLevelSimScore]) / 2.0,
            4
          );
        }
        return newRow;
      });
      data = dataWithSimilarityScores;

      // sort by total similarity score; queried body id will be 0 so should be at top
      data.sort((a, b) => {
        if (a[indexOf.totalSimScore] < b[indexOf.totalSimScore]) return -1;
        if (a[indexOf.totalSimScore] > b[indexOf.totalSimScore]) return 1;
        return 0;
      });
    }

    return {
      columns,
      data,
      debug: apiResponse.debug
    };
  };

  processGroupResults = (query, apiResponse) => {
    const { actions } = this.props;
    const { parameters } = query;

    // for displaying cluster names
    if (apiResponse.data.length === 0) {
      actions.pluginResponseError('No cluster names found in the dataset.');
      return { columns: apiResponse.columns, data: apiResponse.data, debug: apiResponse.debug };
    }

    const data = apiResponse.data.map(row => {
      const clusterName = row[0];

      const clusterQueryString = `MATCH (m:Meta{dataset:'${
        parameters.dataset
      }'}) WITH m.superLevelRois AS rois MATCH (n:\`${
        parameters.dataset
      }-Neuron\`{clusterName:'${clusterName}'}) RETURN n.bodyId, n.name, n.status, n.pre, n.post, n.roiInfo, rois, n.clusterName, exists((n)-[:Contains]->(:Skeleton)) AS hasSkeleton`;

      parameters.clusterName = clusterName;
      parameters.emptyDataErrorMessage = 'Cluster name does not exist in the dataset.';

      const title = `Neurons with classification ${clusterName}`;

      const clusterQuery = {
        dataSet: parameters.dataset,
        cypherQuery: clusterQueryString,
        visType: 'SimpleTable',
        visProps: { rowsPerPage: 25 },
        plugin: pluginName,
        parameters,
        title,
        menuColor: randomColor({ luminosity: 'light', hue: 'random' }),
        processResults: this.processSimilarResults
      };

      const converted = [
        {
          value: clusterName,
          action: () => actions.submit(clusterQuery)
        }
      ];

      return converted;
    });

    return {
      columns: ['cluster name (click to explore group)'],
      data,
      debug: apiResponse.debug
    };
  };

  processConnections = (query, apiResponse) => {
    const { actions } = this.props;

    return createSimpleConnectionsResult(
      query,
      apiResponse,
      actions,
      pluginName,
      this.processConnections
    );
  };

  // processing intital request
  processIDRequest = () => {
    const { dataSet, actions, history } = this.props;
    const { bodyId = '' } = actions.getQueryObject(pluginAbbrev);

    const parameters = {
      dataset: dataSet,
      bodyId,
      emptyDataErrorMessage: 'Body ID not found in dataset.'
    };

    const similarQuery = `MATCH (m:Meta{dataset:'${dataSet}'}) WITH m.superLevelRois AS rois MATCH (n:\`${dataSet}-Neuron\`{bodyId:${bodyId}}) WITH n.clusterName AS cn, rois MATCH (n:\`${dataSet}-Neuron\`{clusterName:cn}) RETURN n.bodyId, n.name, n.status, n.pre, n.post, n.roiInfo, rois, n.clusterName, exists((n)-[:Contains]->(:Skeleton)) AS hasSkeleton`;

    const title = `Neurons similar to ${bodyId}`;

    const query = {
      dataSet,
      cypherQuery: similarQuery,
      visType: 'SimpleTable',
      visProps: { rowsPerPage: 25 },
      plugin: pluginName,
      parameters,
      title,
      menuColor: randomColor({ luminosity: 'light', hue: 'random' }),
      processResults: this.processSimilarResults
    };

    actions.submit(query);

    history.push({
      pathname: '/results',
      search: actions.getQueryString()
    });

    return query;
  };

  processGroupRequest = () => {
    const { dataSet, actions, history } = this.props;

    const parameters = {
      dataset: dataSet
    };

    const groupsQuery = `MATCH (n:\`${dataSet}-Neuron\`) RETURN DISTINCT n.clusterName`;

    const title = `Cluster names for ${dataSet} dataset`;

    const query = {
      dataSet,
      cypherQuery: groupsQuery,
      visType: 'SimpleTable',
      visProps: { rowsPerPage: 25 },
      plugin: pluginName,
      parameters,
      title,
      menuColor: randomColor({ luminosity: 'light', hue: 'random' }),
      processResults: this.processGroupResults
    };

    actions.submit(query);

    history.push({
      pathname: '/results',
      search: actions.getQueryString()
    });

    return query;
  };

  processRoiRequest = () => {
    const { dataSet, actions, history } = this.props;
    const { rois = [] } = actions.getQueryObject(pluginAbbrev);

    const parameters = {
      dataset: dataSet,
      rois,
      emptyDataErrorMessage: `No neurons located in all selected rois: ${rois}`
    };

    let roiPredicate = '';
    rois.forEach(roi => {
      roiPredicate += `exists(n.\`${roi}\`) AND `;
    });
    const roiQuery = `MATCH (m:Meta{dataset:'${dataSet}'}) WITH m.superLevelRois AS rois MATCH (n:\`${dataSet}-Neuron\`) WHERE (${roiPredicate.slice(
      0,
      -4
    )}) RETURN n.bodyId, n.name, n.status, n.pre, n.post, n.roiInfo, rois, n.clusterName, exists((n)-[:Contains]->(:Skeleton)) AS hasSkeleton`;

    // TODO: change title based on results
    const title = `Neurons in ${rois}`;

    const query = {
      dataSet,
      cypherQuery: roiQuery,
      visType: 'SimpleTable',
      visProps: { rowsPerPage: 25 },
      plugin: pluginName,
      parameters,
      title,
      menuColor: randomColor({ luminosity: 'light', hue: 'random' }),
      processResults: this.processSimilarResults
    };

    actions.submit(query);

    history.push({
      pathname: '/results',
      search: actions.getQueryString()
    });

    return query;
  };

  addNeuronBodyId = event => {
    const { actions } = this.props;
    actions.setQueryString({
      [pluginAbbrev]: {
        bodyId: event.target.value
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

  catchReturn = event => {
    // submit request if user presses enter
    if (event.keyCode === 13) {
      event.preventDefault();
      this.processIDRequest();
    }
  };

  render() {
    const { classes, availableROIs, isQuerying, actions } = this.props;
    const { bodyId = '', rois = [] } = actions.getQueryObject(pluginAbbrev);

    const roiOptions = availableROIs.map(name => ({
      label: name,
      value: name
    }));

    const roiValues = rois.map(roi => ({
      label: roi,
      value: roi
    }));

    return (
      <div>
        <FormControl fullWidth className={classes.formControl}>
          <TextField
            label="Neuron bodyId"
            multiline
            fullWidth
            rows={1}
            value={bodyId}
            rowsMax={2}
            className={classes.textField}
            onChange={this.addNeuronBodyId}
            onKeyDown={this.catchReturn}
          />
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          className={classes.button}
          onClick={this.processIDRequest}
          disabled={!(bodyId.length > 0)}
        >
          Search By Body ID
        </Button>
        <Divider />
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
          color="primary"
          onClick={this.processRoiRequest}
          className={classes.button}
          disabled={!(roiValues.length > 0)}
        >
          Explore By ROI
        </Button>
        <Divider />
        <Button
          variant="contained"
          color="primary"
          disabled={isQuerying}
          className={classes.button}
          onClick={this.processGroupRequest}
        >
          Explore Groups
        </Button>
      </div>
    );
  }
}

FindSimilarNeurons.propTypes = {
  actions: PropTypes.object.isRequired,
  availableROIs: PropTypes.arrayOf(PropTypes.string).isRequired,
  dataSet: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  isQuerying: PropTypes.bool.isRequired
};

export default withRouter(withStyles(styles, { withTheme: true })(FindSimilarNeurons));
