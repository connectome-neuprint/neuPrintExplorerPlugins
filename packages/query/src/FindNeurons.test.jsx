import { FindNeurons } from './FindNeurons';
import { ColorLegend } from './visualization/MiniRoiHeatMap';

let wrapper;
let button;
let textField;
let inputSelect;
let outputSelect;
let limitNeuronsToggle;
let preThresholdField;
let postThresholdField;

const styles = { select: {}, clickable: {} };
const { actions, React, enzyme, renderer } = global;

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
    wrapper = enzyme.mount(component);
    button = wrapper.find('Button');
    textField = wrapper.find('TextField').at(0);
    limitNeuronsToggle = wrapper.find('Switch');
    preThresholdField = wrapper.find('TextField').at(1);
    postThresholdField = wrapper.find('TextField').at(2);
    inputSelect = wrapper.find('Select').at(0);
    outputSelect = wrapper.find('Select').at(1);
  });
  beforeEach(() => {
    actions.submit.mockClear();
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
      expect(actions.submit).toHaveBeenCalledTimes(1);

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
            '{"roiA":{"pre":22,"post":28},"roiB":{"pre":23,"post":31},"roiC":{"pre":45,"post":61}}',
            37325787,
            90,
            120,
            ['roiA', 'roiB', 'roiC'],
            true
          ]
        ],
        columns: [],
        debug: 'test'
      };
      const processedResults = wrapper.instance().processResults(query, apiResponse);
      expect(processedResults).toEqual(
        expect.objectContaining({
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
          data: expect.arrayContaining([]),
          debug: 'test'
        })
      );

      // if no data returned
      const processedResultsEmpty = wrapper.instance().processResults(query, {
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

      // if rois selected should add roi count columns
      const queryWithRoisSelected = {
        dataSet: 'test',
        queryString: '/npexplorer/findneurons',
        visType: 'SimpleTable',
        plugin: 'FindNeurons',
        visProps: { rowsPerPage: 25 },
        parameters: {
          dataset: 'test',
          input_ROIs: ['roiA'],
          output_ROIs: ['roiB'],
          all_segments: false,
          statuses: []
        },
        title: 'Neurons with inputs in [] and outputs in []'
      };
      const processedResultsWithRois = wrapper
        .instance()
        .processResults(queryWithRoisSelected, apiResponse);
      expect(processedResultsWithRois).toEqual(
        expect.objectContaining({
          columns: [
            'id',
            'neuron',
            'status',
            '#post (inputs)',
            '#pre (outputs)',
            'roiA #post',
            'roiA #pre',
            'roiB #post',
            'roiB #pre',
            '#voxels',
            <div>
              roi heatmap <ColorLegend />
            </div>,
            'roi breakdown'
          ],
          data: expect.arrayContaining([]),
          debug: 'test'
        })
      );
    });
  });
  describe('when user hits enter key', () => {
    it('should submit request', () => {
      const processRequest = jest.spyOn(wrapper.instance(), 'processRequest');
      const preventDefault = jest.fn();
      textField.props().onKeyDown({ keyCode: 13, preventDefault });
      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(processRequest).toHaveBeenCalledTimes(1);
      expect(actions.submit).toHaveBeenCalledTimes(1);
    });
  });
  describe('when user inputs text or selects rois', () => {
    it('should change url query string in state', () => {
      actions.setQueryString.mockClear();

      // neuron name input
      textField.props().onChange({ target: { value: 'abc' } });
      expect(actions.setQueryString).toHaveBeenCalledTimes(1);
      expect(actions.getQueryObject('fn').neuronName).toBe('abc');

      // input rois
      inputSelect.props().onChange([{ value: 'roiA' }, { value: 'roiB' }]);
      expect(actions.getQueryObject('fn').inputROIs).toContainEqual('roiA');
      expect(actions.getQueryObject('fn').inputROIs).toContainEqual('roiB');
      expect(actions.getQueryObject('fn').inputROIs.length).toBe(2);
      expect(actions.setQueryString).toHaveBeenCalledTimes(2);

      // output rois
      outputSelect.props().onChange([{ value: 'roiB' }, { value: 'roiC' }]);
      expect(actions.getQueryObject('fn').outputROIs).toContainEqual('roiC');
      expect(actions.getQueryObject('fn').outputROIs).toContainEqual('roiB');
      expect(actions.getQueryObject('fn').outputROIs.length).toBe(2);
      expect(actions.setQueryString).toHaveBeenCalledTimes(3);
    });
  });
});
