/*
 * Query to find autapses in the volume.
 */
import React from 'react';
import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';

const pluginName = 'Autapses';
const pluginAbbrev = 'au';

const columnHeaders = ['id', 'name', '#connections'];

class Autapses extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: pluginName,
      abbr: pluginAbbrev,
      experimental: true,
      category: 'recon',
      description: 'Finds all the self connections (loops) in the dataset.',
      visType: 'SimpleTable'
    };
  }

  static fetchParameters() {
    return {
      queryString: '/npexplorer/autapses'
    };
  }

  static processResults(query, apiResponse) {
    const data = apiResponse.data.map(row => [row[0], row[2], row[1]]);

    return {
      columns: columnHeaders,
      data,
      debug: apiResponse.debug,
      title: `Number of autapses recorded for each neuron in ${query.pm.dataset}`
    };
  }

  static processDownload(response) {
    const headers = columnHeaders.join(',');
    const data = response.result.data.map(row => `${row[0]}, ${row[2]}, ${row[1]}`).join('\n');
    return [headers, data].join('\n');
  }

  // creates query object and sends to callback
  processRequest = () => {
    const { dataSet, submit } = this.props;
    const query = {
      dataSet,
      plugin: pluginName,
      pluginCode: pluginAbbrev,
      parameters: { dataset: dataSet }
    };
    submit(query);
  };

  render() {
    const { isQuerying } = this.props;
    return (
      <Button
        disabled={isQuerying}
        color="primary"
        variant="contained"
        onClick={this.processRequest}
      >
        Submit
      </Button>
    );
  }
}

Autapses.propTypes = {
  dataSet: PropTypes.string.isRequired,
  isQuerying: PropTypes.bool.isRequired,
  submit: PropTypes.func.isRequired
};

export default Autapses;
