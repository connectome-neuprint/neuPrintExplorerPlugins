import React from 'react';
import PropTypes from 'prop-types';
import HeatMap from '@neuprint/react-heatmap';

function CellTypeHeatMap(props) {
  const { data, median, neuronInfo } = props;
  const heatMapData = [];

  data.data.forEach((row, i) => {
    row.forEach((column, j) => {
      heatMapData.push({
        column: `${data.columns[j]} (${j})`,
        row: data.index[i],
        value: column
      });
    });
  });

  median.data.forEach((column, i) => {
    heatMapData.unshift({
      // can't just use the value at the index as the column header as there are multiple
      // columns with the same name. Current fix is to add the column index to make sure
      // they are all unique.
      column: `${median.index[i]} (${i})`,
      row: 'median',
      value: 0,
      label: `${column[0]}`,
      // force the labels to show. This column only has value if the label numbers
      // are shown, because all the values are set to zero.
      forceLabel: true
    });
  });

  const colorAssignedLabels = data.index.map(label => {
    if (!neuronInfo[label].reference) {
      return [label, '#ef5350'];
    }
    return label;
  });

  const heatMapYLabels = ['median', ...colorAssignedLabels];
  const heatMapXLabels = data.columns.map((column, i) => `${column} (${i})`);
  const heatMapHeight = data.index.length * 35 + 150;
  const heatMapWidth = data.columns.length * 35 + 150;

  return (
    <HeatMap
      data={heatMapData}
      xLabels={heatMapXLabels}
      yLabels={heatMapYLabels}
      height={heatMapHeight}
      width={heatMapWidth}
      maxColor="#396a9f"
      maxWidthOn={false}
    />
  );
}

CellTypeHeatMap.propTypes = {
  data: PropTypes.object.isRequired,
  median: PropTypes.object.isRequired,
  neuronInfo: PropTypes.object.isRequired
};

export default CellTypeHeatMap;
