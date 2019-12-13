import React from 'react';
import PropTypes from 'prop-types';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import Icon from '@material-ui/core/Icon';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import { SunburstLoader, SkeletonLoader } from '@neuprint/support';
import CellTypeHeatMap from './CellTypeView/CellTypeHeatMap';
import NeuronSelection from './CellTypeView/NeuronSelection';

class CellTypeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      exemplarId: null,
      graphicTab: 0
    };
  }

  componentDidMount() {
    const { query } = this.props;
    const { result } = query;
    this.setState({ exemplarId: parseInt(result.data['centroid-neuron'], 10) });
  }

  handleExemplarChange = selected => {
    this.setState({ exemplarId: parseInt(selected.value, 10) });
  };

  handleGraphicChange = (event, selected) => {
    this.setState({ graphicTab: selected });
  };

  render() {
    const { exemplarId, graphicTab } = this.state;
    const { query } = this.props;

    if (!exemplarId) {
      return <p>loading</p>;
    }

    const exemplar = query.result.data.neuroninfo[exemplarId] || {};
    const neuronCount = Object.keys(query.result.data.neuroninfo).length;

    return (
      <div>
        <Typography variant="h4" gutterBottom>
          Cell Type: {query.pm.cellType}
        </Typography>
        <p>Neuron count: {neuronCount}</p>

        <Grid container spacing={24}>
          <Grid item xs={6}>
            <InputLabel htmlFor="exemplarSelect">Select an example instance.</InputLabel>
            <NeuronSelection
              neuronInfo={query.result.data.neuroninfo}
              exemplarId={exemplarId}
              onChange={this.handleExemplarChange}
            />
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
            <Tabs
              value={graphicTab}
              onChange={this.handleGraphicChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Skeleton" />
              <Tab label="Sunburst" />
            </Tabs>
            {graphicTab === 0 && (
              <SkeletonLoader bodyIds={[parseInt(exemplarId, 10)]} dataSet={query.pm.dataset} />
            )}
            {graphicTab === 1 && (
              <SunburstLoader bodyId={parseInt(exemplarId, 10)} dataSet={query.pm.dataset} />
            )}
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h6">Top inputs/outputs for {exemplarId}</Typography>
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
                <Typography variant="h6">Missing inputs/outputs</Typography>
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
            <p>Common inputs</p>
            <CellTypeHeatMap
              data={query.result.data['common-inputs']}
              median={query.result.data['common-inputs-med']}
            />
            <p>Common outputs</p>
            <CellTypeHeatMap
              data={query.result.data['common-outputs']}
              median={query.result.data['common-outputs-med']}
            />
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
