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
    const neuroglancerLayerQuery = `MATCH (n:Meta) WITH apoc.convert.fromJsonList(n.neuroglancerMeta) as nInfo RETURN nInfo`;
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

        const [nInfo] = result.data[0];
        let updated = layers;

        nInfo.forEach(entry => {
          const { dataType, dataInstance } = entry;
          const layerName = dataType === 'segmentation' ? dataSet : `${dataSet}-${dataInstance}`;
          const modified = Object.assign({}, entry, { name: layerName});
          updated = updated.set(
            layerName,
            Immutable.Map(modified)
          );
        });

        this.setState({ layers: updated });
      })
      .catch(error => this.setState({ loadingError: error }));
  }

  render() {
    const { layers, neurons, coordinates, loadingError } = this.state;
    const { user } = this.props;

    const userName = user.get('userInfo',{}).Email;

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
        let source = `dvid://${layer.get('host')}/${layer.get('uuid')}/${layer.get('dataInstance')}`;

        if (layer.get('dataType') === 'annotation' && layer.get('dataInstance') !== 'synapses') {
          source += `?user=${userName}&usertag=true`;
        }

        const layerInfo = {
          source,
          type: layer.get('dataType'),
          segments: []
        };

        if (layer.get('linkedSegmentationLayer')) {
          layerInfo.linkedSegmentationLayer = 'hemibrain';
        }

        if (layer.get('tool')) {
          layerInfo.tool = layer.get('tool');
          viewerState.selectedLayer = {
            layer: layer.get('name'),
            visible: true
          };
        }

        viewerState.layers[layer.get('name')] = layerInfo;
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
  query: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired
};

export default NeuroGlancerView;
