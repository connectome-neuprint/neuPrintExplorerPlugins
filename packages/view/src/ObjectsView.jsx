import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';

import NodeTable from './ObjectsView/NodeTable';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  clickable: {
    textDecoration: 'underline',
    color: theme.palette.primary.main,
    cursor: 'pointer',
  },
  scroll: {
    marginTop: theme.spacing(1),
    overflowY: 'auto',
    overflowX: 'auto',
  },
}));

export default function ObjectsView({ query }) {
  const classes = useStyles();

  const { result } = query;

  return (
    <div className={classes.root}>
      <div className={classes.scroll}>
        {result.data.mitochondria && (
          <>
            <p>Mitochondria</p>
            <NodeTable rows={result.data.mitochondria} columns={result.columns.mitochondria} />
          </>
        )}
        {result.data.pre && (
          <>
            <p>Presynaptic Site</p>
            <NodeTable rows={result.data.pre} columns={result.columns.pre} />
          </>
        )}
        {result.data.post && (
          <>
            <p>Postsynaptic Site</p>
            <NodeTable rows={result.data.post} columns={result.columns.post} />
          </>
        )}
      </div>
    </div>
  );
}

ObjectsView.propTypes = {
  query: PropTypes.object.isRequired,
};
