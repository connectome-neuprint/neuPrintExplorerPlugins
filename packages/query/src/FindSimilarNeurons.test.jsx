import { FindSimilarNeurons } from './FindSimilarNeurons';

const styles = { select: {}, clickable: {} };
const { actions, React, enzyme, renderer } = global;

let wrapper;
let bodyIdButton;
let bodyIdField;
let roiButton;
let roiSelect;
let groupsButton;

const neoServerSettings = {
  get: () => 'http://example.com'
};

const component = (
  <FindSimilarNeurons
    availableROIs={['roiA', 'roiB', 'roiC']}
    dataSet="test"
    datasetstr="test"
    actions={actions}
    classes={styles}
    history={{ push: jest.fn() }}
    isQuerying={false}
    neoServerSettings={neoServerSettings}
    neoServer="testServer"
  />
);
describe('find similar neurons Plugin', () => {
  beforeAll(() => {
    wrapper = enzyme.mount(component);
    bodyIdButton = wrapper.find('Button').at(0);
    bodyIdField = wrapper.find('TextField');
    roiButton = wrapper.find('Button').at(1);
    roiSelect = wrapper.find('Select');
    groupsButton = wrapper.find('Button').at(2);
  });
  beforeEach(() => {
    actions.submit.mockClear();
  });
  it('has name and description', () => {
    expect(FindSimilarNeurons.queryName).toBeTruthy();
    expect(FindSimilarNeurons.queryDescription).toBeTruthy();
  });
  it('renders correctly', () => {
    const pluginView = renderer.create(component).toJSON();
    expect(pluginView).toMatchSnapshot();
  });
  describe('when user hits enter key below body id field', () => {
    it('should submit request', () => {
      const processRequest = jest.spyOn(wrapper.instance(), 'processIDRequest');
      const preventDefault = jest.fn();
      bodyIdField.props().onKeyDown({ keyCode: 13, preventDefault });
      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(processRequest).toHaveBeenCalledTimes(1);
      expect(actions.submit).toHaveBeenCalledTimes(1);
    });
  });
  describe('when user clicks submit', () => {
    it('should return a query object and submit', () => {
      // input a body id
      const bodyId = 122;
      bodyIdField.props().onChange({ target: { value: bodyId } });
      expect(bodyIdButton.props().onClick()).toEqual(
        expect.objectContaining({
          dataSet: 'test',
          cypherQuery: expect.any(String),
          visType: 'SimpleTable',
          visProps: { rowsPerPage: 25 },
          plugin: 'FindSimilarNeurons',
          parameters: {
            dataset: 'test',
            bodyId,
            emptyDataErrorMessage: 'Body ID not found in dataset.'
          },
          title: `Neurons similar to ${bodyId}`,
          menuColor: expect.any(String),
          processResults: expect.any(Function)
        })
      );
      expect(actions.submit).toHaveBeenCalledTimes(1);

      const rois = ['roiA', 'roiB'];
      roiSelect.props().onChange([{ value: 'roiA' }, { value: 'roiB' }]);
      expect(roiButton.props().onClick()).toEqual(
        expect.objectContaining({
          dataSet: 'test',
          cypherQuery: expect.any(String),
          visType: 'SimpleTable',
          visProps: { rowsPerPage: 25 },
          plugin: 'FindSimilarNeurons',
          parameters: {
            dataset: 'test',
            rois,
            emptyDataErrorMessage: `No neurons located in all selected rois: ${rois}`
          },
          title: `Neurons in ${rois}`,
          menuColor: expect.any(String),
          processResults: expect.any(Function)
        })
      );
      expect(actions.submit).toHaveBeenCalledTimes(2);

      expect(groupsButton.props().onClick()).toEqual(
        expect.objectContaining({
          dataSet: 'test',
          cypherQuery: expect.any(String),
          visType: 'SimpleTable',
          visProps: { rowsPerPage: 25 },
          plugin: 'FindSimilarNeurons',
          parameters: {
            dataset: 'test'
          },
          title: `Cluster names for test dataset`,
          menuColor: expect.any(String),
          processResults: expect.any(Function)
        })
      );
      expect(actions.submit).toHaveBeenCalledTimes(3);
    });

    it('should process returned results into tabular data', () => {
      const queryOneNeuron = {
        parameters: {
          dataset: 'test',
          bodyId: 123,
          emptyDataErrorMessage: 'Body ID not found in dataset.'
        }
      };

      // single result with sub-rois
      const apiResponseOneNeuron = {
        columns: [],
        data: [
          [
            123,
            'name1',
            'status1',
            1000,
            2000,
            '{"roiA":{"pre":100,"post":200},"roiB":{"pre":300,"post":200}}',
            ['roiA'],
            'cluster1',
            true
          ]
        ]
      };
      let processedResults = wrapper
        .instance()
        .processSimilarResults(queryOneNeuron, apiResponseOneNeuron);
      expect(processedResults.data[0].length).toBe(12);
      expect(processedResults.columns.length).toBe(12);
      expect(processedResults.data[0].slice(8, 12)).toEqual([0, 0, 0, 0]);

      // single result without sub-rois
      const apiResponseOneNeuronNoSub = {
        columns: [],
        data: [
          [
            123,
            'name1',
            'status1',
            1000,
            2000,
            '{"roiA":{"pre":100,"post":200},"roiB":{"pre":300,"post":200}}',
            ['roiA', 'roiB'],
            'cluster1',
            true
          ]
        ]
      };
      processedResults = wrapper
        .instance()
        .processSimilarResults(queryOneNeuron, apiResponseOneNeuronNoSub);
      expect(processedResults.data[0].length).toBe(11);
      expect(processedResults.data[0][7]).toEqual('N/A');
      expect(processedResults.columns.length).toBe(11);

      const queryMultNeurons = {
        parameters: {
          dataset: 'test',
          bodyId: 456,
          emptyDataErrorMessage: 'Body ID not found in dataset.'
        }
      };

      // multiple result with sub-rois
      const apiResponseMultNeurons = {
        columns: [],
        data: [
          [
            123,
            'name1',
            'status1',
            1000,
            2000,
            '{"roiA":{"pre":100,"post":200},"roiB":{"pre":300,"post":200}}',
            ['roiA'],
            'cluster1',
            true
          ],
          [
            456,
            'name2',
            'status1',
            3000,
            4000,
            '{"roiA":{"pre":105,"post":2000},"roiB":{"pre":301,"post":20}}',
            ['roiA'],
            'cluster1',
            true
          ]
        ]
      };
      processedResults = wrapper
        .instance()
        .processSimilarResults(queryMultNeurons, apiResponseMultNeurons);
      expect(processedResults.data[0].length).toBe(12);
      expect(processedResults.data[0][0].sortBy).toBe(456);
      expect(processedResults.data.length).toBe(2);
      expect(processedResults.columns.length).toBe(12);

      // multiple result without sub-rois
      const apiResponseMultNeuronsNoSub = {
        columns: [],
        data: [
          [
            123,
            'name1',
            'status1',
            1000,
            2000,
            '{"roiA":{"pre":100,"post":200},"roiB":{"pre":300,"post":200}}',
            ['roiA', 'roiB'],
            'cluster1',
            true
          ],
          [
            456,
            'name2',
            'status1',
            3000,
            4000,
            '{"roiA":{"pre":105,"post":2000},"roiB":{"pre":301,"post":20}}',
            ['roiA', 'roiB'],
            'cluster1',
            true
          ]
        ]
      };
      processedResults = wrapper
        .instance()
        .processSimilarResults(queryMultNeurons, apiResponseMultNeuronsNoSub);
      expect(processedResults.data[0].length).toBe(11);
      expect(processedResults.data[0][0].sortBy).toBe(456);
      expect(processedResults.data.length).toBe(2);
      expect(processedResults.columns.length).toBe(11);

      // roi result with sub-rois
      const queryRoi = {
        parameters: {
          dataset: 'test',
          rois: ['roiA']
        }
      };
      processedResults = wrapper.instance().processSimilarResults(queryRoi, apiResponseMultNeurons);
      expect(processedResults.data[0].length).toBe(12);
      expect(processedResults.data[0][0].sortBy).toBe(123);
      expect(processedResults.data.length).toBe(2);
      expect(processedResults.columns.length).toBe(12);

      // roi result without sub-rois
      processedResults = wrapper
        .instance()
        .processSimilarResults(queryRoi, apiResponseMultNeuronsNoSub);
      expect(processedResults.data[0].length).toBe(11);
      expect(processedResults.data[0][0].sortBy).toBe(123);
      expect(processedResults.data.length).toBe(2);
      expect(processedResults.columns.length).toBe(11);

      // cluster query results with sub-rois
      const queryGroup = {
        parameters: {
          dataset: 'test'
        }
      };
      processedResults = wrapper
        .instance()
        .processSimilarResults(queryGroup, apiResponseMultNeurons);
      expect(processedResults.data[0].length).toBe(12);
      expect(processedResults.data[0][0].sortBy).toBe(123);
      expect(processedResults.data.length).toBe(2);
      expect(processedResults.columns.length).toBe(12);

      // cluster query results without sub-rois
      processedResults = wrapper
        .instance()
        .processSimilarResults(queryGroup, apiResponseMultNeuronsNoSub);
      expect(processedResults.data[0].length).toBe(11);
      expect(processedResults.data[0][0].sortBy).toBe(123);
      expect(processedResults.data.length).toBe(2);
      expect(processedResults.columns.length).toBe(11);

      // no results
      processedResults = wrapper.instance().processSimilarResults({ parameters: {} }, { data: [] });
      expect(processedResults.data.length).toBe(0);
      expect(processedResults.columns.length).toBe(0);

      // cluster name results
      processedResults = wrapper
        .instance()
        .processGroupResults({ parameters: { dataset: 'test' } }, { data: ['a', 'b', 'c'] });
      expect(processedResults.data.length).toBe(3);

      // no cluster names
      processedResults = wrapper
        .instance()
        .processGroupResults({ parameters: { dataset: 'test' } }, { data: [] });
      expect(processedResults.data.length).toBe(0);
    });
  });
});
