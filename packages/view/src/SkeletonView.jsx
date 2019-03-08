import React from 'react';
import PropTypes from 'prop-types';
import randomColor from 'randomcolor';
import Immutable from 'immutable';
import PouchDB from 'pouchdb';

import { withStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';

import SharkViewer from '@janelia/sharkviewer';
import CompartmentSelection from './Skeleton/CompartmentSelection';

const styles = theme => ({
  root: {
    position: 'relative',
    width: '100%',
    height: '100%',
    marginTop: theme.spacing.unit * 1,
    backgroundColor: 'white'
  },
  floater: {
    zIndex: 2,
    padding: theme.spacing.unit,
    position: 'absolute'
  },
  footer: {
    zIndex: 2,
    padding: theme.spacing.unit,
    position: 'absolute',
    top: 0,
    right: 0
  },
  skel: {
    width: '100%',
    height: '100%',
    background: '#ddd',
    zIndex: 1,
    position: 'relative'
  },
  chip: {
    margin: theme.spacing.unit / 2
  },
  minimize: {
    zIndex: 2,
    position: 'absolute',
    top: '1em',
    right: '1em'
  }
});
const skeletonQuery =
  'MATCH (:`YY-Neuron` {bodyId:ZZ})-[:Contains]->(:Skeleton)-[:Contains]->(root :SkelNode) WHERE NOT (root)<-[:LinksTo]-() RETURN root.rowNumber AS rowId, root.location.x AS x, root.location.y AS y, root.location.z AS z, root.radius AS radius, -1 AS link ORDER BY root.rowNumber UNION match (:`YY-Neuron` {bodyId:ZZ})-[:Contains]->(:Skeleton)-[:Contains]->(s :SkelNode)<-[:LinksTo]-(ss :SkelNode) RETURN s.rowNumber AS rowId, s.location.x AS x, s.location.y AS y, s.location.z AS z, s.radius AS radius, ss.rowNumber AS link ORDER BY s.rowNumber';

class SkeletonView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sharkViewer: {
        animate: () => {}
      },
      db: new PouchDB('neuprint_compartments'),
      bodies: Immutable.Map({}),
      compartments: Immutable.Map({})
    };
    this.skelRef = React.createRef();
  }

  componentDidMount() {
    const { query } = this.props;
    // check for neurons and compartments here and load them into the state
    if (query.pm.dataSet) {
      if (query.pm.bodyIds) {
        const bodyIds = query.pm.bodyIds.toString().split(',');
        this.addSkeletons(bodyIds, query.pm.dataSet);
      }
      if (query.pm.compartments) {
        const compIds = query.pm.compartments.split(',');
        this.addCompartments(compIds, query.pm.dataSet);
      }
    }
    this.createShark();
  }

  componentDidUpdate(prevProps, prevState) {
    // TODO: have to check here to see if any new ids have been passed in.
    const { query } = this.props;

    if (query.pm.bodyIds !== prevProps.query.pm.bodyIds) {
      const bodyIds = query.pm.bodyIds.toString().split(',');
      this.addSkeletons(bodyIds, query.pm.dataSet);
    }

    if (query.pm.compartments !== prevProps.query.pm.compartments) {
      const compartments = query.pm.compartments.toString().split(',');
      this.addCompartments(compartments, query.pm.dataSet);
    }

    // now check the state to see if that has changed and if so, then load in the
    // new data.
    const { bodies, compartments } = this.state;
    if (bodies !== prevState.bodies || compartments !== prevState.compartments) {
      const differentBodies = {};
      const differentCompartments = {};
      bodies.entrySeq().forEach(entry => {
        const [key, value] = entry;
        if (value !== prevState.bodies.get(key)) {
          differentBodies[key] = value;
        }
      });
      compartments.entrySeq().forEach(entry => {
        const [key, value] = entry;
        if (value !== prevState.compartments.get(key)) {
          differentCompartments[key] = value;
        }
      });
      // figure out which components/rois were removed
      const removedNeurons = [];
      const removedCompartments = [];
      prevState.bodies.keySeq().forEach(key => {
        if (!bodies.has(key)) {
          removedNeurons.push(key);
        }
      });

      prevState.compartments.keySeq().forEach(key => {
        if (!compartments.has(key)) {
          removedCompartments.push(key);
        }
      });
      this.loadShark(
        Immutable.Map(differentBodies),
        Immutable.Map(differentCompartments),
        removedNeurons,
        removedCompartments
      );
    }
  }

  loadShark = (swcs, rois, removedSWCs, removedROIs) => {
    const { sharkViewer, db } = this.state;
    // check here to see if we have added or removed neurons.
    const names = {};
    const roiNames = {};
    // TODO: fix the camera movement setting
    const moveCamera = false;
    swcs.forEach(swc => {
      // If added, then add them to the scene.
      const exists = sharkViewer.scene.getObjectByName(swc.get('name'));
      if (!exists) {
        sharkViewer.loadNeuron(swc.get('name'), swc.get('color'), swc.get('swc'), moveCamera);
      }
      // if hidden, then hide them.
      sharkViewer.setNeuronVisible(swc.get('name'), swc.get('visible'));
      // push name onto lookup for later use;
      names[swc.get('name')] = 1;
    });

    rois.forEach(roi => {
      const exists = sharkViewer.scene.getObjectByName(roi.get('name'));
      if (!exists) {
        const reader = new FileReader();

        reader.addEventListener('loadend', () => {
          sharkViewer.loadCompartment(roi.get('name'), roi.get('color'), reader.result, moveCamera);
        });

        db.getAttachment(roi.get('name'), 'obj').then(obj => {
          reader.readAsText(obj);
        });
      }
      roiNames[roi.get('name')] = 1;
    });

    // If removed, then remove them.
    removedSWCs.forEach(child => {
      sharkViewer.unloadNeuron(child);
    });

    removedROIs.forEach(child => {
      sharkViewer.unloadCompartment(child);
    });

    sharkViewer.render();
    sharkViewer.render();
    // UGLY: there is a weird bug that means sometimes the scene is rendered blank.
    // it seems to be some sort of timing issue, and adding a delayed render seems
    // to fix it.
    setTimeout(() => {
      sharkViewer.render();
    }, 200);
  };

  createShark = (swcs, rois) => {
    const { query } = this.props;
    const { cameraPosition } = query;
    const { db } = this.state;
    const moveCamera = !cameraPosition;
    const sharkViewer = new SharkViewer({
      dom_element: 'skeletonviewer',
      WIDTH: this.skelRef.current.clientWidth,
      HEIGHT: this.skelRef.current.clientHeight
    });
    sharkViewer.init();
    sharkViewer.animate();

    if (swcs && swcs.size > 0) {
      swcs.forEach(swc => {
        sharkViewer.loadNeuron(swc.get('name'), swc.get('color'), swc.get('swc'), moveCamera);
      });
    }

    if (rois && rois.size > 0) {
      rois.forEach(roi => {
        const reader = new FileReader();

        reader.addEventListener('loadend', () => {
          sharkViewer.loadCompartment(roi.get('name'), roi.get('color'), reader.result, moveCamera);
        });

        db.getAttachment(roi.get('name'), 'obj').then(obj => {
          reader.readAsText(obj);
        });
      });
    }

    if (cameraPosition) {
      const { coords, target } = cameraPosition;
      sharkViewer.restoreView(coords.x, coords.y, coords.z, target);
    }

    sharkViewer.render();
    sharkViewer.render();
    this.setState({ sharkViewer });
    // UGLY: there is a weird bug that means sometimes the scene is rendered blank.
    // it seems to be some sort of timing issue, and adding a delayed render seems
    // to fix it.
    setTimeout(() => {
      sharkViewer.render();
    }, 200);
  };

  handleDelete = id => () => {
    const { actions, query } = this.props;
    const { bodies } = this.state;
    const updated = bodies.delete(id);
    this.setState({ bodies: updated });
    actions.skeletonRemove(id, query.pm.dataSet);
    // action passed in from Results that removes id from the url
  };

  handleClick = id => () => {
    const { bodies } = this.state;
    const newState = !bodies.getIn([id, 'visible']);
    const updated = bodies.setIn([id, 'visible'], newState);
    this.setState({ bodies: updated });
  };

  skeletonLoaded(id, dataSet, result) {
    const { bodies } = this.state;
    // parse the result into swc format for skeleton viewer code.
    const data = {};
    const color = randomColor({ luminosity: 'light', hue: 'random' });

    result.data.forEach(row => {
      data[parseInt(row[0], 10)] = {
        x: parseInt(row[1], 10),
        y: parseInt(row[2], 10),
        z: parseInt(row[3], 10),
        radius: parseInt(row[4], 10),
        parent: parseInt(row[5], 10)
      };
    });

    const updated = bodies.set(
      id,
      Immutable.Map({
        name: id,
        dataSet,
        swc: data,
        color,
        visible: true
      })
    );

    this.setState({ bodies: updated });
  }

  addSkeletons(bodyIds, dataSet) {
    bodyIds.forEach(id => {
      this.addSkeleton(id, dataSet);
    });
  }

  addSkeleton(bodyId, dataSet) {
    // generate the querystring.
    const completeQuery = skeletonQuery.replace(/YY/g, dataSet).replace(/ZZ/g, bodyId);
    // fetch swc data
    return fetch('/api/custom/custom', {
      headers: {
        'content-type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        cypher: completeQuery
      }),
      method: 'POST',
      credentials: 'include'
    })
      .then(result => result.json())
      .then(result => {
        if ('error' in result) {
          throw result.error;
        }
        this.skeletonLoaded(bodyId, dataSet, result);
      })
      .catch(error => this.setState({ loadingError: error }));
  }

  addCompartments(cIds, dataSet) {
    cIds.forEach(id => {
      this.addCompartment(id, dataSet);
    });
  }

  addCompartmentsToQueryString(updated) {
    const { actions, index } = this.props;
    const tabData = actions.getQueryObject('qr', []);
    tabData[index].pm.compartments = updated.keySeq().join(',');
    actions.setQueryString({
      'qr': tabData
    });
  }

  skeletonLoadedCompartment(id, result) {
    const { db, compartments } = this.state;
    const compartment = Immutable.Map({
      name: id,
      obj: 'localStorage',
      visible: true,
      color: '#000000'
    });
    return db
      .putAttachment(id, 'obj', btoa(result), 'text/plain')
      .then(() => {
        const updated = compartments.set(id, compartment);
        this.setState({ compartments: updated });
        // TODO: update url query string here
        this.addCompartmentsToQueryString(updated);
      })
      .catch(err => {
        if (err.name === 'conflict') {
          const updated = compartments.set(id, compartment);
          this.setState({ compartments: updated });
          // TODO: update url query string here
          this.addCompartmentsToQueryString(updated);
        } else {
          this.setState({
            loadingError: err
          });
        }
      });
  }

  fetchMesh(id, key, host, uuid) {
    return fetch(`${host}/api/node/${uuid}/roi_data/key/${key}`, {
      headers: {
        'Content-Type': 'text/plain',
        Accept: 'text/plain'
      },
      method: 'GET'
    })
      .then(result => result.text())
      .then(result => {
        this.skeletonLoadedCompartment(id, result);
      });
  }

  addCompartment = id => {
    const { neo4jsettings, query } = this.props;
    const meshHost = neo4jsettings.get('meshInfo').hemibrain;
    const { uuid } = neo4jsettings.get('datasetInfo').hemibrain;

    return fetch(`${meshHost}/api/node/${uuid}/rois/key/${id}`, {
      headers: {
        'Content-Type': 'text/plain',
        Accept: 'application/json'
      },
      method: 'GET'
    })
      .then(result => result.json())
      .then(result => {
        const { key } = result['->'];
        this.fetchMesh(id, key, meshHost, uuid);
      })
      .catch(error => this.setState({ loadingError: error }));
  };

  removeCompartment = cId => {
    const { actions, index } = this.props;
    const { compartments } = this.state;
    const updated = compartments.delete(cId);
    this.setState({ compartments: updated });

    // TODO: update url query string here
    const tabData = actions.getQueryObject('qr', []);

    tabData[index].pm.compartments = updated.keySeq().join(',');
    actions.setQueryString({
      'qr': tabData,
    });
  }

  render() {
    const { classes, query, neo4jsettings, index } = this.props;
    const { bodies, compartments } = this.state;

    const chips = bodies.map(neuron => {
      // gray out the chip if it is not active.
      let currcolor = neuron.get('color');
      if (!neuron.get('visible')) {
        currcolor = 'gray';
      }

      const name = neuron.get('name');

      return (
        <Chip
          key={name}
          label={name}
          onDelete={this.handleDelete(name)}
          onClick={this.handleClick(name)}
          className={classes.chip}
          style={{ background: currcolor }}
        />
      );
    });

    const chipsArray = chips.valueSeq().toArray();

    let compartmentSelection = '';

    if (query.pm.dataSet === 'hemibrain') {
      // pass action callbacks to add or remove compartments to
      // the compartment selection component.
      const compartmentActions = {
        addROI: this.addCompartment,
        removeROI: this.removeCompartment
      };

      compartmentSelection = (
        <CompartmentSelection
          availableROIs={neo4jsettings.get('availableROIs')}
          selectedROIs={compartments}
          actions={compartmentActions}
          query={query}
        />
      );
    }
    return (
      <div className={classes.root}>
        <div className={classes.floater}>{chipsArray}</div>
        <div className={classes.footer}>{compartmentSelection}</div>
        <div className={classes.skel} ref={this.skelRef} id="skeletonviewer" />
      </div>
    );
  }
}

SkeletonView.propTypes = {
  query: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  classes: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  neo4jsettings: PropTypes.object.isRequired
};

export default withStyles(styles)(SkeletonView);
