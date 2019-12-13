import React from 'react';
import PropTypes from 'prop-types';
import Sunburst from '@neuprint/react-sunburst';

function processRaw(bodyId, rawData, superROIs) {
  const data = {
    name: bodyId,
    children: [
      {
        name: 'input',
        children: []
      },
      { name: 'output', children: [] }
    ]
  };

  rawData.forEach(row => {
    const [, type = 'none', , roisJSON, status, direction] = row;
    // check that the status is traced
    if (/(traced|leave)/i.test(status)) {
      // check if this is an input or an output
      const dirPosition = direction === 'input' ? 0 : 1;
      const topLevel = data.children[dirPosition];

      // sometimes we get an empty string instead of JSON. Do nothing in those
      // cases.
      if (roisJSON === '') {
        return;
      }

      const rois = JSON.parse(roisJSON);
      // filter to show only super ROIs
      Object.entries(rois)
        .filter(entry => superROIs.includes(entry[0]))
        .forEach(([roiLabel, roiData]) => {
          let roiLevel = topLevel.children.find(el => el.name === roiLabel);
          if (!roiLevel) {
            const roiObject = { name: roiLabel, children: [] };
            topLevel.children.push(roiObject);
            roiLevel = roiObject;
          }

          let typeLevel = roiLevel.children.find(el => el.name === type);
          if (!typeLevel) {
            const typeObject = { name: type, value: 0 };
            roiLevel.children.push(typeObject);
            typeLevel = typeObject;
          }

          typeLevel.value += roiData.post;
        });
    }
  });
  return data;
}

export default function SunburstFormatter(props) {
  const { colors, bodyId, rawData, superROIs } = props;

  const data = processRaw(bodyId, rawData, superROIs);

  return <Sunburst data={data} colors={colors} />;
}

SunburstFormatter.propTypes = {
  colors: PropTypes.arrayOf(PropTypes.string),
  rawData: PropTypes.arrayOf(PropTypes.array).isRequired,
  bodyId: PropTypes.number.isRequired,
  superROIs: PropTypes.arrayOf(PropTypes.string).isRequired,
};

SunburstFormatter.defaultProps = {
  colors: ['#396a9f', '#e2b72f']
};
