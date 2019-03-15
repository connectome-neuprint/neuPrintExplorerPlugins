import React from 'react';
import Icon from '@material-ui/core/Icon';
import * as math from 'mathjs';
import RoiHeatMap, { ColorLegend } from '../visualization/MiniRoiHeatMap';
import RoiBarGraph from '../visualization/MiniRoiBarGraph';
import SelectAndCopyText from './SelectAndCopyText';

/**
 * Launches actions for opening the skeleton viewer and neuroglancer.
 *
 * @param {string} id
 * @param {string} dataset
 * @param {Object} actions
 */
function showSkeleton(id, dataset, actions) {
  actions.neuroglancerAddandOpen(id, dataset);
  actions.skeletonAddandOpen(id, dataset);
}

/**
 * Creates a map of column identifier to column index. Column indices
 * are assigned according to the order in array. For example,
 *
 *  setColumnIndices(["id","name","size"])
 *
 * returns
 *
 *  {id:0, name:1, size:2}
 *
 * @export
 * @param {Array.<string>} propertyNames
 * @returns {Object.<string,number>}
 */
export function setColumnIndices(propertyNames) {
  const indexMap = {};
  propertyNames.forEach((p, index) => {
    indexMap[p] = index;
  });
  return indexMap;
}

/**
 * Produces an roi info object that includes the # of pre and post that
 * are not in the rois in roiList.
 *
 * @param {Object.<string,Object.<string,number>>} roiInfoObject
 * @param {Array.<string>} roiList
 * @param {number} preTotal
 * @param {number} postTotal
 * @returns {Object.<string,Object.<string,number>>}
 */
function getRoiInfoObjectWithNoneCount(roiInfoObject, roiList, preTotal, postTotal) {
  // deep copy roi info object
  const newRoiInfoObject = JSON.parse(JSON.stringify(roiInfoObject));

  // calculate # pre and post in super rois (which are disjoint) to get total
  // number of synapses assigned to an roi
  let postInSuperRois = 0;
  let preInSuperRois = 0;
  Object.keys(newRoiInfoObject).forEach(roi => {
    if (roiList.includes(roi)) {
      preInSuperRois += roiInfoObject[roi].pre;
      postInSuperRois += roiInfoObject[roi].post;
    }
  });

  // add this after the other rois have been summed.
  // records # pre and post that are not in rois
  newRoiInfoObject.none = {
    pre: preTotal - preInSuperRois,
    post: postTotal - postInSuperRois
  };

  return newRoiInfoObject;
}

/**
 * Creates a query object for performing the neuprint simpleconnections query.
 *
 * @export
 * @param {string} dataset
 * @param {boolean} isPost
 * @param {number} bodyId
 * @param {function} callback
 * @param {string} pluginName
 * @returns {Object}
 */
export function createSimpleConnectionQueryObject(dataSet, isPost, bodyId) {
  return {
    dataSet, // <string> for the data set selected
    pluginCode: 'sc',
    parameters: {
      dataSet,
      find_inputs: isPost,
      neuron_id: bodyId
    }
  };
}

/**
 * Generates an roi heat map and bar graph for a neuron.
 *
 * @export
 * @param {Object.<string,Object.<string,number>>} roiInfoObject
 * @param {Array.<string>} roiList
 * @param {number} preTotal
 * @param {number} postTotal
 * @returns {Object.<string,JSX.Element>}
 */
export function generateRoiHeatMapAndBarGraph(roiInfoObject, roiList, preTotal, postTotal) {
  let roiInfoObjectWithNoneCount = roiInfoObject;
  if (!Object.keys(roiInfoObject).includes('none')) {
    roiInfoObjectWithNoneCount = getRoiInfoObjectWithNoneCount(
      roiInfoObject,
      roiList,
      preTotal,
      postTotal
    );
  }

  if (!roiList.includes('none')) {
    roiList.push('none');
  }

  const heatMap = (
    <RoiHeatMap
      roiList={roiList}
      roiInfoObject={roiInfoObjectWithNoneCount}
      preTotal={preTotal}
      postTotal={postTotal}
    />
  );

  const barGraph = (
    <RoiBarGraph
      roiList={roiList}
      roiInfoObject={roiInfoObjectWithNoneCount}
      preTotal={preTotal}
      postTotal={postTotal}
    />
  );

  return { heatMap, barGraph };
}

/**
 * Returns body id in preferred format for table view. Incorporates a view skeleton link.
 *
 * @export
 * @param {string} dataset
 * @param {number} bodyId
 * @param {boolean} hasSkeleton
 * @param {Object} actions
 * @returns {Object}
 */
export function getBodyIdForTable(dataset, bodyId, hasSkeleton, actions) {
  const selectableId = <SelectAndCopyText text={bodyId} actions={actions} />;
  return {
    value: hasSkeleton ? (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row'
        }}
      >
        {selectableId}
        <div style={{ margin: '3px' }} />
        <Icon
          style={{
            cursor: 'pointer'
          }}
          onClick={() => showSkeleton(bodyId, dataset, actions)}
          fontSize="inherit"
        >
          visibility
        </Icon>
      </div>
    ) : (
      selectableId
    ),
    sortBy: bodyId
  };
}

/**
 *
 *
 * @export
 * @param {Array.<number>} vectorA
 * @param {Array.<number>} vectorB
 * @param {number} sumOfVector
 * @param {number} precision
 * @returns
 */
export function getScore(vectorA, vectorB, sumOfVector, precision) {
  return math.round(math.sum(math.abs(math.subtract(vectorA, vectorB))) / sumOfVector, precision);
}

