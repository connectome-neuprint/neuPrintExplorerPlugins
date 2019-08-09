import React from 'react';
import PropTypes from 'prop-types';
import { SketchPicker } from 'react-color';
import Chip from '@material-ui/core/Chip';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  chip: {
    margin: theme.spacing.unit / 2
  }
});

const cypherQuery = 'MATCH (n :`<DATASET>-Neuron` {bodyId: <BODYID>})-[x :ConnectsTo]-(m) RETURN x.weight, startnode(x).bodyId, endnode(x).bodyId ORDER BY x.weight DESC';


class ActionMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
      inputs: [],
      outputs: [],
      colorPicker: false
    };
  }

  componentDidMount() {
    const { name, dataSet } = this.props;
    const finalQuery = cypherQuery.replace(/<DATASET>/, dataSet).replace(/<NAME>/, name);
    fetch(finalQuery)
      .then((res) => res.json())
      .then(json => {
          this.setState({inputs: json.inputs, outputs: json.outputs});
      })
  }

  handleClick = (event) => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleVisible = () => {
    const { handleClick, name } = this.props;
    handleClick(name);
    this.setState({ anchorEl: null });
  }

  handleInputToggle = (inputFrom) => {
    const { handleInputClick, name } = this.props;
    handleInputClick(name, inputFrom);
    this.setState({ anchorEl: null });
  }

  handleOutputToggle = (outputTo) => {
    const { handleOutputClick, name } = this.props;
    handleOutputClick(name, outputTo);
    this.setState({ anchorEl: null });
  }


  handleChangeColor = (newColor) => {
    const { handleChangeColor, name } = this.props;
    handleChangeColor(name, newColor.hex);
    this.setState({ anchorEl: null });
  }

  toggleColorPicker = () => {
    this.setState({colorPicker: true});
    this.setState({ anchorEl: null });
  }

  render() {
    const { classes, name, color, handleDelete } = this.props;
    const { inputs, outputs, colorPicker } = this.state;
    const { anchorEl } = this.state;

    const inputMenuItems = inputs.map(input => <MenuItem onClick={() => this.handleInputToggle(input)}>Show Inputs for {input}</MenuItem>);
    const outputMenuItems = outputs.map(output => <MenuItem onClick={() => this.handleOutputToggle(output)}>Show Outputs for {output}</MenuItem>);

    return (
      <React.Fragment>
        <Chip
          key={name}
          label={name}
          onDelete={() => handleDelete(name)}
          onClick={this.handleClick}
          className={classes.chip}
          style={{ background: color }}
        />
        <Menu
          key={`${name}_menu`}
          id="simple-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handleClose}
        >
          <MenuItem onClick={this.handleVisible}>Toggle Visible</MenuItem>
          <MenuItem onClick={this.toggleColorPicker}>Change Color</MenuItem>
          {inputMenuItems}
          {outputMenuItems}
        </Menu>
        { colorPicker && <SketchPicker color={color} onChangeComplete={this.handleChangeColor} />}
      </React.Fragment>
    );
  }
}

ActionMenu.propTypes = {
  name: PropTypes.string.isRequired,
  dataSet: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  handleDelete: PropTypes.func.isRequired,
  handleClick: PropTypes.func.isRequired,
  handleInputClick: PropTypes.func.isRequired,
  handleOutputClick: PropTypes.func.isRequired,
  handleChangeColor: PropTypes.func.isRequired
};

export default withStyles(styles)(ActionMenu);
