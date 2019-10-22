import React from 'react';
import * as math from 'mathjs';
import NeuronRoiHeatMap, { ColorLegend } from '@neuprint/miniroiheatmap';
import NeuronRoiBarGraph from '@neuprint/miniroibargraph';
import { SimpleConnections } from '../SimpleConnections';
import BodyId from '../visualization/BodyId';

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
  return {
    value: (
      <BodyId dataSet={dataset} actions={actions}>
        {bodyId}
      </BodyId>
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
  const cypher = `MATCH (n:ConnectionSet{datasetBodyIds:"${dataset}:${bodyIdA}:${bodyIdB}"}) RETURN n.roiInfo`;
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
 * @param {boolean} combinedType // indicates whether to combine all rows based on their type.
 * @returns {Object}
 */
// TODO: explicitly pass required actions to prevent future bugs
export function createSimpleConnectionsResult(
  dataset,
  apiResponse,
  actions,
  submit,
  isInputs,
  includeWeightHP = false,
  combinedType = true
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

  // Get the total number of connections, by running a reduce over the
  // data array.
  // TODO: Probably should have total for high confidence as well.
  const totalConnections = apiResponse.data.reduce((acc, row) => acc + row[5], 0);

  // TODO: Need to combine all the rows that share the same type, if the combinedType
  // option is selected. This will be an issue for the roiInfoObjectJSON, so a simple
  // reducer probably wont work.
  let combined = [];
  if (combinedType) {
    const combinedLookup = {};
    apiResponse.data.forEach(row => {
      // get the type
      const type = row[3];
      // add all values to the existing lookup
      combinedLookup[type] = row;
      // What do we do with the JSON?
    });
    combined = Object.values(combinedLookup);
  } else {
    combined = apiResponse.data;
  }
  // combined = apiResponse.data;

  const data = combined.map(row => {
    const [
      ,
      ,
      name,
      type,
      bodyId,
      connectionWeight,
      bodyIdQueried,
      status,
      roiInfoObjectJSON,
      size,
      preTotal,
      postTotal,
      roiList,
      connectionWeightHP
    ] = row;
    const hasSkeleton = true;
    const roiInfoObject = JSON.parse(roiInfoObjectJSON) || {};

    // make sure none is added to the rois list.
    roiList.push('none');

    const converted = [];
    if (includeWeightHP) {
      converted[indexOf.connectionWeightHP] = connectionWeightHP;
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

    const connectionPercentage = ((connectionWeight * 100) / totalConnections).toFixed(2);

    converted[indexOf.bodyId] = getBodyIdForTable(dataset, bodyId, hasSkeleton, actions);
    converted[indexOf.name] = name;
    converted[indexOf.type] = type;
    converted[indexOf.status] = status;
    converted[indexOf.connectionWeight] = {
      value: `${connectionWeight} (${connectionPercentage}%)`,
      sortBy: connectionWeight
    };
    converted[indexOf.size] = size;

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

    // put the queried id at the beginning of the column so that we can use
    // it for later filtering/sorting
    converted.unshift(bodyIdQueried);

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
  columns[indexOf.connectionWeight] = '#connections (% of total)';
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
