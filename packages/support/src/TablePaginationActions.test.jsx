import React from 'react';
import renderer from 'react-test-renderer';
import TablePaginationActions from './TablePaginationActions';

function doNothing() {}

test('TablePaginationActions shows prev link', () => {
  const component = renderer.create(
    <TablePaginationActions count={50} onChangePage={doNothing} rowsPerPage={5} page={2} />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('TablePaginationActions shows next link', () => {
  const component = renderer.create(
    <TablePaginationActions count={50} onChangePage={doNothing} rowsPerPage={5} page={1} />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('TablePaginationActions shows alternate icons for rtl theme', () => {
  const theme = {
    direction: 'rtl'
  };
  const component = renderer.create(
    <TablePaginationActions
      count={50}
      onChangePage={doNothing}
      rowsPerPage={5}
      page={1}
      theme={theme}
    />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
