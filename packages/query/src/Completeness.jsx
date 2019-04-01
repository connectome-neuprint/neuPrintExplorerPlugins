/*
 * Queries completeness of reconstruction with respect to neuron filters.
 */
import React from 'react';
import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';

import NeuronFilter from './shared/NeuronFilter';

const pluginName = 'Completeness';
const pluginAbbrev = 'co';

class Completeness extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: pluginName,
      abbr: pluginAbbrev,
      category: 'recon',
      experimental: true,
      description:
        'Determines the reconstruction completeness of each ROI with respect to the neuron filters',
      visType: 'SimpleTable'
    };
  }

  static fetchParameters() {
    return {
      queryString: '/npexplorer/completeness'
    };
  }

  static processResults(query, apiResponse) {
    const { pm: parameters } = query;
    const data = apiResponse.data.map(row => [
      row[0], // roiname
      (row[1] / row[3]) * 100, // % pre
      row[3], // total pre
      (row[2] / row[4]) * 100, // % post
      row[4] // total post
    ]);

    return {
      columns: ['ROI', '%presyn', 'total presyn', '%postsyn', 'total postsyn'],
      data,
      debug: apiResponse.debug,
      title: `Coverage percentage of filtered neurons in ${parameters.dataset}`
    };
  }

  static processDownload(response) {
    const headers = ['ROI', '%presyn', 'total presyn', '%postsyn', 'total postsyn'].join(',');
    const data = response.result.data
      .map(
        row =>
          `${row[0]}, ${(row[1] / row[3]) * 100}, ${row[3]}, ${(row[2] / row[4]) * 100}, ${row[4]}`
      )
      .join('\n');
    return [headers, data].join('\n');
  }

  constructor(props) {
    super(props);

    this.state = {
      limitNeurons: true,
      statusFilters: [],
      preThreshold: 0,
      postThreshold: 0
    };
  }

  loadNeuronFilters = params => {
    this.setState({
      limitNeurons: params.limitNeurons,
      statusFilters: params.statusFilters,
      preThreshold: parseInt(params.preThreshold, 10),
      postThreshold: parseInt(params.postThreshold, 10)
    });
  };

  processRequest = () => {
    const { dataSet, submit } = this.props;
    const { limitNeurons, statusFilters, preThreshold, postThreshold } = this.state;

    const parameters = {
      dataset: dataSet,
      statuses: statusFilters,
      all_segments: !limitNeurons
    };

    if (preThreshold > 0) {
      parameters.pre_threshold = preThreshold;
    }

    if (postThreshold > 0) {
      parameters.post_threshold = postThreshold;
    }

    const query = {
      dataSet,
      plugin: pluginName,
      pluginCode: pluginAbbrev,
      parameters
    };
    submit(query);
  };

  render() {
    const { isQuerying, dataSet, actions, neoServerSettings } = this.props;
    return (
      <div>
        <NeuronFilter
          callback={this.loadNeuronFilters}
          datasetstr={dataSet}
          actions={actions}
          neoServer={neoServerSettings.get('neoServer')}
        />
        <Button
          disabled={isQuerying}
          color="primary"
          variant="contained"
          onClick={this.processRequest}
        >
          Submit
        </Button>
      </div>
    );
  }
}

Completeness.propTypes = {
  isQuerying: PropTypes.bool.isRequired,
  neoServerSettings: PropTypes.object.isRequired,
  dataSet: PropTypes.string.isRequired,
  actions: PropTypes.object.isRequired,
  submit: PropTypes.func.isRequired
};

export default Completeness;
