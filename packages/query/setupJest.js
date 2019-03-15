/* eslint-disable import/no-extraneous-dependencies */
import Adapter from 'enzyme-adapter-react-16';
import merge from 'deepmerge';
import React from 'react';
import enzyme from 'enzyme';
import renderer from 'react-test-renderer';

global.fetch = require('jest-fetch-mock');

global.React = React;
global.enzyme = enzyme;
global.renderer = renderer;

enzyme.configure({ adapter: new Adapter() });

global.queryStringObject = {};
const overwriteMerge = (destinationArray, sourceArray) => sourceArray;

// these should match actions available in QueryForm.jsx in neuPrintExplorer
global.actions = {
  submit: jest.fn(),
  skeletonAddandOpen: jest.fn(),
  neuroglancerAddandOpen: jest.fn(),
  formError: jest.fn(),
  metaInfoError: jest.fn(),
  pluginResponseError: jest.fn(),
  getQueryString: jest.fn(),
  getSiteParams: jest.fn(),
  setQueryString: jest.fn(newData => {
    global.queryStringObject = merge(global.queryStringObject, newData, {
      arrayMerge: overwriteMerge
    });
  }),
  getQueryObject: jest.fn(plugin => {
    let queryObject = global.queryStringObject;
    if (plugin) {
      queryObject = queryObject[plugin];
    }
    return queryObject || {};
  })
};

global.submit = jest.fn();
