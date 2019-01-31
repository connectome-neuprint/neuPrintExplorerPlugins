import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Cytoscape from './Cytoscape';

// TODO: save positions of adjusted graph when user switches tabs
// TODO: explore other positioning algorithms
// TODO: ability to click neuron to view meta info?
// TODO: colors for rois??

const styles = () => ({});

function areEqual(prevProps, nextProps) {
  if (prevProps.query.result.graph === nextProps.query.result.graph) {
    return true;
  }
  return false;
}

const Graph = React.memo(props => {
  const { query } = props;

  const minWeight = query.result.graph.minWeight ? query.result.graph.minWeight : 1;
  const maxWeight = query.result.graph.maxWeight ? query.result.graph.maxWeight : 1;
  const { elements = {} } = query.result.graph;

  const style = [
    // the stylesheet for the graph
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        label: 'data(label)',
        'text-halign': 'center',
        'text-valign': 'bottom',
        'font-size': '1em',
        'text-wrap': 'wrap',
        height: 30,
        width: 30
      }
    },
    {
      selector: 'edge',
      style: {
        width: `mapData(label,${minWeight},${maxWeight},1,10)`,
        'line-color': '#ff5959',
        'curve-style': 'bezier',
        'target-arrow-color': '#ff5959',
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
}, areEqual);

Graph.propTypes = {
  query: PropTypes.object.isRequired
  //   properties: PropTypes.object,
  //   classes: PropTypes.object.isRequired
};

// Graph.defaultProps = {
//   properties: {}
// };

export default withStyles(styles)(Graph);
