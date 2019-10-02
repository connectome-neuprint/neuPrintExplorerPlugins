import React from 'react';
import renderer from 'react-test-renderer';
import ColorBox from '../src/colorbox';

test('ColorBox uses correct color', () => {
  const raw = <ColorBox margin={0} width={10} height={20} backgroundColor='#fff'
        key='foo'
        title='100%'
        text="alt text"
      />

  const component = renderer.create(raw);
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();

});
