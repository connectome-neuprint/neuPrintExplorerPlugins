// import all the plugins
const plugins = require('.');

const abbreviationList = [];

Object.keys(plugins).forEach(plugin => {
  describe(`Testing: ${plugin}`, () => {
    describe('has required functions', () => {
      test('name', () => {
        expect(plugins[plugin].queryName).toBeTruthy();
      });
      test('description', () => {
        expect(plugins[plugin].queryDescription).toBeTruthy();
      });
      test('abbreviation', () => {
        expect(plugins[plugin].queryAbbreviation).toBeTruthy();
        abbreviationList.push(plugins[plugin].queryAbbreviation);
      });
    });
  });
});

describe('unique checks', () => {
  test('name', () => {

  });

  test('abbreviation', () => {
    const unique = [... new Set(abbreviationList)];
    // we should get at least one abbreviation value.
    expect(unique.length).toBeGreaterThan(0);
    // The unique list should be as long as the unfiltered list
    // if the values are all unique
    expect(unique).toHaveLength(abbreviationList.length);
  });
});
