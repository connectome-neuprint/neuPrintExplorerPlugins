import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Cytoscape from './Cytoscape';

const styles = () => ({});

const Graph = props => {
  const { query } = props;

  let elements;
  const minWeight = query.result.data.minWeight ? query.result.data.minWeight : 1;
  const maxWeight = query.result.data.maxWeight ? query.result.data.maxWeight : 1;
  if (query.result.data === undefined) {
    elements = {
      nodes: [
        { data: { id: 'cat' } },
        { data: { id: 'bird' } },
        { data: { id: 'ladybug' } },
        { data: { id: 'aphid' } },
        { data: { id: 'rose' } },
        { data: { id: 'grasshopper' } },
        { data: { id: 'plant' } },
        { data: { id: 'wheat' } }
      ],
      edges: [
        { data: { source: 'cat', target: 'bird' } },
        { data: { source: 'bird', target: 'ladybug' } },
        { data: { source: 'bird', target: 'grasshopper' } },
        { data: { source: 'grasshopper', target: 'plant' } },
        { data: { source: 'grasshopper', target: 'wheat' } },
        { data: { source: 'ladybug', target: 'aphid' } },
        { data: { source: 'aphid', target: 'rose' } }
      ]
    };
  } else {
    elements = { nodes: query.result.data.nodes, edges: query.result.data.edges };
  }

  const style = [
    // the stylesheet for the graph
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        label: 'data(id)',
        'text-halign': 'center',
        'text-valign': 'bottom',
        height: 30,
        width: 30,
        'font-size': '1.5em'
      }
    },
    {
      selector: 'edge',
      style: {
        width: `mapData(label,${minWeight},${maxWeight},1,10)`,
        'line-color': '#ffaaaa',
        'curve-style': 'bezier',
        'target-arrow-color': '#ffaaaa',
        'target-arrow-shape': 'triangle',
        label: 'data(label)',
        'font-size': '1em'
      }
    },
    {
      selector: '.autorotate',
      style: {
        'edge-text-rotation': 'autorotate'
      }
    }
  ];

  return (
    <Cytoscape
      elements={elements}
      style={style}
      layout={{
        // name: 'klay'
        name: 'breadthfirst',
        directed: true,
        padding: 10
      }}
    />
  );
};

Graph.propTypes = {
  query: PropTypes.object.isRequired
  //   properties: PropTypes.object,
  //   classes: PropTypes.object.isRequired
};

// Graph.defaultProps = {
//   properties: {}
// };

export default withStyles(styles)(Graph);
