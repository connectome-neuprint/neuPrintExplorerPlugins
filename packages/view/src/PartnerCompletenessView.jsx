/* eslint-disable prefer-destructuring */
import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';

import IndependentTable from './visualization/IndependentTable';

const styles = theme => ({
  root: {},
  select: {
    fontFamily: theme.typography.fontFamily
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200
  },
  tooltip: {
    color: 'red',
    verticalAlign: 'super',
    fontSize: '80%',
    marginLeft: theme.spacing.unit / 2
  }
});

class PartnerCompletenessView extends React.Component {
  constructor(props) {
    super(props);
    const { index, actions, query } = props;
    const { visProps = {} } = query;
    const initialValues = this.getInitialValues();

    const newVisProps = Object.assign({}, visProps, {
      highlightIndexInput: initialValues.highlightIndexInput,
      highlightIndexOutput: initialValues.highlightIndexOutput,
      selectedStatus: initialValues.allStatus,
      allStatus: initialValues.allStatus,
      inputTable: initialValues.inputTable,
      outputTable: initialValues.outputTable,
      bodyStats: initialValues.bodyStats,
      inputStats: initialValues.inputStats,
      outputStats: initialValues.outputStats,
      statusDefinitions: initialValues.statusDefinitions,
      orphanFilter: 0
    });

    actions.updateQuery(index, Object.assign({}, query, { visProps: newVisProps }));
  }

  componentDidUpdate() {
    const { index, actions, query } = this.props;
    const { visProps = {} } = query;

    // if this is a new query result, there will be no values stored in visProps so need to calculate initial values
    if (Object.keys(visProps).length === 0) {
      const initialValues = this.getInitialValues();

      const newVisProps = Object.assign({}, visProps, {
        highlightIndexInput: initialValues.highlightIndexInput,
        highlightIndexOutput: initialValues.highlightIndexOutput,
        selectedStatus: initialValues.allStatus,
        allStatus: initialValues.allStatus,
        inputTable: initialValues.inputTable,
        outputTable: initialValues.outputTable,
        bodyStats: initialValues.bodyStats,
        inputStats: initialValues.inputStats,
        outputStats: initialValues.outputStats,
        statusDefinitions: initialValues.statusDefinitions,
        orphanFilter: 0
      });

      actions.updateQuery(index, Object.assign({}, query, { visProps: newVisProps }));
    }
  }

  getInitialValues = () => {
    const { query, neoServer } = this.props;
    const inputTable = {
      result: {
        columns: ['id', 'name', '#connections', 'status', '#pre', '#post'],
        data: []
      }
    };
    const outputTable = {
      result: {
        columns: ['id', 'name', '#connections', 'status', '#pre', '#post'],
        data: []
      }
    };

    const { result } = query;

    const allStatus = new Set();
    const highlightIndexInput = {};
    const highlightIndexOutput = {};

    const bodyStats = {
      bodyId: result.bodyId,
      name: '',
      pre: 0,
      post: 0,
      status: ''
    };

    for (let i = 0; i < result.data.length; i += 1) {
      const arr = [];
      const status = result.data[i][4];
      let highlight = false;
      if (status !== null && status !== '') {
        highlight = true;
        allStatus.add(status);
      }

      /* eslint-disable prefer-destructuring */
      if (i === 0) {
        bodyStats.name = result.data[i][7];
        bodyStats.pre = result.data[i][8];
        bodyStats.post = result.data[i][9];
        bodyStats.status = result.data[i][10];
      }
      /* eslint-enable prefer-destructuring */

      for (let j = 0; j < 7; j += 1) {
        if (j !== 2) {
          arr.push(result.data[i][j]);
        }
      }
      // check if isinput
      if (result.data[i][2]) {
        if (highlight) {
          highlightIndexInput[inputTable.result.data.length] = 'lightblue';
        }
        inputTable.result.data.push(arr);
      } else {
        if (highlight) {
          highlightIndexOutput[outputTable.result.data.length] = 'lightblue';
        }
        outputTable.result.data.push(arr);
      }
    }

    const inputStats = this.highlightStats(inputTable.result.data, highlightIndexInput, 0);
    const outputStats = this.highlightStats(outputTable.result.data, highlightIndexOutput, 0);

    const statusDefinitions = this.queryStatusDefinitions(neoServer, query.dataSet);

    return {
      inputTable,
      outputTable,
      highlightIndexInput,
      highlightIndexOutput,
      allStatus: [...allStatus],
      bodyStats,
      inputStats,
      outputStats,
      statusDefinitions
    };
  };

