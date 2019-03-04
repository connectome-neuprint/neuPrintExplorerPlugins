/*
 * Query to find partners for a given body and the completeness of those tracings.
 */
import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

const styles = theme => ({
  select: {
    fontFamily: theme.typography.fontFamily,
    margin: '0.5em 0 1em 0'
  },
  textField: {
    marginBottom: '1em'
  }
});

const pluginName = 'PartnerCompleteness';
const pluginAbbrev = 'pc';

class PartnerCompleteness extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: 'Partner Completeness',
      abbr: pluginAbbrev,
      experimental: true,
      category: 'recon',
      description: 'Show all connections to and from selected neuron and show reconstruction completeness.',
      visType: 'SimpleTable'
    };
  }

  static fetchParameters(params) {

    const { dataSet, bodyId } = params;
    const cypherQuery = `MATCH (n :\`${dataSet}-Segment\` {bodyId: ${bodyId}})-[x:ConnectsTo]-(m) RETURN m.bodyId, m.name, CASE WHEN startnode(x).bodyId = ${bodyId} THEN false ELSE true END, x.weight, m.status, m.pre, m.post, n.name, n.pre, n.post, n.status ORDER BY x.weight DESC`;
    return {
      cypherQuery,
      queryString: '/custom/custom',
    };
  }

  static processResults(query, apiResponse) {
    const data = apiResponse.data.map(row => [
      row[0],
      row[1],
      row[2],
      row[3],
      row[4],
      row[5],
      row[6],
      row[7],
      row[8],
      row[9],
      row[10]
    ]);

    return {
      columns: ['id', 'name', 'isinput', '#connections', 'status', '#pre', '#post'],
      data,
      debug: apiResponse.debug,
      bodyId: apiResponse.bodyId,
      title: `Tracing completeness of connections to/from ${query.pm.bodyId}`,
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      bodyId: ''
    };
  }

  // creates query object and sends to callback
  processRequest = () => {
    const { dataSet, submit } = this.props;
    const { bodyId } = this.state;

    const query = {
      dataSet,
      plugin: pluginName,
      pluginCode: pluginAbbrev,
      parameters: { dataSet, bodyId },
    };
    submit(query);
  };

  addNeuron = event => {
    this.setState({ bodyId: event.target.value });
  };

  render() {
    const { classes, isQuerying } = this.props;
    const { bodyId } = this.state;
    return (
      <div>
        <TextField
          label="Body Id"
          fullWidth
          value={bodyId}
          className={classes.textField}
          onChange={this.addNeuron}
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

PartnerCompleteness.propTypes = {
  dataSet: PropTypes.string.isRequired,
  submit: PropTypes.func.isRequired,
  isQuerying: PropTypes.bool.isRequired,
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(PartnerCompleteness);
