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

  static processResults(query, apiResponse) {
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
      textValue: ''
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

  handleChange = event => {
    this.setState({ textValue: event.target.value });
  };

  catchReturn = (editor, event) => {
    // submit request if user presses enter
    if (event.shiftKey && event.keyCode === 13) {
      event.preventDefault();
      this.processRequest();
    }
  };

  render() {
    const { classes, isQuerying } = this.props;
    const { textValue = '' } = this.state;
    return (
      <FormControl fullWidth className={classes.formControl}>
        <Typography>Custom Cypher Query</Typography>
        <CodeMirror
          className={classes.textField}
          value={textValue}
          options={{
            lineWrapping: true,
            lineNumbers: true,
            smartIndent: false,
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
  dataSet: PropTypes.string.isRequired,
  submit: PropTypes.func.isRequired,
  isQuerying: PropTypes.bool.isRequired
};

export default withStyles(styles)(CustomQuery);
