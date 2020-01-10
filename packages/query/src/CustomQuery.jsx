/*
 * Supports simple, custom neo4j query.
 */
import React from 'react';
import PropTypes from 'prop-types';

import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import { withStyles } from '@material-ui/core/styles';

import { Controlled as CodeMirror } from 'react-codemirror2';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';

require('codemirror/mode/cypher/cypher.js');

const styles = () => ({
  textField: {
    border: '1px solid #ccc',
    borderRadius: '5px',
    margin: '0 0 1em 0',
    padding: '5px'
  },
  button: {
    margin: 4,
    display: 'block'
  },
  badCypher: {
    fontSize: '0.9em'
  },
  formControl: {}
});

const pluginName = 'CustomQuery';
const pluginAbbrev = 'cq';

export class CustomQuery extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: 'Custom Query',
      abbr: pluginAbbrev,
      description: 'Enter custom Neo4j Cypher query',
      visType: 'SimpleTable'
    };
  }

  static fetchParameters() {
    return {};
  }

  static processResults({ apiResponse }) {
    if (apiResponse.data) {
      const data = apiResponse.data.map(row =>
        row.map(item => (typeof item === 'object' ? JSON.stringify(item) : item))
      );
      return {
        columns: apiResponse.columns,
        data,
        debug: apiResponse.debug,
        title: 'Custom Query'
      };
    }
    return {
      columns: [],
      data: [],
      debug: ''
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      textValue: '',
      errorMessage: ''
    };
  }

  processRequest = () => {
    const { dataSet, submit } = this.props;
    const { textValue = '' } = this.state;

    const query = {
      dataSet,
      plugin: pluginName,
      pluginCode: pluginAbbrev,
      parameters: {
        cypherQuery: textValue,
        dataset: dataSet
      }
    };
    submit(query);
  };

  // check if query has correct syntax by running a debug 'explain query'
  validateRequest = () => {
    const { dataSet } = this.props;
    const { textValue = '' } = this.state;

    // make sure user is not running an explain query already
    let cypher = textValue.trim();
    let items = cypher.split(/\s+/);
    if (items.length > 0) {
      if (items[0].toLowerCase() === 'profile' || items[0].toLowerCase() === 'explain') {
        this.processRequest();
        return;
      }
    }

    const parameters = {
      cypher: 'EXPLAIN ' + textValue,
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
        if (resp.error) {
          // remove "EXPLAIN" for debugging
          let message = resp.error.replace('EXPLAIN ', '');
          let colstr = message.match(/column \d+/g);
          let col_arr = colstr[0].split(' ');
          message = message.replace(
            colstr,
            col_arr[0] + ' ' + (parseInt(col_arr[1]) - 8).toString()
          );
          let offstr = message.match(/offset: \d+/g);
          let off_arr = offstr[0].split(' ');
          message = message.replace(
            offstr,
            off_arr[0] + ' ' + (parseInt(off_arr[1]) - 8).toString()
          );

          this.setState({ errorMessage: message });
        } else {
          this.setState({ errorMessage: '' });
          this.processRequest();
        }
      })
      .catch(error => {
        this.setState({ errorMessage: 'some error occurred.' });
      });
  };

  handleChange = event => {
    this.setState({ textValue: event.target.value });
  };

  catchReturn = (editor, event) => {
    // submit request if user presses enter
    if (event.shiftKey && event.keyCode === 13) {
      event.preventDefault();
      this.validateRequest();
    }
  };

  render() {
    const { classes, isQuerying } = this.props;
    const { errorMessage, textValue = '' } = this.state;
    return (
      <FormControl fullWidth className={classes.formControl}>
        <Typography>Custom Cypher Query</Typography>
        <CodeMirror
          className={classes.textField}
          value={textValue}
          options={{
            lineWrapping: true,
            lineNumbers: true,
            smartIndent: false
          }}
          onBeforeChange={(editor, data, value) => {
            this.setState({ textValue: value });
          }}
          onKeyDown={this.catchReturn}
        />
        <Typography variant="caption">[shift] + [Enter] to submit.</Typography>
        <Button
          variant="contained"
          className={classes.button}
          onClick={this.validateRequest}
          color="primary"
          disabled={isQuerying}
        >
          Submit
        </Button>
        {errorMessage !== '' && (
          <Typography color="error" className={classes.badCypher}>
            {errorMessage}
          </Typography>
        )}
      </FormControl>
    );
  }
}

CustomQuery.propTypes = {
  classes: PropTypes.object.isRequired,
  dataSet: PropTypes.string.isRequired,
  submit: PropTypes.func.isRequired,
  isQuerying: PropTypes.bool.isRequired
};

export default withStyles(styles)(CustomQuery);
