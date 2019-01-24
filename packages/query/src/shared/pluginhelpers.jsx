import React from 'react';
import randomColor from 'randomcolor';
import Icon from '@material-ui/core/Icon';
import * as math from 'mathjs';
import RoiHeatMap, { ColorLegend } from '../visualization/MiniRoiHeatMap';
import RoiBarGraph from '../visualization/MiniRoiBarGraph';

/**
 * Launches actions for opening the skeleton viewer and neuroglancer.
 *
 * @param {string} id
 * @param {string} dataset
 * @param {Object} actions
 */
function showSkeleton(id, dataset, actions) {
  actions.skeletonAddandOpen(id, dataset);
  actions.neuroglancerAddandOpen(id, dataset);
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
export function createSimpleConnectionQueryObject(dataset, isPost, bodyId, callback, pluginName) {
  return {
    dataSet: dataset, // <string> for the data set selected
    queryString: '/npexplorer/simpleconnections', // <neo4jquery string>
    visType: 'SimpleTable', // <string> which visualization plugin to use. Default is 'table'
    plugin: pluginName, // <string> the name of this plugin.
    parameters: {
      dataset,
      find_inputs: isPost,
      neuron_id: bodyId
    },
    title: isPost ? `Connections to bodyID ${bodyId}` : `Connections from bodyID ${bodyId}`,
    menuColor: randomColor({ luminosity: 'light', hue: 'random' }),
    processResults: callback
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
  return {
    value: hasSkeleton ? (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row'
        }}
      >
        {bodyId}
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
      bodyId
    ),
    sortBy: bodyId
  };
}

/**
 * Returns similarity scores for two vectors, one for each neuron, representing input/output distribution
 * within ROIs. Distance is defined as sum of absolute differences between the queriedBodyVector and the inputVector.
 * Output contains inputScore, outputScore, and totalScore, which is the average of the two.
 *
 * @export
 * @param {Array<number>} inputVector
 * @param {Array<number>} queriedBodyVector
 * @param {number} totalNumberOfRois
 * @returns {Object<string,number>}
 */
export function computeSimilarity(inputVector, queriedBodyVector, totalNumberOfRois) {
  if (inputVector === undefined) {
    throw new Error('computeSimilarity: inputVector is not defined.');
  }
  if (queriedBodyVector === undefined) {
    throw new Error('computeSimilarity: queriedBodyVector is not defined.');
  }
  if (totalNumberOfRois === undefined) {
    throw new Error('computeSimilarity: totalNumberOfRois is not defined.');
  }
  // input score (pre)
  const inputScore = math.round(
    math.sum(
      math.abs(
        math.subtract(
          queriedBodyVector.slice(totalNumberOfRois),
          inputVector.slice(totalNumberOfRois)
        )
      )
    ) / 2.0,
    4
  );
  // output score (post)
  const outputScore = math.round(
    math.sum(
      math.abs(
        math.subtract(
          queriedBodyVector.slice(0, totalNumberOfRois),
          inputVector.slice(0, totalNumberOfRois)
        )
      )
    ) / 2.0,
    4
  );
  // total score
  let totalScore = math.round(
    math.sum(math.abs(math.subtract(queriedBodyVector, inputVector))) / 4.0,
    4
  );

  if (Number.isNaN(inputScore) && !Number.isNaN(outputScore)) {
    totalScore = outputScore;
  } else if (Number.isNaN(outputScore) && !Number.isNaN(inputScore)) {
    totalScore = inputScore;
  }

  return { inputScore, outputScore, totalScore };
}

/**
 * Creates a result for a table view of the simpleconnections query.
 *
 * @export
 * @param {Object} query
 * @param {Object} apiResponse
 * @param {Object} actions
 * @param {string} pluginName
 * @param {function} simpleConnectionsCallback
 * @returns {Object}
 */
export function createSimpleConnectionsResult(
  query,
  apiResponse,
  actions,
  pluginName,
  simpleConnectionsCallback
) {
  const indexOf = setColumnIndices([
    'bodyId',
    'name',
    'status',
    'connectionWeight',
    'post',
    'pre',
    'size',
    'roiHeatMap',
    'roiBarGraph'
  ]);

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
      simpleConnectionsCallback,
      pluginName
    );
    converted[indexOf.post] = {
      value: postTotal,
      action: () => actions.submit(postQuery)
    };

    const preQuery = createSimpleConnectionQueryObject(
      query.dataSet,
      false,
      bodyId,
      simpleConnectionsCallback,
      pluginName
    );
    converted[indexOf.pre] = {
      value: preTotal,
      action: () => actions.submit(preQuery)
    };

    return converted;
  });

  const columns = [];
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
