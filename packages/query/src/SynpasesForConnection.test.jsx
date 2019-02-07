import { SynapsesForConnection } from './SynapsesForConnection';

let wrapper;
let button;
let bodyAField;
let bodyBField;
const emptyApiResponse = {
  columns: ['s.type', 's.location.x', 's.location.y', 's.location.z', 's.confidence', 'keys(s)'],
  data: [],
  debug: 'test'
};
const apiResponse = {
  columns: ['s.type', 's.location.x', 's.location.y', 's.location.z', 's.confidence', 'keys(s)'],
  data: [
    [
      'pre',
      1.1,
      2.1,
      3.1,
      0.9839201,
      ['type', 'location', 'timeStamp', 'confidence', 'roi1', 'roi2']
    ],
    ['post', 1.0, 3.0, 3.0, 0.1, ['type', 'location', 'timeStamp', 'confidence']]
  ],
  debug: 'test'
};

const styles = { select: {}, clickable: {} };
const { actions, React, enzyme, renderer } = global;

const neoServerSettings = {
  get: () => 'http://example.com'
};

const component = (
  <SynapsesForConnection
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

describe('synapses for connection Plugin', () => {
  beforeAll(() => {
    wrapper = enzyme.mount(component);
    button = wrapper.find('Button');
    bodyAField = wrapper.find('TextField').at(0);
    bodyBField = wrapper.find('TextField').at(1);
  });
  beforeEach(() => {
    actions.submit.mockClear();
  });
  it('has name and description', () => {
    expect(SynapsesForConnection.queryName).toBeTruthy();
    expect(SynapsesForConnection.queryDescription).toBeTruthy();
  });
  it('renders correctly', () => {
    const pluginView = renderer.create(component).toJSON();
    expect(pluginView).toMatchSnapshot();
  });
  describe('when user clicks submit', () => {
    it('should return a query object with input fields contained in cypher string and should submit', () => {
      bodyAField.props().onChange({ target: { value: '123456' } });
      bodyBField.props().onChange({ target: { value: '645321' } });

      const synapsesForConnectionQuery =
        'MATCH (a:`test-Neuron`{bodyId:123456})<-[:From]-(c:ConnectionSet)-[:To]->(b{bodyId:645321}), (c)-[:Contains]->(s:Synapse) RETURN s.type, s.location.x ,s.location.y ,s.location.z, s.confidence, keys(s)';

      expect(button.props().onClick()).toEqual(
        expect.objectContaining({
          dataSet: 'test',
          cypherQuery: synapsesForConnectionQuery,
          visType: 'SimpleTable',
          plugin: 'SynapsesForConnection',
          parameters: {},
          title: expect.any(String),
          menuColor: expect.any(String),
          processResults: expect.any(Function)
        })
      );
      expect(actions.submit).toHaveBeenCalledTimes(1);
    });
  });

  describe('processes returned results', () => {
    it('should produce error, empty data object if results are empty', () => {
      const processedEmptyResults = wrapper.instance().processResults({}, emptyApiResponse);
      expect(actions.pluginResponseError).toHaveBeenCalledTimes(1);
      expect(processedEmptyResults).toEqual({
        columns: [],
        data: [],
        debug: emptyApiResponse.debug
      });
    });
    it('should produce object with data rows', () => {
      const processedResults = wrapper.instance().processResults({}, apiResponse);
      const { columns, data, debug } = processedResults;
      expect(columns).toEqual(['type', 'location', 'confidence', 'rois']);
      expect(data[0]).toEqual(['pre', '[1.1,2.1,3.1]', 0.9839, ['roi1', 'roi2']]);
      expect(data.length).toBe(2);
      expect(debug).toBe(apiResponse.debug);
    });
  });
});
