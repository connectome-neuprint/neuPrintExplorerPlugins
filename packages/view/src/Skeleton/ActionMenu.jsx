import React from 'react';
import PropTypes from 'prop-types';
import { SketchPicker } from 'react-color';
import randomColor from 'randomcolor';
import Chip from '@material-ui/core/Chip';
import List from '@material-ui/core/List';
import Grid from '@material-ui/core/Grid';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Popover from '@material-ui/core/Popover';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import { pickTextColorBasedOnBgColorAdvanced } from '@neuprint/support';

const styles = theme => ({
  chip: {
    margin: theme.spacing.unit / 2
  },
  popover: {
    width: '800px',
    overflow: 'hidden'
  },
  synapseList: {
    height: '320px',
    overflow: 'auto'
  },
  popoverTitle: {
    margin: '1em'
  },
  visToggle: {
    position: 'absolute',
    top: '5px',
    right: '5px'
  }
});

const cypherQuery =
  'MATCH (n :`<DATASET>-Neuron` {bodyId: <BODYID>})-[x :ConnectsTo]-(m) RETURN x.weight AS weight, startnode(x).bodyId AS startId, startnode(x).type AS startType, endnode(x).bodyId AS endBody, endnode(x).type AS endType ORDER BY x.weight DESC';

const presetColors = [];
for (let i = 0; i < 15; i += 1) {
  presetColors[i] = randomColor({ luminosity: 'light', hue: 'random' });
}


class ActionMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
      inputs: [],
      outputs: [],
      colorPicker: null
    };
  }

  componentDidMount() {
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
  }

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

  synapsesLoaded(result) {
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
  }

  render() {
    const { classes, bodyId, color, isVisible } = this.props;
    const { inputs, outputs, anchorEl } = this.state;

    const inputMenuItems = [...inputs].map(input => (
      <ListItem button key={input} onClick={() => this.handleInputToggle(input)}>
        <ListItemText>{input}</ListItemText>
      </ListItem>
    ));
    const outputMenuItems = [...outputs].map(output => (
      <ListItem button key={output} onClick={() => this.handleOutputToggle(output)}>
        <ListItemText>{output}</ListItemText>
      </ListItem>
    ));

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
        <Popover
          onClose={this.handleClose}
          anchorEl={anchorEl}
          key={`${bodyId}_popover`}
          open={Boolean(anchorEl)}
        >
          <Typography variant="h5" className={classes.popoverTitle}>Modify body {bodyId}</Typography>
          <FormControlLabel
            className={classes.visToggle}
            control={
              <Switch
                onChange={this.handleVisible}
                checked={isVisible}
                color="primary"
              />
            }
            label="Toggle Visible"
          />
          <Grid
            container
            spacing={24}
            className={classes.popover}
          >
            <Grid item xs={4}>
              <Typography variant="subtitle2">Inputs:</Typography>
              <List className={classes.synapseList}>
                {inputMenuItems}
              </List>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="subtitle2">Outputs:</Typography>
              <List className={classes.synapseList}>
                {outputMenuItems}
              </List>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="subtitle2">Change Color:</Typography>
              <SketchPicker
                color={color}
                onChangeComplete={this.handleChangeColor}
                presetColors={presetColors}
              />
            </Grid>
          </Grid>
        </Popover>
      </React.Fragment>
    );
  }
}

ActionMenu.propTypes = {
  bodyId: PropTypes.number.isRequired,
  dataSet: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  isVisible: PropTypes.bool.isRequired,
  handleDelete: PropTypes.func.isRequired,
  handleClick: PropTypes.func.isRequired,
  handleInputClick: PropTypes.func.isRequired,
  handleOutputClick: PropTypes.func.isRequired,
  handleChangeColor: PropTypes.func.isRequired
};

export default withStyles(styles)(ActionMenu);
