/*
 * Find objects in a cell given the body id.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { getBodyIdForTable } from './shared/pluginhelpers';

const styles = (theme) => ({
  textField: {
    margin: 4,
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  formControl: {
    margin: theme.spacing(1),
  },
  select: {
    fontFamily: theme.typography.fontFamily,
    margin: '0.5em 0 1em 0',
  },
  button: {
    margin: 4,
    display: 'block',
  },
  noBodyError: {
    fontSize: '0.9em',
  },
  clickable: {
    cursor: 'pointer',
  },
});

const pluginName = 'CellObjects';
const pluginAbbrev = 'cos';


const filterOptions = [
  { value: 'mito', label: 'Mitochondria' },
  { value: 'preSyn', label: 'Presynaptic Site' },
  { value: 'postSyn', label: 'Postsynaptic Site' },
];


const columnHeaders = ['bodyId', 'type', 'status'];

/* TODO: use a query like the one below to get the meta information that
 * we need to figure out what types of objects are in the database.

fetch('/api/custom/custom?np_explorer=meta', {
  credentials: 'include',
  body: JSON.stringify({ cypher: 'MATCH (n:Meta) RETURN n' }),
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})
  .then((result) => result.json())
  .then((resp) => {
    console.log(resp);
    console.log(JSON.parse(resp.data[0][0].objectProperties));
  });

*/

export class CellObjects extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: 'Objects in a cell',
      abbr: pluginAbbrev,
      category: 'top-level',
      description: 'Find Objects in a cell.',
      visType: 'SimpleTable',
    };
  }

  static getColumnHeaders() {
    return columnHeaders.map((column) => ({ name: column, status: true }));
  }

  static fetchParameters() {
    return {};
  }

  static processResults({ query, apiResponse, actions }) {
    const data = apiResponse.data.map((row) => [
      getBodyIdForTable(query.ds, row[0], true, actions),
      row[1],
      row[2],
    ]);

    return {
      columns: columnHeaders,
      data,
      debug: apiResponse.debug,
      title: `Cell objects in body: ${query.pm.bodyId}`,
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      bodyId: '',
      errorMessage: '',
      types: []
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
        bodyId,
      },
      visProps: {
        rowsPerPage: 25,
      },
    };

    submit(query);
  };

  addBodyId = (event) => {
    this.setState({ bodyId: event.target.value });
  };

  catchReturn = (event) => {
    // submit request if user presses enter
    if (event.keyCode === 13) {
      event.preventDefault();
      this.submitQuery();
    }
  };

  handleChangeTypes = selected => {
    const types = selected.map(item => item.value);
    this.setState({ types });
  };

  render() {
    const { classes, isQuerying } = this.props;
    const { bodyId, errorMessage, types } = this.state;

    const typeValues = types.map(type => ({
      label: type,
      value: type
    }));



    return (
      <div>
        <InputLabel htmlFor="select-multiple-chip">Object Types</InputLabel>
        <Select
          options={filterOptions}
          isMulti
          onChange={this.handleChangeTypes}
          value={typeValues}
        />
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

CellObjects.propTypes = {
  submit: PropTypes.func.isRequired,
  dataSet: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  isQuerying: PropTypes.bool.isRequired,
};

export default withStyles(styles, { withTheme: true })(CellObjects);
