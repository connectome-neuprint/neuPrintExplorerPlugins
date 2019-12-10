import React from 'react';
import PropTypes from 'prop-types';

import Select from 'react-select';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Icon from '@material-ui/core/Icon';

import { SunburstLoader, SkeletonLoader } from '@neuprint/support';
import HeatMap from '@neuprint/react-heatmap';

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

    const heatMapData = [];

    query.result.data['common-inputs'].data.forEach((row, i) => {
      row.forEach((column, j) => {
        heatMapData.push({
          column:  query.result.data['common-inputs'].columns[j],
          row: query.result.data['common-inputs'].index[i],
          value: column
        });
      });
    });

    const heatMapYLabels = query.result.data['common-inputs'].index;
    const heatMapXLabels = query.result.data['common-inputs'].columns;
    const heatMapHeight = (query.result.data['common-inputs'].index.length * 15) + 150;
    const heatMapWidth = (query.result.data['common-inputs'].columns.length * 15) + 150;

    return (
      <div>
        <p>Cell Type {exemplar['instance-name']} </p>
        <p>Neuron count: {Object.keys(query.result.data.neuroninfo).length}</p>
        <Select
          options={bodyIds}
          onChange={this.handleExemplarChange}
          value={{ value: exemplarId, label: exemplarId }}
        />
        <p>
          Reference warning: Is this a reference sequence? trusted?{' '}
          {exemplar.reference && <Icon fontSize="inherit">done</Icon>}{' '}
        </p>
        <p>Inputs & Outputs summary</p>

        <p>Skeleton viewer</p>
        <div style={{ width: '200px', height: '200px' }}>
          <SkeletonLoader bodyIds={[parseInt(exemplarId, 10)]} dataSet={query.pm.dataset} />
        </div>

        <p>Sunburst Plot</p>
        <div style={{ width: '200px', height: '200px' }}>
          <SunburstLoader bodyId={parseInt(exemplarId, 10)} dataSet={query.pm.dataset} />
        </div>
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

        <p>Common inputs/outputs</p>
        <HeatMap
          data={heatMapData}
          xLabels={heatMapXLabels}
          yLabels={heatMapYLabels}
          height={heatMapHeight}
          width={heatMapWidth}
          maxColor="#396a9f"
        />
      </div>
    );
  }
}

CellTypeView.propTypes = {
  query: PropTypes.object.isRequired
};

export default CellTypeView;
