/*
 *  Saved Search loads a saved search from google cloud datastore
 *  and displays it using the view provided by the original plugin.
 */

import React from 'react';
import PropTypes from 'prop-types';

const pluginName = 'SavedSearch';
const pluginAbbrev = 'sv';

export class SavedSearch extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: 'Saved Search',
      abbr: pluginAbbrev,
      save: false,
      category: 'hidden',
      description: 'Show saved search results',
      visType: 'None'
    };
  }

  static fetchParameters(params, token) {
    return {
      querySettings: {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      },
      queryUrl: `https://us-east1-dvid-em.cloudfunctions.net/neuprint-janelia-test/user/searches/${
        params.id
      }`
    };
  }

  static processResults(query, apiResponse, actions, submitFunc, isPublic, originalPlugin) {
    const title = `${apiResponse.name} - ${apiResponse.timestamp}`;

    // TODO: can we get the processing function from the original plugin
    // and execute it here, then over write the title with the new one?

    const intermediateResults = originalPlugin.processResults(
      query,
      JSON.parse(apiResponse.data).result,
      actions,
      submitFunc,
      isPublic
    );
    intermediateResults.title = title;
    return intermediateResults;
  }

  processRequest = () => {
    const { dataSet, submit } = this.props;
    const { bodyIds } = this.state;
    const query = {
      dataSet,
      plugin: pluginName,
      pluginCode: pluginAbbrev,
      parameters: {
        dataSet,
        bodyIds
      }
    };
    submit(query);
  };

  render() {
    return <p>Not intended for use as a search plugin.</p>;
  }
}

SavedSearch.propTypes = {
  dataSet: PropTypes.string.isRequired,
  submit: PropTypes.func.isRequired
};

export default SavedSearch;
