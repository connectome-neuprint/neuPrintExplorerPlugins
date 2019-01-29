import React from 'react';
import cytoscape from 'cytoscape';
import PropTypes from 'prop-types';
// import klay from 'cytoscape-klay';

// cytoscape.use(klay);

export default class Cytoscape extends React.Component {
  constructor(props) {
    super(props);
    this.cyRef = React.createRef();
  }

  componentDidMount() {
    this.build();
  }

  componentDidUpdate() {
    this.destroy();
    this.build();
  }

  componentWillUnmount() {
    this.destroy();
  }

  build() {
    const { elements, style, layout } = this.props;
    this.cy = cytoscape({
      container: this.cyRef.current,
      elements,
      style,
      layout
    });
  }

  destroy() {
    if (this.cy) {
      this.cy.destroy();
    }
  }

  render() {
    return <div ref={this.cyRef} style={{ height: '60vh' }} />;
  }
}

Cytoscape.propTypes = {
  elements: PropTypes.object.isRequired,
  style: PropTypes.arrayOf(PropTypes.object).isRequired,
  layout: PropTypes.object.isRequired
};
