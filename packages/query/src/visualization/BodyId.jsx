import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';
import SelectAndCopyText from '../shared/SelectAndCopyText';

const styles = theme => ({
  icon: {
    marginLeft: '3px',
    cursor: 'pointer',
    color: theme.palette.primary.main
  },
  container: {
    display: 'flex',
    flexDirection: 'row'
  }
});

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

function BodyId(props) {
  const { children, dataSet, actions, classes } = props;
  return (
    <div>
      <div className={classes.container}>
        <SelectAndCopyText text={children} actions={actions} />
        <Icon
          className={classes.icon}
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
  actions: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(BodyId);
