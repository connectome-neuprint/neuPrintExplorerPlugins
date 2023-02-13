import React from 'react';
import PropTypes from 'prop-types';
import PouchDB from 'pouchdb';
import { withStyles } from '@material-ui/core/styles';
import { Sketch, NEURON_COLORS } from '@vimo-public/vimo-sketches';
import { getBodyIdForTable } from './shared/pluginhelpers';

const styles = () => ({
  textField: {
    border: '1px solid #ccc',
    borderRadius: '5px',
    margin: '0 0 1em 0',
    padding: '5px',
  },
  button: {
    margin: 4,
    display: 'block',
  },
});

const pluginName = 'MotifQuery';
const pluginAbbrev = 'mq';

export class Motif extends React.Component {
  static get details() {
    return {
      name: pluginName,
      displayName: 'Motif Query',
      abbr: pluginAbbrev,
      description: 'Sketch interface to query the database for motifs',
      visType: 'MotifView',
    };
  }

  static fetchParameters() {
    return {};
  }

  static onCloseCallBack = (apiResponse) => () => {
    const db = new PouchDB('neuprint_compartments');
    apiResponse.result.bodyIds.forEach((bodyId) => {
      db.get(`sk_${bodyId}`)
        .then((doc) => db.remove(doc))
        .catch((err) => console.log(err));
    });
  };

  static processResults({ query, apiResponse, actions }) {
    if (apiResponse.data) {
      const bodyIds = new Set();
      const data = [];
      apiResponse.data.forEach((row, index) => {
        const motif = {
          motifId: index + 1,
          nodes: [],
					bodies: [],
        };

        row.forEach((item, itemIndex) => {
          const node = {
            cells: [
              apiResponse.columns[itemIndex],
              item.type || '-',
              getBodyIdForTable(query.ds, item.bodyId, true, actions, {
                skeleton: false,
              }),
              item.status,
            ],
            color: NEURON_COLORS[itemIndex],
          };
          motif.nodes.push(node);
					motif.bodies.push({id: item.bodyId, color: NEURON_COLORS[itemIndex] });
          bodyIds.add(item.bodyId);
        });

				motif.skeletonViewLink = () => {
					// actions.skeletonClear(query.ds);
					actions.skeletonAddBodiesandOpen(motif.bodies, query.ds, null, {replace: true});
				};
        data.push(motif);
      });
      return {
        columns: ['Node Key', 'Type', 'Body Id', 'Status'],
        data,
        debug: apiResponse.debug,
        title: 'Motif Search',
        bodyIds: Array.from(bodyIds),
      };
    }
    return {
      columns: [],
      data: [],
      debug: '',
    };
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  processRequest = (data) => {
    const { dataSet, submit } = this.props;
    const query = {
      dataSet, // <string> for the data set selected
      plugin: pluginName, // <string> the name of this plugin.
      pluginCode: pluginAbbrev,
      visProps: {
        rowsPerPage: 25,
      },
      parameters: {
        cypherQuery: data,
        dataset: dataSet,
      },
    };
    submit(query);
  };

  render() {
    const { dataSet, isQuerying, token } = this.props;
    // const dataServer = window.location.origin;
    const dataServer = 'https://neuprint.janelia.org';
    const dataVersion = dataSet;
    const vimoServer = 'https://vimo-server-bmcp5imp6q-ue.a.run.app';
    return (
      <Sketch
        data_server={dataServer}
        data_version={dataVersion}
        token={token}
        isQuerying={isQuerying}
        processRequest={this.processRequest}
        vimo_server={vimoServer}
      />
    );
  }
}

Motif.propTypes = {
  isQuerying: PropTypes.bool.isRequired,
  dataSet: PropTypes.string.isRequired,
  submit: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
};

export default withStyles(styles)(Motif);
