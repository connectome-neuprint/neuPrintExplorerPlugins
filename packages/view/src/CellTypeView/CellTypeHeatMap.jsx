import React from 'react';
import PropTypes from 'prop-types';
import HeatMap from '@neuprint/react-heatmap';

function CellTypeHeatMap(props) {
  const { data, median } = props;
  const heatMapData = [];

  data.data.forEach((row, i) => {
    row.forEach((column, j) => {
      // set the initial value to null if the data supplied for the column is 0 before
      // the manipulation has been run over it. This will show it as grey in the heatmap,
      // to indicate that it has no value.
      let value = null;
      if (column !== 0) {
        value = Math.max(0, Math.abs(column - median.data[j]) - Math.sqrt(median.data[j]));
      }
      heatMapData.push({
        column: `${data.columns[j]} (${j})`,
        row: data.index[i],
        value,
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

  const heatMapYLabels = ['median',...data.index];
  const heatMapXLabels = data.columns.map((column, i) => `${column} (${i})`);
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
  data: PropTypes.object.isRequired,
  median: PropTypes.object.isRequired
};

export default CellTypeHeatMap;
