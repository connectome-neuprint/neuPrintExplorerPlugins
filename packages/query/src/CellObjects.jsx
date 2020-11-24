/*
 * Find objects in a cell given the body id.
 */

import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { getBodyIdForTable } from './shared/pluginhelpers';

const styles = theme => ({
  textField: {
    margin: 4,
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  formControl: {
    margin: theme.spacing(1)
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

const pluginName = 'CellObjects';
const pluginAbbrev = 'cos';

const columnHeaders = ['bodyId', 'type', 'status'];

export class FindSimilarNeurons extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: 'Objects in a cell',
      abbr: pluginAbbrev,
      category: 'top-level',
      description:
        'Find Objects in a cell.',
      visType: 'SimpleTable'
    };
  }

  static getColumnHeaders() {
    return columnHeaders.map(column => ({name: column, status: true}));
  }

  static fetchParameters() {
    return {};
  }

  static processResults({ query, apiResponse, actions }) {
    const data = apiResponse.data.map(row => [
      getBodyIdForTable(query.ds, row[0], true, actions),
      row[1],
      row[2],
    ]);

    return {
      columns: columnHeaders,
      data,
      debug: apiResponse.debug,
      title: `Cell objects in body: ${query.pm.bodyId}`
    };
  }


  constructor(props) {
    super(props);

    this.state = {
      bodyId: '',
      errorMessage: ''
    };
  }

  submitQuery = () => {
    const { dataSet, submit } = this.props;
    const { bodyId } = this.state;
    const cypher = `MATCH (n :Neuron {bodyId: ${bodyId}}) RETURN n.bodyId, n.instance, n.type`;

    const query = {
      dataSet,
      plugin: pluginName,
      pluginCode: pluginAbbrev,
      parameters: {
        cypherQuery: cypher,
        dataset: dataSet,
        bodyId
      },
      visProps: {
        rowsPerPage: 25
      }
    };

    submit(query);
  };

  addBodyId = event => {
    this.setState({ bodyId: event.target.value });
  };

  catchReturn = event => {
    // submit request if user presses enter
    if (event.keyCode === 13) {
      event.preventDefault();
      this.submitQuery();
    }
  };

  render() {
    const { classes, isQuerying } = this.props;
    const { bodyId, errorMessage } = this.state;

    return (
      <div>
        <FormControl fullWidth className={classes.formControl}>
          <TextField
            label="Body ID"
            multiline
            fullWidth
            rows={1}
            value={bodyId}
            rowsMax={2}
            className={classes.textField}
            onChange={this.addBodyId}
            onKeyDown={this.catchReturn}
          />
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          className={classes.button}
          onClick={this.submitQuery}
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
  dataSet: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  isQuerying: PropTypes.bool.isRequired
};

export default withStyles(styles, { withTheme: true })(FindSimilarNeurons);
