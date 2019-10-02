import React from 'react';
import renderer from 'react-test-renderer';
import MiniRoiBarGraph from './MiniRoiBarGraph';

test('MiniRoiBarGraph can render', () => {
  const roiList = ["ME", "VES", "dACA"];
  const roiInfoObject = {
    ME: {
      pre: 21,
      post: 34
    }
  };
  const raw = <MiniRoiBarGraph roiList={roiList} preTotal={21} postTotal={34} roiInfoObject={roiInfoObject} />;
  const component = renderer.create(raw);
  const tree = component.toJSON();
  console.log(tree);
  expect(tree).toMatchSnapshot();
});


