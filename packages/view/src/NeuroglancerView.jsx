import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import Neuroglancer from '@janelia-flyem/react-neuroglancer';

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
        this.addLayer(query.pm.dataSet);
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
        cypher: coordinatesQuery
      }),
      method: 'POST',
      credentials: 'include'
    })
    .then(result => result.json())
    .then(result => {
      const { neurons } = this.state;
      const updated = neurons.set(id, Immutable.Map({
        id,
        dataSet,
        color: '#ffffff',
        visible: true
      }));

      this.setState({
        neurons: updated,
        coordinates: Immutable.List(result.data[0][0]),
      });
    })
    .catch(error => this.setState({loadingError: error }));

  }

  addLayer(dataSet) {
    const { layers } = this.state;
    // TODO: fetch the layer information and store it in the state.
     const neuroglancerLayerQuery = `MATCH (n:Meta:${dataSet}) WITH apoc.convert.fromJsonMap(n.neuroglancerInfo) as nInfo, n.uuid AS uuid RETURN nInfo.segmentation.host AS segmentationHost, uuid AS segmentationUuid, nInfo.segmentation.dataType AS segmentationDataType, nInfo.grayscale.host AS grayscaleHost, nInfo.grayscale.uuid AS grayscaleUuid, nInfo.grayscale.dataType AS grayscaleDataType`;
    // fetch swc data
    return fetch('/api/custom/custom', {
      headers: {
        'content-type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        cypher: neuroglancerLayerQuery
      }),
      method: 'POST',
      credentials: 'include'
    })
      .then(result => result.json())
      .then(result => {
        if ('error' in result) {
          throw result.error;
        }
        const updated = layers.set(`${dataSet}-grayscale`, Immutable.Map({
          host: result.data[0][3],
          uuid: result.data[0][4],
          dataInstance: result.data[0][5],
          dataType: 'image',
          dataSet: `${dataSet}-grayscale`
        })).set(dataSet, Immutable.Map({
          host: result.data[0][0],
          uuid: result.data[0][1],
          dataInstance: result.data[0][2],
          dataType: 'segmentation',
          dataSet
        }));

        this.setState({ layers: updated});
      })
      .catch(error => this.stateSet({loadingError: error}));
  }

  render() {
    const { layers, neurons, coordinates } = this.state;
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
      return <Neuroglancer perspectiveZoom={80} viewerState={viewerState} />;
    }

    return <div>Loading...</div>;

  };

}

NeuroGlancerView.propTypes = {
  query: PropTypes.object.isRequired
};

export default NeuroGlancerView;
