import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@material-ui/core/Icon';
import SelectAndCopyText from '../shared/SelectAndCopyText';

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

function BodyId (props) {
  const { children, dataSet, actions } = props;
  return (
    <div>
     <div
        style={{
          display: 'flex',
          flexDirection: 'row'
        }}
      >

        <SelectAndCopyText text={children} actions={actions} />
        <Icon
          style={{
            marginLeft: '3px',
            cursor: 'pointer'
          }}
          onClick={() => showSkeleton(children, dataSet, actions)}
          fontSize="inherit"
        >
          visibility
        </Icon>
      </div>
    </div>
  );
}


BodyId.propTypes = {
  children: PropTypes.number.isRequired,
  dataSet: PropTypes.string.isRequired,
  actions: PropTypes.object.isRequired
};

export default BodyId;
