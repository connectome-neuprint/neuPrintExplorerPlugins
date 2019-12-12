import React from 'react';
import PropTypes from 'prop-types';

import Select from 'react-select';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Icon from '@material-ui/core/Icon';
import Grid from '@material-ui/core/Grid';

import { SunburstLoader, SkeletonLoader } from '@neuprint/support';
import CellTypeHeatMap from './visualization/CellTypeHeatMap';

class CellTypeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      exemplarId: null
    };
  }

  componentDidMount() {
    const { query } = this.props;
    const { result } = query;
    this.setState({ exemplarId: result.data['centroid-neuron'] });
  }

  handleExemplarChange = selected => {
    this.setState({ exemplarId: selected.value });
  };

  render() {
    const { exemplarId } = this.state;
    const { query } = this.props;

    if (!exemplarId) {
      return <p>loading</p>;
    }

    const exemplar = query.result.data.neuroninfo[exemplarId] || {};
    const bodyIds = Object.keys(query.result.data.neuroninfo).map(item => ({
      value: item,
      label: item
    }));
    const neuronCount = Object.keys(query.result.data.neuroninfo).length;

    return (
      <div>
        <p>Cell Type:{query.pm.cellType} </p>
        <p>Neuron count: {neuronCount}</p>

        <Grid container spacing={24}>
          <Grid item xs={6}>
            <Select
              options={bodyIds}
              onChange={this.handleExemplarChange}
              value={{ value: exemplarId, label: exemplarId }}
            />
            <p>Instance: {exemplar['instance-name']} </p>
            <p>
              Reference warning: Is this a reference sequence? trusted?{' '}
              {exemplar.reference && <Icon fontSize="inherit">done</Icon>}{' '}
            </p>
            <p>Inputs & Outputs summary</p>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">Inputs</TableCell>
                  <TableCell align="center">Outputs</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell align="center">{exemplar['input-size']}</TableCell>
                  <TableCell align="center">{exemplar['output-size']}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
          <Grid item xs={6}>
            <p>Skeleton viewer</p>
            <SkeletonLoader bodyIds={[parseInt(exemplarId, 10)]} dataSet={query.pm.dataset} />
          </Grid>
          <Grid item xs={6} />
          <Grid item xs={6}>
            <p>Sunburst Plot</p>
            <div style={{ width: '200px', height: '200px' }}>
              <SunburstLoader bodyId={parseInt(exemplarId, 10)} dataSet={query.pm.dataset} />
            </div>
          </Grid>
          <Grid item xs={6}>
            <p>
              Top inputs/outputs ({query.result.data['neuron-inputs'][exemplarId].data.length}) for{' '}
              {exemplarId}
            </p>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cell Type Inputs</TableCell>
                  <TableCell align="right">Neuron Weight</TableCell>
                  <TableCell align="right">Group Weight</TableCell>
                  <TableCell align="right">Good Match</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {query.result.data['neuron-inputs'][exemplarId].data.map((row, i) => {
                  const [cellType, neuronWeight, groupWeight, goodMatch] = row;
                  const key = `${exemplarId}${row}${i}`;
                  return (
                    <TableRow key={key}>
                      <TableCell component="th" scope="row">
                        {cellType}
                      </TableCell>
                      <TableCell align="right">{neuronWeight}</TableCell>
                      <TableCell align="right">{groupWeight}</TableCell>
                      <TableCell align="right">
                        {goodMatch && <Icon fontSize="inherit">done</Icon>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cell Type Outputs</TableCell>
                  <TableCell align="right">Neuron Weight</TableCell>
                  <TableCell align="right">Group Weight</TableCell>
                  <TableCell align="right">Good Match</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {query.result.data['neuron-outputs'][exemplarId].data.map((row, i) => {
                  const [cellType, neuronWeight, groupWeight, goodMatch] = row;
                  const key = `${exemplarId}${row}${i}`;
                  return (
                    <TableRow key={key}>
                      <TableCell component="th" scope="row">
                        {cellType}
                      </TableCell>
                      <TableCell align="right">{neuronWeight}</TableCell>
                      <TableCell align="right">{groupWeight}</TableCell>
                      <TableCell align="right">
                        {goodMatch && <Icon fontSize="inherit">done</Icon>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Grid>
          <Grid item xs={6}>
            {neuronCount > 1 && (
              <React.Fragment>
                <p>Missing inputs/outputs</p>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Missing Outputs</TableCell>
                      <TableCell align="right">Neuron Weight</TableCell>
                      <TableCell align="right">Group Weight</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {query.result.data['neuron-missed-outputs'][exemplarId].data.map((row, i) => {
                      const [cellType, groupWeight, neuronWeight] = row;
                      const key = `${exemplarId}${row}${i}`;
                      return (
                        <TableRow key={key}>
                          <TableCell component="th" scope="row">
                            {cellType}
                          </TableCell>
                          <TableCell align="right">{neuronWeight}</TableCell>
                          <TableCell align="right">{groupWeight}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Missing Inputs</TableCell>
                      <TableCell align="right">Neuron Weight</TableCell>
                      <TableCell align="right">Group Weight</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {query.result.data['neuron-missed-inputs'][exemplarId].data.map((row, i) => {
                      const [cellType, groupWeight, neuronWeight] = row;
                      const key = `${exemplarId}${row}${i}`;
                      return (
                        <TableRow key={key}>
                          <TableCell component="th" scope="row">
                            {cellType}
                          </TableCell>
                          <TableCell align="right">{neuronWeight}</TableCell>
                          <TableCell align="right">{groupWeight}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </React.Fragment>
            )}
          </Grid>
        </Grid>

        {neuronCount > 1 && (
          <React.Fragment>
            <p>Common inputs/outputs</p>
            <CellTypeHeatMap data={query.result.data['common-inputs']} />
          </React.Fragment>
        )}
      </div>
    );
  }
}

CellTypeView.propTypes = {
  query: PropTypes.object.isRequired
};

export default CellTypeView;