/**
 * Returns similarity scores for two vectors, one for each neuron, representing input/output distribution
 * within ROIs. Distance is defined as sum of absolute differences between the queriedBodyVector and the inputVector.
 * Output contains inputScore, outputScore, and totalScore, which is the average of the two.
 *
 * @export
 * @param {Array.<number>} inputVector
 * @param {Array.<number>} queriedBodyVector
 * @returns {Object.<string,number>}
 */
export function computeSimilarity(inputVector, queriedBodyVector) {
  if (inputVector === undefined) {
    throw new Error('computeSimilarity: inputVector is not defined.');
  }
  if (queriedBodyVector === undefined) {
    throw new Error('computeSimilarity: queriedBodyVector is not defined.');
  }
  inputVector.forEach(v => {
    if (Number.isNaN(v)) {
      throw new Element('computeSimilarity: inputVector contains NaN.');
    }
  });
  queriedBodyVector.forEach(v => {
    if (Number.isNaN(v)) {
      throw new Element('computeSimilarity: queriedBodyVector contains NaN.');
    }
  });

  const totalNumberOfRois = queriedBodyVector.length / 2;
  // input score (pre)
  const inputScore = getScore(
    queriedBodyVector.slice(totalNumberOfRois),
    inputVector.slice(totalNumberOfRois),
    2.0,
    4
  );
  // output score (post)
  const outputScore = getScore(
    queriedBodyVector.slice(0, totalNumberOfRois),
    inputVector.slice(0, totalNumberOfRois),
    2.0,
    4
  );
  // total score
  const totalScore = getScore(queriedBodyVector, inputVector, 4.0, 4);
  return { inputScore, outputScore, totalScore };
}

/**
 * Creates a result for a table view of the simpleconnections query.
 *
 * @export
 * @param {Object} query
 * @param {Object} apiResponse
 * @param {Object} actions
 * @param {function} submit
 * @param {string} pluginName
 * @param {boolean} includeWeightHP // indicates whether or not the table should include high-precision weights
 * @returns {Object}
 */
export function createSimpleConnectionsResult(
  query,
  apiResponse,
  actions,
  submit,
  pluginName,
  includeWeightHP = false
) {
  let columnNames;
  if (includeWeightHP) {
    columnNames = [
      'bodyId',
      'name',
      'status',
      'connectionWeight',
      'connectionWeightHP',
      'post',
      'pre',
      'size',
      'roiHeatMap',
      'roiBarGraph'
    ];
  } else {
    columnNames = [
      'bodyId',
      'name',
      'status',
      'connectionWeight',
      'post',
      'pre',
      'size',
      'roiHeatMap',
      'roiBarGraph'
    ];
  }

  const indexOf = setColumnIndices(columnNames);

  /* eslint-disable prefer-destructuring */
  const data = apiResponse.data.map(row => {
    const hasSkeleton = row[5];
    const roiInfoObject = JSON.parse(row[7]);
    const roiList = row[11];
    const postTotal = row[10];
    const preTotal = row[9];
    const bodyId = row[2];

    // make sure none is added to the rois list.
    roiList.push('none');

    const converted = [];
    if (includeWeightHP) {
      converted[indexOf.connectionWeightHP] = row[12];
    }
    converted[indexOf.bodyId] = getBodyIdForTable(query.dataSet, bodyId, hasSkeleton, actions);
    converted[indexOf.name] = row[1];
    converted[indexOf.status] = row[6];
    converted[indexOf.connectionWeight] = row[3];
    converted[indexOf.size] = row[8];

    const { heatMap, barGraph } = generateRoiHeatMapAndBarGraph(
      roiInfoObject,
      roiList,
      preTotal,
      postTotal
    );
    converted[indexOf.roiHeatMap] = heatMap;
    converted[indexOf.roiBarGraph] = barGraph;

    const postQuery = createSimpleConnectionQueryObject(
      query.dataSet,
      true,
      bodyId,
      pluginName,
      includeWeightHP
    );
    converted[indexOf.post] = {
      value: postTotal,
      action: () => submit(postQuery)
    };

    const preQuery = createSimpleConnectionQueryObject(
      query.dataSet,
      false,
      bodyId,
      pluginName,
      includeWeightHP
    );
    converted[indexOf.pre] = {
      value: preTotal,
      action: () => submit(preQuery)
    };

    return converted;
  });

  const columns = [];
  if (includeWeightHP) {
    columns[indexOf.connectionWeightHP] = '#connections (high-confidence)';
  }
  columns[indexOf.bodyId] = 'id';
  columns[indexOf.name] = 'neuron';
  columns[indexOf.status] = 'status';
  columns[indexOf.connectionWeight] = '#connections';
  columns[indexOf.post] = '#post (inputs)';
  columns[indexOf.pre] = '#pre (outputs)';
  columns[indexOf.size] = '#voxels';
  columns[indexOf.roiHeatMap] = (
    <div>
      roi heatmap <ColorLegend />
    </div>
  );
  columns[indexOf.roiBarGraph] = 'roi breakdown';
  /* eslint-enable prefer-destructuring */

  return {
    columns,
    data,
    debug: apiResponse.debug,
    title: `Connections from bodyID ${query.pm.neuron_id}`
  };
}

export default {
  setColumnIndices,
  createSimpleConnectionQueryObject,
  generateRoiHeatMapAndBarGraph,
  getBodyIdForTable,
  computeSimilarity,
  createSimpleConnectionsResult
};
