import React from 'react';
import randomColor from 'randomcolor';
import Icon from '@material-ui/core/Icon';
import RoiHeatMap from './visualization/MiniRoiHeatMap';
import RoiBarGraph from './visualization/MiniRoiBarGraph';

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
  const roiInfoObjectWithNoneCount = getRoiInfoObjectWithNoneCount(
    roiInfoObject,
    roiList,
    preTotal,
    postTotal
  );

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
 * @param {Object} clickableClass
 * @param {function} skeletonHandler
 * @returns
 */
export function getBodyIdForTable(dataset, bodyId, hasSkeleton, skeletonHandler) {
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
          onClick={skeletonHandler(bodyId, dataset)}
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

export default {
  setColumnIndices,
  createSimpleConnectionQueryObject,
  generateRoiHeatMapAndBarGraph,
  getBodyIdForTable
};

