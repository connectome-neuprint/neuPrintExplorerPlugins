import { createSimpleConnectionsResult, computeSimilarity } from './pluginhelpers';

const { actions } = global;

describe('createSimpleConnectionsResult', () => {
  it('should return a simple connections query object', () => {
    const query = {
      pm: {},
      dataSet: 'test'
    };
    const apiResponse = {
      columns: [
        'Neuron1',
        'Neuron2',
        'Neuron2Id',
        'Weight',
        'Neuron1Id',
        'Neuron2HasSkeleton',
        'Neuron2Status',
        'Neuron2RoiInfo',
        'Neuron2Size',
        'Neuron2Pre',
        'Neuron2Post',
        'rois'
      ],
      data: [
        [
          'FB-SMP',
          '(iPB)_L',
          5813046674,
          8,
          203253072,
          false,
          'Roughly traced',
          '{"a":{"pre":0,"post":1},"b":{"pre":44,"post":281},"c":{"pre":2,"post":4}}',
          483778179,
          46,
          289,
          ['a', 'b', 'c', 'd']
        ],
        [
          'FB-SMP',
          null,
          204276668,
          8,
          203253072,
          true,
          'Prelim Roughly traced',
          '{"b":{"pre":14,"post":342}}',
          83682381,
          15,
          343,
          ['a', 'b', 'c', 'd']
        ],
        [
          'FB-SMP',
          '(iPB)_L',
          203253253,
          7,
          203253072,
          true,
          'Roughly traced',
          '{"d":{"pre":14,"post":342}}',
          1604911588,
          333,
          2220,
          ['a', 'b', 'c', 'd']
        ]
      ],
      debug: 'testQuery'
    };

    const callback = jest.fn();
    const result = createSimpleConnectionsResult(
      query,
      apiResponse,
      actions,
      'testPlugin',
      callback
    );
    const { columns, data, debug } = result;
    expect(debug).toEqual(apiResponse.debug);
    expect(columns.length).toBe(10);
    expect(data.length).toBe(3);
    expect(data[0].length).toBe(10);
  });
});

describe('computeSimilarity', () => {
  it('should compute similarity between input and output roi vectors', () => {
    const inputVector = [0, 0.4, 0.6, 0, 1, 0]; // order : outputs, inputs
    const queriedVector = [0, 0.4, 0, 1, 0, 0];
    const { inputScore, outputScore, totalScore } = computeSimilarity(inputVector, queriedVector);
    expect(inputScore).toBe(1);
    expect(outputScore).toBe(0.3);
    expect(totalScore).toBe(0.65);
  });
  it('should throw error if inputs are undefined or contain NaN', () => {
    expect(() => {
      computeSimilarity(undefined, [0, 1]);
    }).toThrow();
    expect(() => {
      computeSimilarity([0, 1], undefined);
    }).toThrow();
    expect(() => {
      computeSimilarity([0, NaN], [0, 0]);
    }).toThrow();
    expect(() => {
      computeSimilarity([0, 1], [0, NaN]);
    }).toThrow();
  });
});
