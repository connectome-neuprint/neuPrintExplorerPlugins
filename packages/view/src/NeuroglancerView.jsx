import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

const Neuroglancer = React.lazy(() => import('@janelia-flyem/react-neuroglancer'));

class NeuroGlancerView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      neurons: Immutable.Map({}),
      coordinates: Immutable.List([]),
      layers: Immutable.Map({})
    };
  }

  componentDidMount() {
    const { query } = this.props;
    if (query.pm.dataSet) {
      if (query.pm.bodyIds) {
        const bodyIds = query.pm.bodyIds.toString().split(',');
        this.addLayers(query.pm.dataSet);
        this.addNeurons(bodyIds, query.pm.dataSet);
      }
    }
  }

  componentDidUpdate() {
    // TODO: get all the neuronIds from the url and add them to the state.
  }

  addNeurons(ids, dataSet) {
    ids.forEach(id => {
      this.addNeuron(id, dataSet);
    });
  }

  addNeuron(id, dataSet) {
    const coordinatesQuery = `WITH neuprint.getNeuronCentroid(${id}, "${dataSet}") AS centroid RETURN centroid `;
    return fetch('/api/custom/custom', {
      headers: {
        'content-type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        cypher: coordinatesQuery,
        dataset: dataSet
      }),
      method: 'POST',
      credentials: 'include'
    })
      .then(result => result.json())
      .then(result => {
        const { neurons } = this.state;
        const updated = neurons.set(
          id,
          Immutable.Map({
            id,
            dataSet,
            color: '#ffffff',
            visible: true
          })
        );

        this.setState({
          neurons: updated,
          coordinates: Immutable.List(result.data[0][0])
        });
      })
      .catch(error => this.setState({ loadingError: error }));
  }

  addLayers(dataSet) {
    const { layers } = this.state;
    // TODO: fetch the layer information and store it in the state.
    const neuroglancerLayerQuery = `MATCH (n:Meta) WITH apoc.convert.fromJsonMap(n.neuroglancerInfo) as nInfo, n.uuid AS uuid RETURN nInfo, uuid`;
    // fetch swc data
    return fetch('/api/custom/custom', {
      headers: {
        'content-type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        cypher: neuroglancerLayerQuery,
        dataset: dataSet
      }),
      method: 'POST',
      credentials: 'include'
    })
      .then(result => result.json())
      .then(result => {
        if ('error' in result) {
          throw result.error;
        }

        const [nInfo, primaryUUID] = result.data[0];
        let updated = layers;

        Object.values(nInfo).forEach(entry => {
          const { host, uuid, dataType: dataInstance } = entry;
          const layerName =
            dataInstance === 'segmentation' ? dataSet : `${dataSet}-${dataInstance}`;
          const dataType = dataInstance === 'segmentation' ? 'segmentation' : 'image';
          const expectedUUID = uuid === 'see meta node' ? primaryUUID : uuid;
          updated = updated.set(
            layerName,
            Immutable.Map({
              host,
              uuid: expectedUUID,
              dataInstance,
              dataType,
              dataSet: layerName
            })
          );
        });

        this.setState({ layers: updated });
      })
      .catch(error => this.setState({ loadingError: error }));
  }

  render() {
    const { layers, neurons, coordinates, loadingError } = this.state;

    if (loadingError) {
      return <div>{loadingError}</div>;
    }

    const viewerState = {
      perspectiveOrientation: [0.1, -0.3, -0.3, 0.8],
      perspectiveZoom: 95,
      navigation: {
        pose: {
          position: {
            voxelCoordinates: []
          }
        },
        zoomFactor: 8
      },
      layout: 'xy-3d',
      layers: {}
    };

    if (layers.size > 0) {
      // loop over layers and add them to the viewerState
      layers.forEach(layer => {
        // add segmentation && grayscale layers
        viewerState.layers[layer.get('dataSet')] = {
          source: `dvid://${layer.get('host')}/${layer.get('uuid')}/${layer.get('dataInstance')}`,
          type: layer.get('dataType'),
          segments: []
        };
      });
      // loop over the neurons and add them to the layers
      neurons.forEach(neuron => {
        viewerState.layers[neuron.get('dataSet')].segments.push(neuron.get('id'));
      });

      // set the x,y,z coordinates
      viewerState.navigation.pose.position.voxelCoordinates = coordinates.toJS();
      // TODO: need to be able to pass in call backs so that removing neurons in the
      // neuroglancer interface will remove them from the component state.
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <Neuroglancer perspectiveZoom={80} viewerState={viewerState} />
        </Suspense>
      );
    }

    return <div>Loading...</div>;
  }
}

NeuroGlancerView.propTypes = {
  query: PropTypes.object.isRequired
};

export default NeuroGlancerView;
