/*
 * Supports simple, custom neo4j query.
 */
import React from 'react';
import PropTypes from 'prop-types';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  textField: {
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
        cypherQuery: textValue
      }
    };
    submit(query);
  };

  handleChange = event => {
    this.setState({ textValue: event.target.value });
  };

  catchReturn = event => {
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
        <TextField
          label="Custom Cypher Query"
          multiline
          fullWidth
          value={textValue}
          rows={7}
          className={classes.textField}
          onChange={this.handleChange}
          onKeyDown={this.catchReturn}
          helperText="[shift] + [Enter] to submit."
          variant="outlined"
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
  dataSet: PropTypes.string.isRequired,
  submit: PropTypes.func.isRequired,
  isQuerying: PropTypes.bool.isRequired
};

export default withStyles(styles)(CustomQuery);
