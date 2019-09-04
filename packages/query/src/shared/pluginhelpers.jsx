import React from 'react';
import Icon from '@material-ui/core/Icon';
import * as math from 'mathjs';
import NeuronRoiHeatMap, { ColorLegend } from '../visualization/MiniRoiHeatMap';
import NeuronRoiBarGraph from '../visualization/MiniRoiBarGraph';
import SelectAndCopyText from './SelectAndCopyText';
import { SimpleConnections } from '../SimpleConnections';

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
 * @returns {Object}
 */
export function createSimpleConnectionQueryObject(dataSet, isPost, bodyId) {
  return {
    dataSet, // <string> for the data set selected
    pluginCode: SimpleConnections.details.abbr,
    pluginName: SimpleConnections.details.name,
    visProps: { paginateExpansion: true },
    parameters: {
      dataset: dataSet,
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
    <NeuronRoiHeatMap
      roiList={roiList}
      roiInfoObject={roiInfoObjectWithNoneCount}
      preTotal={preTotal}
      postTotal={postTotal}
    />
  );

  const barGraph = (
    <NeuronRoiBarGraph
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

function createConnectionDetailQueryObject(dataset, bodyIdA, bodyIdB, connectionWeight, roiList) {
  const cypher = `MATCH (n:\`${dataset}-ConnectionSet\`{datasetBodyIds:"${dataset}:${bodyIdA}:${bodyIdB}"}) RETURN n.roiInfo`;
  return {
    bodyIdA,
    bodyIdB,
    connectionWeight,
    roiList,
    cypher,
    dataset
  };
}

/**
 * Creates a result for a table view of the simpleconnections query.
 *
 * @export
 * @param {string} dataset
 * @param {Object} apiResponse
 * @param {Object} actions
 * @param {function} submit
 * @param {boolean} isInputs // indicates whether or not this is a list of inputs to the queried neuron
 * @param {boolean} includeWeightHP // indicates whether or not the table should include high-precision weights
 * @returns {Object}
 */
// TODO: explicitly pass required actions to prevent future bugs
export function createSimpleConnectionsResult(
  dataset,
  apiResponse,
  actions,
  submit,
  isInputs,
  includeWeightHP = false
) {
  let columnNames;

  if (includeWeightHP) {
    columnNames = [
      'expand',
      'bodyId',
      'type',
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
      'expand',
      'bodyId',
      'type',
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
    const bodyIdQueried = row[6];
    const hasSkeleton = true;
    const roiInfoObject = JSON.parse(row[8]) || {};
    const roiList = row[12];
    const postTotal = row[11];
    const preTotal = row[10];
    const bodyId = row[4];
    const connectionWeight = row[5];

    // make sure none is added to the rois list.
    roiList.push('none');

    const converted = [];
    if (includeWeightHP) {
      converted[indexOf.connectionWeightHP] = row[13];
    }

    if (isInputs) {
      converted[indexOf.expand] = createConnectionDetailQueryObject(
        dataset,
        bodyId,
        bodyIdQueried,
        connectionWeight,
        roiList
      );
    } else {
      converted[indexOf.expand] = createConnectionDetailQueryObject(
        dataset,
        bodyIdQueried,
        bodyId,
        connectionWeight,
        roiList
      );
    }

    converted[indexOf.bodyId] = getBodyIdForTable(dataset, bodyId, hasSkeleton, actions);
    converted[indexOf.name] = row[2];
    converted[indexOf.type] = row[3];
    converted[indexOf.status] = row[7];
    converted[indexOf.connectionWeight] = connectionWeight;
    converted[indexOf.size] = row[9];

    const { heatMap, barGraph } = generateRoiHeatMapAndBarGraph(
      roiInfoObject,
      roiList,
      preTotal,
      postTotal
    );
    converted[indexOf.roiHeatMap] = heatMap;
    converted[indexOf.roiBarGraph] = barGraph;

    const postQuery = createSimpleConnectionQueryObject(dataset, true, bodyId, includeWeightHP);
    converted[indexOf.post] = {
      value: postTotal,
      action: () => submit(postQuery)
    };

    const preQuery = createSimpleConnectionQueryObject(dataset, false, bodyId, includeWeightHP);
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
  columns[indexOf.type] = 'type';
  columns[indexOf.name] = 'instance';
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
    debug: apiResponse.debug
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
