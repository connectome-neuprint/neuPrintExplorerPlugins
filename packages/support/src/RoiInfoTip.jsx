import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from "react-redux";
import Tooltip from '@material-ui/core/Tooltip';

export default function RoiInfoTip(props) {
  const { roi } = props;
  const roiInfo = useSelector(state => state.neo4jsettings.get('roiInfo'));

  let fullName = '';

  if (roiInfo && roiInfo[roi]) {
    fullName = roiInfo[roi].description;
  }

  return(
    <Tooltip title={fullName} placement="right"><span>{roi}</span></Tooltip>
  );
}

RoiInfoTip.propTypes = {
  roi: PropTypes.string.isRequired,
};
