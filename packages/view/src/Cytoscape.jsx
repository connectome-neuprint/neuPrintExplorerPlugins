import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@material-ui/core/Icon';
import Fab from '@material-ui/core/Fab';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  download: {
    position: 'absolute',
    right: theme.spacing.unit,
    bottom: theme.spacing.unit,
    zIndex: 100
  }
});

class Cytoscape extends React.Component {
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

  handleDownload = () => {
    const exportData = JSON.stringify(this.cy.json());
    const element = document.createElement('a');
    const file = new Blob([exportData], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = 'graph.json';
    document.body.appendChild(element);
    element.click();
    setTimeout(() => {
      document.body.removeChild(element);
      URL.revokeObjectURL(file);
    }, 100);
  };

  build() {
    const { elements, style, layout } = this.props;
    import('cytoscape').then(cytoscape => {
      this.cy = cytoscape.default({
        container: this.cyRef.current,
        elements,
        style,
        layout
      });
      // uncomment this for debugging in the console.
      // window.cy = this.cy;
    });
  }

  destroy() {
    if (this.cy) {
      this.cy.destroy();
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <div ref={this.cyRef} style={{ height: '60vh' }}>
        <Fab
          color="primary"
          className={classes.download}
          aria-label="Download data"
          onClick={() => {
            this.handleDownload();
          }}
        >
          <Icon style={{ fontSize: 18 }}>file_download</Icon>
        </Fab>
      </div>
    );
  }
}

Cytoscape.propTypes = {
  elements: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  style: PropTypes.arrayOf(PropTypes.object).isRequired,
  layout: PropTypes.object.isRequired
};

export default withStyles(styles)(Cytoscape);
