import React from 'react';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';
import { FindNeurons } from './FindNeurons';
import { ColorLegend } from './visualization/MiniRoiHeatMap';

let wrapper;
let button;
let textField;
let submit;
let inputSelect;
let outputSelect;
let limitNeuronsToggle;
let preThresholdField;
let postThresholdField;

const actions = {
  submit: jest.fn(),
  LoadQueryString: jest.fn((_, initqsParams) => initqsParams),
  setURLQs: jest.fn(),
  SaveQueryString: jest.fn(),
  skeletonAddandOpen: jest.fn(),
  neuroglancerAddandOpen: jest.fn(),
  getQueryString: jest.fn(),
  getQueryObject: jest.fn(() => ({})),
  setQueryString: jest.fn(),
  metaInfoError: jest.fn()
};

const styles = { select: {}, clickable: {} };

const neoServerSettings = {
  get: () => 'http://example.com'
};

const component = (
  <FindNeurons
    availableROIs={['roiA', 'roiB', 'roiC']}
    dataSet="test"
    datasetstr="test"
    actions={actions}
    classes={styles}
    history={{ push: jest.fn() }}
    isQuerying={false}
    neoServerSettings={neoServerSettings}
    urlQueryString=""
    neoServer="testServer"
  />
);

describe('find neurons Plugin', () => {
  beforeAll(() => {
    wrapper = mount(component);
    button = wrapper.find('FindNeurons').find('Button');
    textField = wrapper
      .find('FindNeurons')
      .find('TextField')
      .at(0);
    limitNeuronsToggle = wrapper.find('FindNeurons').find('Switch');
    preThresholdField = wrapper
      .find('FindNeurons')
      .find('TextField')
      .at(1);
    postThresholdField = wrapper
      .find('FindNeurons')
      .find('TextField')
      .at(2);
    submit = jest.spyOn(wrapper.find('FindNeurons').props().actions, 'submit');
    inputSelect = wrapper.find('Select').at(0);
    outputSelect = wrapper.find('Select').at(1);
  });
  beforeEach(() => {
    submit.mockReset();
  });
  it('has name and description', () => {
    expect(FindNeurons.queryName).toBeTruthy();
    expect(FindNeurons.queryDescription).toBeTruthy();
  });
  it('renders correctly', () => {
    const pluginView = renderer.create(component).toJSON();
    expect(pluginView).toMatchSnapshot();
  });
  describe('when user clicks submit', () => {
    it('should return a query object and submit', () => {
      expect(button.props().onClick()).toEqual(
        expect.objectContaining({
          dataSet: 'test',
          queryString: '/npexplorer/findneurons',
          visType: 'SimpleTable',
          visProps: { rowsPerPage: 25 },
          plugin: 'FindNeurons',
          parameters: {
            dataset: 'test',
            input_ROIs: [],
            output_ROIs: [],
            all_segments: false,
            statuses: []
          },
          title: 'Neurons with inputs in [] and outputs in []',
          menuColor: expect.any(String),
          processResults: expect.any(Function)
        })
      );
      expect(submit).toHaveBeenCalledTimes(1);

      // if neuron name/id is present add to parameters
      textField.props().onChange({ target: { value: 'abc' } });
      expect(button.props().onClick()).toEqual(
        expect.objectContaining({
          dataSet: 'test',
          menuColor: expect.any(String),
          parameters: {
            dataset: 'test',
            input_ROIs: [],
            neuron_name: 'abc',
            output_ROIs: [],
            all_segments: false,
            statuses: []
          },
          plugin: 'FindNeurons',
          processResults: expect.any(Function),
          queryString: '/npexplorer/findneurons',
          title: 'Neurons with inputs in [] and outputs in []',
          visProps: { rowsPerPage: 25 },
          visType: 'SimpleTable'
        })
      );
      textField.props().onChange({ target: { value: '123' } });
      expect(button.props().onClick()).toEqual(
        expect.objectContaining({
          dataSet: 'test',
          menuColor: expect.any(String),
          parameters: {
            dataset: 'test',
            input_ROIs: [],
            neuron_id: 123,
            output_ROIs: [],
            all_segments: false,
            statuses: []
          },
          plugin: 'FindNeurons',
          processResults: expect.any(Function),
          queryString: '/npexplorer/findneurons',
          title: 'Neurons with inputs in [] and outputs in []',
          visProps: { rowsPerPage: 25 },
          visType: 'SimpleTable'
        })
      );

      // if input/output rois present add to parameters
      textField.props().onChange({ target: { value: '' } });
      inputSelect.props().onChange([{ value: 'roiA' }]);
      outputSelect.props().onChange([{ value: 'roiB' }]);
      expect(button.props().onClick()).toEqual(
        expect.objectContaining({
          dataSet: 'test',
          menuColor: expect.any(String),
          parameters: {
            dataset: 'test',
            input_ROIs: ['roiA'],
            output_ROIs: ['roiB'],
            all_segments: false,
            statuses: []
          },
          plugin: 'FindNeurons',
          processResults: expect.any(Function),
          queryString: '/npexplorer/findneurons',
          title: 'Neurons with inputs in [roiA] and outputs in [roiB]',
          visProps: { rowsPerPage: 25 },
          visType: 'SimpleTable'
        })
      );

      // if neuron/segment filters present add to parameters
      limitNeuronsToggle.props().onChange();
      preThresholdField.props().onChange({ target: { value: 12 } });
      postThresholdField.props().onChange({ target: { value: 13 } });
      expect(button.props().onClick()).toEqual(
        expect.objectContaining({
          dataSet: 'test',
          menuColor: expect.any(String),
          parameters: {
            dataset: 'test',
            input_ROIs: ['roiA'],
            output_ROIs: ['roiB'],
            all_segments: true,
            pre_threshold: 12,
            post_threshold: 13,
            statuses: []
          },
          plugin: 'FindNeurons',
          processResults: expect.any(Function),
          queryString: '/npexplorer/findneurons',
          title: 'Neurons with inputs in [roiA] and outputs in [roiB]',
          visProps: { rowsPerPage: 25 },
          visType: 'SimpleTable'
        })
      );
    });
    it('should process returned results into data object', () => {
      const query = {
        dataSet: 'test',
        queryString: '/npexplorer/findneurons',
        visType: 'SimpleTable',
        plugin: 'FindNeurons',
        visProps: { rowsPerPage: 25 },
        parameters: {
          dataset: 'test',
          input_ROIs: [],
          output_ROIs: [],
          all_segments: false,
          statuses: []
        },
        title: 'Neurons with inputs in [] and outputs in []'
      };
      const apiResponse = {
        data: [
          [
            1,
            'KC-s',
            'Traced',
            '{"alpha1":{"pre":22,"post":28},"alpha2":{"pre":23,"post":31},"alpha3":{"pre":45,"post":61}}',
            37325787,
            90,
            120,
            ['alpha2', 'alpha3', 'alpha1'],
            true
          ]
        ],
        columns: [
          'id',
          'neuron',
          'status',
          '#post (inputs)',
          '#pre (outputs)',
          '#voxels',
          <div>
            roi heatmap <ColorLegend />
          </div>,
          'roi breakdown'
        ],
        debug: 'test'
      };
      const processedResults = wrapper
        .find('FindNeurons')
        .instance()
        .processResults(query, apiResponse);
      expect(processedResults).toEqual(
        expect.objectContaining({
          columns: apiResponse.columns,
          data: expect.arrayContaining([]),
          debug: 'test'
        })
      );

      // if no data returned
      const processedResultsEmpty = wrapper
        .find('FindNeurons')
        .instance()
        .processResults(query, {
          columns: [],
          data: [],
          debug: 'test'
        });
      expect(processedResultsEmpty).toEqual({
        columns: [
          'id',
          'neuron',
          'status',
          '#post (inputs)',
          '#pre (outputs)',
          '#voxels',
          <div>
            roi heatmap <ColorLegend />
          </div>,
          'roi breakdown'
        ],
        data: [],
        debug: 'test'
      });
    });
  });
  describe('when user hits enter key', () => {
    it('should submit request', () => {
      const processRequest = jest.spyOn(wrapper.find('FindNeurons').instance(), 'processRequest');
      const preventDefault = jest.fn();
      textField.props().onKeyDown({ keyCode: 13, preventDefault });
      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(processRequest).toHaveBeenCalledTimes(1);
      expect(submit).toHaveBeenCalledTimes(1);
    });
  });
  describe('when user inputs text or selects rois', () => {
    it('should change url query string in state', () => {
      const setUrlQs = jest.spyOn(wrapper.find('FindNeurons').props().actions, 'setURLQs');
      setUrlQs.mockReset();
      // neuron name input
      textField.props().onChange({ target: { value: 'abc' } });
      expect(wrapper.find('FindNeurons').state('qsParams').neuronName).toBe('abc');
      expect(setUrlQs).toHaveBeenCalledTimes(1);

      // input rois
      inputSelect.props().onChange([{ value: 'roiA' }, { value: 'roiB' }]);
      expect(wrapper.find('FindNeurons').state('qsParams').inputROIs).toContainEqual('roiA');
      expect(wrapper.find('FindNeurons').state('qsParams').inputROIs).toContainEqual('roiB');
      expect(wrapper.find('FindNeurons').state('qsParams').inputROIs.length).toBe(2);
      expect(setUrlQs).toHaveBeenCalledTimes(2);

      // output rois
      outputSelect.props().onChange([{ value: 'roiB' }, { value: 'roiC' }]);
      expect(wrapper.find('FindNeurons').state('qsParams').outputROIs).toContainEqual('roiC');
      expect(wrapper.find('FindNeurons').state('qsParams').outputROIs).toContainEqual('roiB');
      expect(wrapper.find('FindNeurons').state('qsParams').outputROIs.length).toBe(2);
      expect(setUrlQs).toHaveBeenCalledTimes(3);
    });
  });
  describe('when selected dataset changes', () => {
    it('should clear selected rois', () => {
      inputSelect.props().onChange([{ value: 'roiA' }, { value: 'roiB' }]);
      outputSelect.props().onChange([{ value: 'roiB' }, { value: 'roiC' }]);
      textField.props().onChange({ target: { value: 'abc' } });

      wrapper.setProps({ dataSet: 'new' });

      expect(wrapper.props().dataSet).toBe('new');
      expect(wrapper.state('qsParams').inputROIs.length).toBe(0);
      expect(wrapper.state('qsParams').outputROIs.length).toBe(0);
      // input text does not change
      expect(wrapper.state('qsParams').neuronName).toBe('abc');
    });
  });
});