  queryStatusDefinitions = (neoServer, dataset) => {
    const { actions } = this.props;
    if (neoServer === '') {
      return;
    }

    fetch('/api/custom/custom', {
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        dataset,
        cypher: `MATCH (n:Meta{dataset:"${dataset}"}) RETURN n.statusDefinitions`
      }),
      method: 'POST',
      credentials: 'include'
    })
      .then(result => {
        if (result.ok) {
          return result.json();
        }
        throw new Error(
          'Unable to fetch status definitions, try reloading the page. If this error persists, please contact support.'
        );
      })
      .then(resp => {
        let statusDefinitions = '';
        if (resp.data[0][0]) {
          const statusDefinitionsObject = JSON.parse(resp.data[0][0].replace(/'/g, '"'));
          Object.keys(statusDefinitionsObject).forEach((status, index) => {
            statusDefinitions += `${status}: ${statusDefinitionsObject[status]}`;
            if (index < Object.keys(statusDefinitionsObject).length - 1) {
              statusDefinitions += ', ';
            }
          });
        }

        return statusDefinitions;
      })
      .catch(error => {
        actions.metaInfoError(error);
      });
  };

  highlightStats = (table, selected, filter) => {
    let totalconn = 0;
    let highconn = 0;
    let numbodies = 0;
    let numhigh = 0;
    for (let i = 0; i < table.length; i += 1) {
      if (table[i][2] <= filter) {
        break;
      }

      totalconn += table[i][2];
      numbodies += 1;
      if (i.toString() in selected) {
        highconn += table[i][2];
        numhigh += 1;
      }
    }

    return {
      totalconn,
      highconn,
      numbodies,
      numhigh
    };
  };

  highlightRows = filter => selected => {
    const { actions, query, index } = this.props;
    const { visProps } = query;
    const { inputTable, outputTable } = visProps;
    const currSelected = selected.map(item => item.value);
    const currSelectedSet = new Set(currSelected);
    const filterLimit = filter === '' ? 0 : filter;

    const inputHighlight = {};
    const outputHighlight = {};
    for (let i = 0; i < inputTable.result.data.length; i += 1) {
      if (inputTable.result.data[i][2] <= filterLimit) {
        inputHighlight[i] = 'pink';
      } else if (currSelectedSet.has(inputTable.result.data[i][3])) {
        inputHighlight[i] = 'lightblue';
      }
    }

    for (let i = 0; i < outputTable.result.data.length; i += 1) {
      if (outputTable.result.data[i][2] <= filterLimit) {
        outputHighlight[i] = 'pink';
      } else if (currSelectedSet.has(outputTable.result.data[i][3])) {
        outputHighlight[i] = 'lightblue';
      }
    }

    const inputStats = this.highlightStats(inputTable.result.data, inputHighlight, filterLimit);
    const outputStats = this.highlightStats(outputTable.result.data, outputHighlight, filterLimit);

    const newVisProps = Object.assign({}, visProps, {
      highlightIndexInput: inputHighlight,
      highlightIndexOutput: outputHighlight,
      selectedStatus: currSelected,
      inputTable,
      outputTable,
      inputStats,
      outputStats,
      orphanFilter: filter
    });

    actions.updateQuery(index, Object.assign({}, query, { visProps: newVisProps }));
  };

  handleChange = event => {
    const { query } = this.props;
    const { visProps } = query;
    const { selectedStatus } = visProps;
    let val = parseInt(event.target.value, 10);
    if (event.target.value === '' || event.target.value === null) {
      val = '';
    }
    if (/^\d+$/.test(val) || val === '') {
      const currSelected = selectedStatus.map(name => ({
        label: name,
        value: name
      }));
      this.highlightRows(val)(currSelected);
    }
  };

  render() {
    const { classes, query } = this.props;
    const { visProps = {} } = query;
    const {
      highlightIndexInput = {},
      highlightIndexOutput = {},
      selectedStatus = [],
      allStatus = [],
      inputTable = { result: { data: [], columns: [] } },
      outputTable = { result: { data: [], columns: [] } },
      bodyStats = '',
      orphanFilter = 0,
      inputStats = {},
      outputStats = {},
      statusDefinitions
    } = visProps;

    const options = allStatus.map(name => ({
      label: name,
      value: name
    }));
    const currSelected = selectedStatus.map(name => ({
      label: name,
      value: name
    }));

    return (
      <div className={classes.root}>
        <Typography variant="h6">Neuron information</Typography>
        <Typography>Name: {bodyStats.name}</Typography>
        <Typography>Status: {bodyStats.status}</Typography>
        <Typography>
          #pre: {bodyStats.pre}, #post: {bodyStats.post}
        </Typography>
        <div style={{ marginTop: '8px', marginBottom: '8px' }}>
          <Typography variant="subtitle1" style={{ display: 'inline-flex' }}>
            Desired level of completeness
            <Tooltip id="tooltip-icon" title={statusDefinitions || ''} placement="right">
              <div className={classes.tooltip}>?</div>
            </Tooltip>
          </Typography>
          <Select
            className={classes.select}
            isMulti
            value={currSelected}
            onChange={this.highlightRows(orphanFilter)}
            options={options}
            closeMenuOnSelect={false}
          />
        </div>
        <TextField
          id="orphanfilter"
          label="Filter (ignore #conn <=)"
          className={classes.textField}
          value={orphanFilter}
          onChange={this.handleChange}
          margin="normal"
        />
        <Typography variant="h6">Inputs</Typography>
        <Typography>
          {((inputStats.highconn / inputStats.totalconn) * 100).toFixed(2)} percent connections,{' '}
          {inputStats.numhigh} bodies highlighted out of {inputStats.numbodies}
        </Typography>
        <IndependentTable
          data={inputTable.result.data}
          columns={inputTable.result.columns}
          rowsPerPage={10}
          disableSort={new Set([0, 1, 2, 3, 4, 5])}
          highlightIndex={highlightIndexInput}
        />
        <Typography variant="h6">Outputs</Typography>
        <Typography>
          {((outputStats.highconn / outputStats.totalconn) * 100).toFixed(2)} percent connections,{' '}
          {outputStats.numhigh} bodies highlighted out of {outputStats.numbodies}
        </Typography>
        <IndependentTable
          data={outputTable.result.data}
          columns={outputTable.result.columns}
          rowsPerPage={10}
          disableSort={new Set([0, 1, 2, 3, 4, 5])}
          highlightIndex={highlightIndexOutput}
        />
      </div>
    );
  }
}

PartnerCompletenessView.propTypes = {
  query: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  neoServer: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired
};

export default withStyles(styles)(PartnerCompletenessView);
