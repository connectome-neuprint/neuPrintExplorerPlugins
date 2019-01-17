/*
 * Supports simple, custom neo4j query.
 */
import React from 'react';
import PropTypes from 'prop-types';
import randomColor from 'randomcolor';
import { withRouter } from 'react-router';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  textField: {
    width: 300,
    margin: '0 0 1em 0'
  },
  button: {
    margin: 4,
    display: 'block'
  },
  formControl: {}
});

const pluginName = 'CustomQuery';
const pluginAbbrev = 'cq';

export class CustomQuery extends React.Component {
  static get queryName() {
    return 'Custom';
  }

  static get queryDescription() {
    return 'Enter custom Neo4j Cypher query';
  }

  processResults = (query, apiResponse) => {
    if (apiResponse.data) {
      const data = apiResponse.data.map(row =>
        row.map(item => (typeof item === 'object' ? JSON.stringify(item) : item))
      );
      return {
        columns: apiResponse.columns,
        data,
        debug: apiResponse.debug
      };
    }
    return {
      columns: [],
      data: [],
      debug: ''
    };
  };

  processRequest = () => {
    const { dataSet, actions, history } = this.props;
    const { textValue = '' } = actions.getQueryObject(pluginAbbrev);

    const query = {
      dataSet,
      cypherQuery: textValue,
      visType: 'SimpleTable',
      plugin: pluginName,
      parameters: {},
      title: 'Custom query',
      menuColor: randomColor({ luminosity: 'light', hue: 'random' }),
      processResults: this.processResults
    };
    actions.submit(query);
    history.push({
      pathname: '/results',
      search: actions.getQueryString()
    });
    return query;
  };

  handleChange = event => {
    const { actions } = this.props;
    actions.setQueryString({
      [pluginAbbrev]: {
        textValue: event.target.value
      }
    });
  };

  catchReturn = event => {
    // submit request if user presses enter
    if (event.keyCode === 13) {
      event.preventDefault();
      this.processRequest();
    }
  };

  render() {
    const { actions, classes, isQuerying } = this.props;
    const { textValue = '' } = actions.getQueryObject(pluginAbbrev);
    return (
      <FormControl className={classes.formControl}>
        <TextField
          label="Custom Cypher Query"
          multiline
          value={textValue}
          rows={1}
          rowsMax={4}
          className={classes.textField}
          onChange={this.handleChange}
          onKeyDown={this.catchReturn}
        />
        <Button
          variant="contained"
          className={classes.button}
          onClick={this.processRequest}
          color="primary"
          disabled={isQuerying}
        >
          Submit
        </Button>
      </FormControl>
    );
  }
}

CustomQuery.propTypes = {
  classes: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  dataSet: PropTypes.string.isRequired,
  history: PropTypes.object.isRequired,
  isQuerying: PropTypes.bool.isRequired
};

export default withStyles(styles)(withRouter(CustomQuery));
