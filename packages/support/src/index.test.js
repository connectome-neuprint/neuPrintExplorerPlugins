import { sortRois, metaInfoError } from '.';

const ROIList = [
  '123',
  'foo',
  'foo',
  'bar',
  '123',
  '12bar',
  'foo'
];
const ROIList2 = [
  'foo',
  'bar',
  '123',
  '12bar'
]
test('ROIs correctly sorted by sortRois', () => {
  expect(ROIList.sort(sortRois)).toEqual(["bar", "foo", "foo", "foo", "123", "123", "12bar"]);
  expect(ROIList2.sort(sortRois)).toEqual(["bar", "foo", "123", "12bar"]);
});

const errorMessage = 'the wheels fell off';
test('metaInfoError returns correct redux object', () => {
  expect(metaInfoError(errorMessage)).toEqual({
    type: 'META_INFO_ERROR',
    error: errorMessage
  });
});
