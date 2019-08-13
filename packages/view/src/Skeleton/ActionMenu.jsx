import React from 'react';
import PropTypes from 'prop-types';
import { SketchPicker } from 'react-color';
import randomColor from 'randomcolor';
import Chip from '@material-ui/core/Chip';
import Menu from '@material-ui/core/Menu';
import Popover from '@material-ui/core/Popover';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';
import { pickTextColorBasedOnBgColorAdvanced } from '@neuprint/support';

const styles = theme => ({
  chip: {
    margin: theme.spacing.unit / 2
  }
});

/* const cypherQuery =
  'MATCH (n :`<DATASET>-Neuron` {bodyId: <BODYID>})-[x :ConnectsTo]-(m) RETURN x.weight AS weight, startnode(x).bodyId AS startId, startnode(x).type AS startType, endnode(x).bodyId AS endBody, endnode(x).type AS endType ORDER BY x.weight DESC';
*/

const presetColors = [];
for (let i = 0; i < 15; i += 1) {
  presetColors[i] = randomColor({ luminosity: 'light', hue: 'random' });
}


class ActionMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
      // inputs: [],
      // outputs: [],
      colorPicker: null
    };
  }

  /*  componentDidMount() {
    const { bodyId, dataSet } = this.props;
    const finalQuery = cypherQuery.replace(/<DATASET>/, dataSet).replace(/<BODYID>/, bodyId);
    fetch('/api/custom/custom', {
      headers: {
        'content-type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        cypher: finalQuery
      }),
      method: 'POST',
      credentials: 'include'
    })
      .then(result => result.json())
      .then(result => {
        if ('error' in result) {
          throw result.error;
        }
        this.synapsesLoaded(result);
      })
      .catch(error => this.setState({ loadingError: error }));
  } */

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleColorClose = () => {
    this.setState({ colorPicker: null });
  };

  handleVisible = () => {
    const { handleClick, bodyId } = this.props;
    handleClick(bodyId.toString());
    this.setState({ anchorEl: null });
  };

  handleDelete = () => {
    const { handleDelete, bodyId } = this.props;
    handleDelete(bodyId.toString());
    this.setState({ anchorEl: null });
  };

  handleInputToggle = inputFrom => {
    const { handleInputClick, bodyId } = this.props;
    handleInputClick(bodyId.toString(), inputFrom);
    this.setState({ anchorEl: null });
  };

  handleOutputToggle = outputTo => {
    const { handleOutputClick, bodyId } = this.props;
    handleOutputClick(bodyId.toString(), outputTo);
    this.setState({ anchorEl: null });
  };

  handleChangeColor = newColor => {
    const { handleChangeColor, bodyId } = this.props;
    handleChangeColor(bodyId.toString(), newColor.hex);
  };

  toggleColorPicker = event => {
    this.setState({ colorPicker: event.currentTarget });
    this.setState({ anchorEl: null });
  };

  /* synapsesLoaded(result) {
    const { bodyId } = this.props;
    // loop over the data and pull out the inputs vs the outputs.
    // store them as separate arrays in the state. They will be used later
    // for the menu when picking which ones to display.
    // inputs are anything where the start node is not the current bodyid
    const inputs = new Set();
    // outputs are anything where the end node is not the current bodyid
    const outputs = new Set();
    // must account for autapses.
    result.data.forEach(synapse => {
      if (synapse[1] !== bodyId) {
        inputs.add(synapse[1]);
      } else if (synapse[3] !== bodyId) {
        outputs.add(synapse[3]);
      }
    });

    this.setState({inputs, outputs});
  } */

  render() {
    const { classes, bodyId, color } = this.props;
    const { colorPicker, anchorEl } = this.state;
    // const { inputs, outputs, colorPicker, anchorEl } = this.state;

    /* const inputMenuItems = [...inputs].map(input => (
      <MenuItem key={input} onClick={() => this.handleInputToggle(input)}>Label Inputs from {input}</MenuItem>
    ));
    const outputMenuItems = [...outputs].map(output => (
      <MenuItem key={output} onClick={() => this.handleOutputToggle(output)}>Label Outputs to {output}</MenuItem>
    )); */

    return (
      <React.Fragment>
        <Chip
          key={bodyId}
          label={bodyId}
          onDelete={this.handleDelete}
          onClick={this.handleClick}
          className={classes.chip}
          style={{
            background: color,
            color: pickTextColorBasedOnBgColorAdvanced(color, '#fff', '#000')
          }}
        />
        <Menu
          key={`${bodyId}_menu`}
          id="simple-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handleClose}
        >
          <MenuItem onClick={this.handleVisible}>Toggle Visible</MenuItem>
          <MenuItem onClick={this.toggleColorPicker}>Change Color</MenuItem>
          {/* inputMenuItems */}
          {/* outputMenuItems */}
        </Menu>
        <Popover
          onClose={this.handleColorClose}
          anchorEl={colorPicker}
          key={`${bodyId}_color`}
          open={Boolean(colorPicker)}
        >
          <SketchPicker
            color={color}
            onChangeComplete={this.handleChangeColor}
            presetColors={presetColors}
          />
        </Popover>
      </React.Fragment>
    );
  }
}

ActionMenu.propTypes = {
  bodyId: PropTypes.number.isRequired,
  // dataSet: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  handleDelete: PropTypes.func.isRequired,
  handleClick: PropTypes.func.isRequired,
  handleInputClick: PropTypes.func.isRequired,
  handleOutputClick: PropTypes.func.isRequired,
  handleChangeColor: PropTypes.func.isRequired
};

export default withStyles(styles)(ActionMenu);
