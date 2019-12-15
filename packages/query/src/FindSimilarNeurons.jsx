/*
 * Find similar neurons in a dataset.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import { round } from 'mathjs';
import NeuronRoiHeatMap, { ColorLegend } from '@neuprint/miniroiheatmap';
import {
  setColumnIndices,
  createSimpleConnectionQueryObject,
  generateRoiHeatMapAndBarGraph,
  getBodyIdForTable,
  computeSimilarity,
  getScore
} from './shared/pluginhelpers';

const styles = theme => ({
  textField: {
    margin: 4,
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  formControl: {
    margin: theme.spacing.unit
  },
  select: {
    fontFamily: theme.typography.fontFamily,
    margin: '0.5em 0 1em 0'
  },
  button: {
    margin: 4,
    display: 'block'
  },
  noBodyError: {
    fontSize: '0.9em'
  },
  clickable: {
    cursor: 'pointer'
  }
});

const pluginName = 'FindSimilarNeurons';
const pluginAbbrev = 'fsn';

function createVector(roiMap, roiOrder) {
  let numROIs = Object.keys(roiOrder).length;
  let vector = new Array(numROIs * 2).fill(0);
  for (let roi in roiMap) {
    let roi_sym = roi.replace('(R)', '');
    roi_sym = roi_sym.replace('(L)', '');
    if (roi_sym !== roi) {
      roi_sym += '-sym';
    }
    // only add ROIs in the list
    if (roi_sym in roiOrder) {
      let prespot = roiOrder[roi_sym];
      let postspot = roiOrder[roi_sym] + numROIs;

      // hack to normalize pre to post by 5
      // TODO: get number of actual output connections
      let preval = roiMap[roi].pre || 0;
      vector[prespot] += preval * 5;
      vector[postspot] += roiMap[roi].post || 0;
    }
  }

  // normalize data by apply sigmoid (should probably
  // base this on information from the calling function,
  // current threshold is a hack
  for (let i = 0; i < vector.length; i++) {
    vector[i] = 1 / (1 + Math.exp(-((vector[i] - 150) / 40)));
  }

  return vector;
}

function computeDistance(vec1, vec2) {
  let score = 0;
  for (let i = 0; i < vec1.length; i++) {
    score += Math.pow(vec1[i] - vec2[i], 2);
  }
  return score;
}

function processSimilarResults(query, apiResponse, actions, submit) {
  const { pm: parameters } = query;

  // store processed data
  let data;

  // store the index of the queried body id
  let queriedBodyIdIndex;

  // store super-level rois

  // create vector array (to be used for inputs and outputs)
  let roiOrder = {};
  let spot = 0;
  for (let i = 0; i < parameters.superROIs.length; i++) {
    let roi = parameters.superROIs[i];
    let roi_sym = roi.replace('(R)', '');
    roi_sym = roi_sym.replace('(L)', '');
    if (roi_sym !== roi) {
      roi_sym += '-sym';
    }
    if (!(roi_sym in roiOrder)) {
      roiOrder[roi_sym] = spot;
      spot++;
    }
  }
  roiOrder['None'] = spot;

  // create default array
  let defaultVector = createVector(parameters.roiMapBase, roiOrder);

  const shouldShowSimilarityScores = apiResponse.data.length > 1 && parameters.bodyId;
  const singleResult = apiResponse.data.length === 1 && parameters.bodyId;

  const basicColumns = [
    'bodyId',
    'instance',
    'type',
    'cropped',
    'pre',
    'post',
    'roiBarGraph',
    'roiHeatMap'
  ];
  // column instances
  const columns = [];
  // set basic columns
  let indexOf = setColumnIndices([...basicColumns, 'totalSimScore']);
  columns[indexOf.totalSimScore] = 'total similarity score';

  columns[indexOf.bodyId] = 'bodyId';
  columns[indexOf.instance] = 'instance';
  columns[indexOf.type] = 'type';
  columns[indexOf.cropped] = 'is cropped';
  columns[indexOf.pre] = 'pre';
  columns[indexOf.post] = 'post';
  columns[indexOf.roiBarGraph] = 'brain region breakdown (mouseover for details)';
  columns[indexOf.roiHeatMap] = (
    <div>
      brain region heatmap (mouseover for details) <ColorLegend />
    </div>
  );
  columns[indexOf.subLevelRoiHeatMap] = 'sub-level roi heatmap';

  data = apiResponse.data.map((row, index) => {
    const bodyId = row[0];
    const instance = row[1];
    const type = row[2];
    const iscropped = row[3];
    const totalPre = row[4];
    const totalPost = row[5];
    const roiInfoObject = row[6];

    const converted = [];
    converted[indexOf.bodyId] = getBodyIdForTable(query.pm.dataset, bodyId, true, actions);
    converted[indexOf.instance] = instance;
    converted[indexOf.type] = type;
    converted[indexOf.cropped] = iscropped;
    const postQuery = createSimpleConnectionQueryObject({
      dataSet: parameters.dataset,
      isPost: true,
      queryId: bodyId
    });
    converted[indexOf.post] = {
      value: totalPost,
      action: () => submit(postQuery)
    };

    const preQuery = createSimpleConnectionQueryObject({
      dataSet: parameters.dataset,
      queryId: bodyId
    });
    converted[indexOf.pre] = {
      value: totalPre,
      action: () => submit(preQuery)
    };
    converted[indexOf.roiBarGraph] = ''; // empty unless roiInfoObject present
    converted[indexOf.roiHeatMap] = '';
    converted[indexOf.totalSimScore] = 0;

    // compute sim score from base
    let currVector = createVector(roiInfoObject, roiOrder);
    converted[indexOf.totalSimScore] = computeDistance(defaultVector, currVector);

    if (roiInfoObject) {
      const { heatMap, barGraph } = generateRoiHeatMapAndBarGraph(
        roiInfoObject,
        parameters.superROIs,
        totalPre,
        totalPost
      );
      converted[indexOf.roiHeatMap] = heatMap;
      converted[indexOf.roiBarGraph] = barGraph;
    }

    return converted;
  });

  // sort by total similarity score; queried body id will be 0 so should be at top
  data.sort((a, b) => {
    if (a[indexOf.totalSimScore] < b[indexOf.totalSimScore]) return -1;
    if (a[indexOf.totalSimScore] > b[indexOf.totalSimScore]) return 1;
    return 0;
  });

  let title = `Neurons similar to ${parameters.bodyId}`;

  return {
    columns,
    data,
    debug: apiResponse.debug,
    title
  };
}

export class FindSimilarNeurons extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: 'Find similar neurons',
      abbr: pluginAbbrev,
      description:
        'Find neurons that are similar to a neuron of interest in terms of their input and output locations (Brain Regions).',
      visType: 'SimpleTable'
    };
  }

  static getColumnHeaders(query) {
    const columnIds = [];

    columnIds.push(
      { name: 'bodyId', status: true },
      { name: 'instance', status: true },
      { name: 'type', status: true },
      { name: 'status', status: true },
      { name: 'pre', status: true },
      { name: 'post', status: true },
      { name: 'brain region breakdown', status: true },
      { name: 'brain region heatmap', status: true },
      { name: 'total similarity score', status: true }
    );

    return columnIds;
  }

  static fetchParameters(params) {
    return {};
  }

  static processResults(query, apiResponse, actions, submit) {
    const { pm: parameters } = query;
    return processSimilarResults(query, apiResponse, actions, submit);
  }

  constructor(props) {
    super(props);

    this.state = {
      bodyId: '',
      errorMessage: ''
    };
  }

  submitROIQuery = roiInfo => {
    const { dataSet, superROIs, submit } = this.props;
    const { bodyId } = this.state;

    let superROIsSet = new Set(superROIs);

    let totalin = 0;
    let totalout = 0;
    let roi2count_in = {};
    let roi2count_out = {};

    // create symmetry table -- hard coded to only work with (L) (R) names
    let key2roi = {};
    for (let i = 0; i < superROIs.length; i++) {
      let roi = superROIs[i];
      let roi_sym = roi.replace('(R)', '');
      roi_sym = roi_sym.replace('(L)', '');
      if (roi !== roi_sym) {
        roi_sym += '-sym';
      }
      if (!(roi_sym in key2roi)) {
        key2roi[roi_sym] = [];
      }
      key2roi[roi_sym].push(roi);
    }

    let roiMap = roiInfo[0][0];
    for (const roi in roiMap) {
      if (superROIsSet.has(roi)) {
        let roi_sym = roi.replace('(R)', '');
        roi_sym = roi_sym.replace('(L)', '');
        if (roi !== roi_sym) {
          roi_sym += '-sym';
        }

        if (!(roi_sym in roi2count_in)) {
          roi2count_in[roi_sym] = 0;
        }
        roi2count_in[roi_sym] += roiMap[roi].post || 0;
        totalin += roiMap[roi].post || 0;

        if (!(roi_sym in roi2count_out)) {
          roi2count_out[roi_sym] = 0;
        }
        roi2count_out[roi_sym] += roiMap[roi].pre || 0;
        totalout += roiMap[roi].pre || 0;
      }
    }

    // get the biggest rois to restrict the search
    let rois_in = Object.keys(roi2count_in);
    rois_in.sort(function(a, b) {
      return roi2count_in[b] - roi2count_in[a];
    });

    let rois_out = Object.keys(roi2count_in);
    rois_out.sort(function(a, b) {
      return roi2count_out[b] - roi2count_out[a];
    });

    let bigrois = new Set();

    let count = 0;
    // restrict to the biggest rois (to make the query faster and eliminate obvious no matches
    let thres = 0.7 * totalin;
    for (let i = 0; i < rois_in.length; i++) {
      count += roi2count_in[rois_in[i]];
      bigrois.add(rois_in[i]);
      if (count >= thres) {
        break;
      }
    }
    count = 0;
    // restrict to the biggest rois (to make the query faster and eliminate obvious no matches
    thres = 0.7 * totalout;
    for (let i = 0; i < rois_out.length; i++) {
      count += roi2count_out[rois_out[i]];
      bigrois.add(rois_out[i]);
      if (count >= thres) {
        break;
      }
    }

    let ROIwhere = '';

    let bigroi_arr = Array.from(bigrois);
    for (let i = 0; i < bigroi_arr.length; i++) {
      let roi = bigroi_arr[i];
      if (ROIwhere === '') {
        ROIwhere = 'WHERE ';
      } else {
        ROIwhere += ' AND ';
      }

      if (key2roi[roi].length == 2) {
        ROIwhere += '(n.`' + key2roi[roi][0] + '` OR n.`' + key2roi[roi][1] + '`)';
      } else if (key2roi[roi].length == 1) {
        ROIwhere += 'n.`' + key2roi[roi][0] + '`';
      }
    }

    let cypher =
      `MATCH (n :Neuron {status:"Traced"}) ` +
      ROIwhere +
      ` RETURN n.bodyId, n.instance, n.type, n.cropped, n.pre, n.post, apoc.convert.fromJsonMap(n.roiInfo)`;

    const query = {
      dataSet,
      plugin: pluginName,
      pluginCode: pluginAbbrev,
      parameters: {
        cypherQuery: cypher,
        dataset: dataSet,
        superROIs: superROIs,
        bodyId: bodyId,
        roiMapBase: roiMap
      },
      visProps: {
        rowsPerPage: 25
      }
    };

    submit(query);
  };

  // processing intital request
  processIDRequest = () => {
    const { dataSet } = this.props;
    const { bodyId } = this.state;

    const cypher = `MATCH (n :Neuron {bodyId: ${bodyId}}) RETURN apoc.convert.fromJsonMap(n.roiInfo) AS roiInfo`;

    const parameters = {
      cypher,
      dataset: dataSet
    };

    const queryUrl = '/api/custom/custom';
    const querySettings = {
      headers: {
        'content-type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(parameters),
      credentials: 'include',
      method: 'POST'
    };

    fetch(queryUrl, querySettings)
      .then(result => result.json())
      .then(resp => {
        if (resp.data.length != 1) {
          this.setState({ errorMessage: 'Error: body ' + bodyId + ' not found' });
        } else {
          this.setState({ errorMessage: '' });
          this.submitROIQuery(resp.data);
        }
      })
      .catch(error => {
        this.setState({ errorMessage: 'Unknown error' });
      });
  };

  addNeuronBodyId = event => {
    this.setState({ bodyId: event.target.value });
  };

  catchReturn = event => {
    // submit request if user presses enter
    if (event.keyCode === 13) {
      event.preventDefault();
      this.processIDRequest();
    }
  };

  render() {
    const { classes, superROIs, isQuerying } = this.props;
    const { bodyId, errorMessage } = this.state;

    return (
      <div>
        <FormControl fullWidth className={classes.formControl}>
          <TextField
            label="Neuron ID"
            multiline
            fullWidth
            rows={1}
            value={bodyId}
            rowsMax={2}
            className={classes.textField}
            onChange={this.addNeuronBodyId}
            onKeyDown={this.catchReturn}
          />
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          className={classes.button}
          onClick={this.processIDRequest}
          disabled={!(bodyId.length > 0) || isQuerying}
        >
          Search By Body ID
        </Button>
        {errorMessage !== '' && (
          <Typography color="error" className={classes.noBodyError}>
            {errorMessage}
          </Typography>
        )}
      </div>
    );
  }
}

FindSimilarNeurons.propTypes = {
  submit: PropTypes.func.isRequired,
  superROIs: PropTypes.arrayOf(PropTypes.string).isRequired,
  dataSet: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  isQuerying: PropTypes.bool.isRequired
};

export default withStyles(styles, { withTheme: true })(FindSimilarNeurons);
