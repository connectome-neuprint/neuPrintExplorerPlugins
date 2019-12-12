import React from 'react';
import PropTypes from 'prop-types';
import HeatMap from '@neuprint/react-heatmap';

function CellTypeHeatMap(props) {
  const { data } = props;
  const heatMapData = [];

  data.data.forEach((row, i) => {
    row.forEach((column, j) => {
      heatMapData.push({
        column: data.columns[j],
        row: data.index[i],
        value: column
      });
    });
  });

  const heatMapYLabels = data.index;
  const heatMapXLabels = data.columns;
  const heatMapHeight = data.index.length * 15 + 150;
  const heatMapWidth = data.columns.length * 15 + 150;

  return (
    <HeatMap
      data={heatMapData}
      xLabels={heatMapXLabels}
      yLabels={heatMapYLabels}
      height={heatMapHeight}
      width={heatMapWidth}
      maxColor="#396a9f"
    />
  );
}

CellTypeHeatMap.propTypes = {
  data: PropTypes.object.isRequired
};

export default CellTypeHeatMap;
