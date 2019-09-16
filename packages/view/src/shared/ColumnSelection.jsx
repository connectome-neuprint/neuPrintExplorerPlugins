import React from 'react';
import PropTypes from 'prop-types';
import Chip from '@material-ui/core/Chip';
import ConfirmationDialog from './ConfirmationDialog';

class ColumnSelection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      menuVisible: false
    };
  }

  handleMenuToggle = () => {
    const { menuVisible } = this.state;
    this.setState({menuVisible: !menuVisible });
  };

  handleClose = () => {
    this.setState({menuVisible: false });
  };

  render() {
    const { columns, onChange } = this.props;
    const { menuVisible } = this.state;
    const columnTotal = columns.length;
    const columnsVisible = columns.filter(column => column[1]).length;
    const labelText = `Columns Visible ${columnsVisible} / ${columnTotal}`;

    return (
      <React.Fragment>
        <Chip
          style={{margin: '0.5em 0.5em', float: 'left'}}
          label={labelText}
          onClick={this.handleMenuToggle}
        />
        <ConfirmationDialog
          open={menuVisible}
          columns={columns}
          onChange={onChange}
          onConfirm={this.handleClose}
        />
      </React.Fragment>
    );
  }
}

ColumnSelection.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.array).isRequired,
  onChange: PropTypes.func.isRequired
};

export default ColumnSelection;
