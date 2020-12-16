import React from 'react';
import PropTypes from 'prop-types';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

export default function NodeTable({ rows, columns }) {
  // for each row, create a new table row
  //   for each column create a new table cell and parse the column information out of the row

  const columnHeaders = columns.map((column) => {
    return <TableCell>{column}</TableCell>;
  });

  const formattedRows = rows.map((row) => {
    const cells = row.map((cell) => <TableCell>{cell}</TableCell>);
    return <TableRow>{cells}</TableRow>;
  });

  console.log({ rows, columns });
  return (
    <Table>
      <TableHead>
        <TableRow>{columnHeaders}</TableRow>
      </TableHead>
      <TableBody>{formattedRows}</TableBody>
    </Table>
  );
}

NodeTable.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
};
