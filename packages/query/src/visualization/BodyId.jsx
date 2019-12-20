import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';
import Modal from '@material-ui/core/Modal';
import { SunburstLoader } from '@neuprint/support';
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
  },
  paper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    height: '85%',
    display:'block',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
    outline: 'none'
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
  const [modal, setModal] = useState(false);
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
        <Icon className={classes.icon} onClick={() => setModal(!modal)} fontSize="inherit">
          donut_small
        </Icon>
      </div>
      <Modal open={modal} onClose={() => setModal(false)}>
        <div className={classes.paper}>
          <SunburstLoader bodyId={children} dataSet={dataSet} />
        </div>
      </Modal>
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
