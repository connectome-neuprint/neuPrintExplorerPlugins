import React from 'react';
import renderer from 'react-test-renderer';
import MiniRoiHeatMap from '../lib/miniroiheatmap';

test('MiniRoiHeatMap can render', () => {
  const roiList = ["ME", "VES", "dACA"];
  const roiInfoObject = {
    ME: {
      pre: 21,
      post: 34
    }
  };
  const raw = <MiniRoiHeatMap roiList={roiList} preTotal={21} postTotal={34} roiInfoObject={roiInfoObject} />;
  const component = renderer.create(raw);
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});


