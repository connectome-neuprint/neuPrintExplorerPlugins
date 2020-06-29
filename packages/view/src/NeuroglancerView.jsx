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
    if (query.pm.dataset) {
      if (query.pm.bodyIds) {
        const bodyIds = query.pm.bodyIds.toString().split(',');
        this.addLayers(query.pm.dataset);
        this.addNeurons(bodyIds, query.pm.dataset);
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
    const coordinatesQuery = `MATCH (n :Segment {bodyId: ${id}})-[:Contains]->(:SynapseSet)-[:Contains]->(ss) RETURN ss.location.x, ss.location.y, ss.location.z limit 1`;
    return fetch('/api/custom/custom?np_explorer=neuroglancer_neuron_coordinates', {
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
          coordinates: Immutable.List(result.data[0])
        });
      })
      .catch(error => this.setState({ loadingError: error }));
  }

  addLayers(dataSet) {
    const { layers } = this.state;
    // TODO: fetch the layer information and store it in the state.
    const neuroglancerLayerQuery = `MATCH (n:Meta) WITH apoc.convert.fromJsonList(n.neuroglancerMeta) as nInfo RETURN nInfo`;
    // fetch swc data
    return fetch('/api/custom/custom?np_explorer=neuroglancer_layer_info', {
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
          const layerName =
            dataType === 'segmentation' && dataInstance === 'segmentation'
              ? dataSet
              : `${dataSet}-${dataInstance}`;
          const modified = Object.assign({}, entry, { name: layerName });
          updated = updated.set(layerName, Immutable.Map(modified));
        });

        this.setState({ layers: updated });
      })
      .catch(error => this.setState({ loadingError: error }));
  }

  render() {
    const { layers, neurons, coordinates, loadingError } = this.state;

    if (loadingError) {
      return <div>{loadingError.message}</div>;
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
        const host = layer.get('host').replace(/\/+$/, '');
        let source = layer.get('source', null);

        if (!source) {
          source = `dvid://${host}/${layer.get('uuid')}/${layer.get('dataInstance')}`;

          if (layer.get('dataType') === 'annotation' && layer.get('dataInstance') !== 'synapses') {
            source += `?usertag=true&auth=${host}/api/server/token`;
          }
        }

        const dataSetName = layer.get('name').split('-')[0];

        const layerInfo = {
          type: layer.get('dataType'),
          tab: 'source',
          segments: []
        };

        if (typeof source === 'string') {
          layerInfo.source = {
            url: source
          };
        } else {
          layerInfo.source = source;
        }

        if (layer.get('linkedSegmentationLayer')) {
          layerInfo.linkedSegmentationLayer = {
            pre_synaptic_cell: dataSetName,
            post_synaptic_cell: dataSetName
          };
          layerInfo.filterBySegmentation = ['post_synaptic_cell', 'pre_synaptic_cell'];
        }

        layerInfo.visible = layer.get('visible', true);

        if (layer.get('tool')) {
          layerInfo.tool = layer.get('tool');
        }

        if (layer.get('name', '') === `${dataSetName}-public_annotations`) {
          layerInfo.annotationColor = '#ff0000';
          layerInfo.shader =
            '#uicontrol vec3 falseSplitColor color(default="#F08040")\n#uicontrol vec3 falseMergeColor color(default="#F040F0")\n#uicontrol vec3 checkedColor color(default="green")\n#uicontrol vec3 borderColor color(default="black")\n\n#uicontrol float radius slider(min=3, max=20, step=1, default=10)\n#uicontrol float opacity slider(min=0, max=1, step=0.1, default=1)  \n\nvoid main() {\n  setPointMarkerSize(radius);\n  float finalOpacity = PROJECTION_VIEW ? opacity * 0.2 : opacity;\n\n  setPointMarkerBorderColor(vec4(borderColor, finalOpacity));\n  if (prop_rendering_attribute() == 1) {\n    setColor(vec4(checkedColor, finalOpacity));\n  } else if (prop_rendering_attribute() == 2) {    \n    setColor(vec4(falseSplitColor, finalOpacity));\n  } else if (prop_rendering_attribute() == 3)  {\n    setColor(vec4(falseMergeColor, finalOpacity));\n  } else {\n setColor(vec4(1, 0, 0, finalOpacity));\n  }\n}';
        } else if (layer.get('name', '') === `${dataSetName}-synapses`) {
          layerInfo.shader =
            '#uicontrol vec3 preColor color(default="yellow")\n#uicontrol vec3 postColor color(default="gray")\n#uicontrol float preConfidence slider(min=0, max=1, default=0)\n#uicontrol float postConfidence slider(min=0, max=1, default=0)\n#uicontrol float sliceViewOpacity slider(min=0, max=1, default=0.5)\n#uicontrol float projectionViewOpacity slider(min=0, max=1, default=0.3)\n\nvoid main() {\n  float opacity = PROJECTION_VIEW ? projectionViewOpacity : sliceViewOpacity;\n  setColor(vec4(defaultColor(), opacity));\n  setEndpointMarkerColor(\n    vec4(preColor, opacity),\n    vec4(postColor, opacity));\n  setEndpointMarkerBorderColor(\n    vec4(0, 0, 0, opacity),\n    vec4(0, 0, 0,     opacity)\n  );\n\n  setEndpointMarkerSize(5.0, 5.0);\n  setLineWidth(2.0);\n  if (prop_pre_synaptic_confidence()< preConfidence ||\n  prop_post_synaptic_confidence()< postConfidence) discard;\n}\n';
        }

        viewerState.layers[layer.get('name')] = layerInfo;
      });
      // loop over the neurons and add them to the layers
      neurons.forEach(neuron => {
        if (viewerState.layers[neuron.get('dataSet')]) {
          viewerState.layers[neuron.get('dataSet')].segments.push(neuron.get('id'));
        } else {
          console.log(`Couldn't find neuroglancer layer ${neuron.get('dataSet')} to add neurons.`);
        }
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
