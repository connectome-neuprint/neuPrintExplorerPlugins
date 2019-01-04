/* This plugin generates a table from supplied data.
 *
 * The core component of the plugin is the class definition,
 * which extends a react component.
 *
 * The only required class method for a simple view is the render()
 * method.
 *
 */
import React from "react";
import PropTypes from "prop-types";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";

class Example extends React.Component {
  render() {
    const { query } = this.props;

    const { highlightIndex } = query.result;

    return (
      <div>
        <Table>
          <TableHead>
            <TableRow>
              {query.result.columns.map((header, index) => {
                const headerKey = `${header}${index}`;
                return <TableCell key={headerKey}>{header}</TableCell>;
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {query.result.data.map((row, index) => {
              let rowStyle = {};
              const currspot = index;
              if (highlightIndex && currspot.toString() in highlightIndex) {
                rowStyle = {
                  backgroundColor: highlightIndex[currspot.toString()]
                };
              }
              const key = index;
              return (
                <TableRow hover key={key} style={rowStyle}>
                  {row.map((cell, i) => {
                    if (cell && typeof cell === "object" && "value" in cell) {
                      const cellKey = `${i}${cell.value}`;
                      if ("action" in cell) {
                        return (
                          <TableCell key={cellKey} >
                            {cell.value}
                          </TableCell>
                        );
                      }
                      return <TableCell key={cellKey}>{cell.value}</TableCell>;
                    }
                    const cellKey = `${i}${cell}`;
                    return <TableCell key={cellKey}>{cell}</TableCell>;
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
}

Example.propTypes = {
  query: PropTypes.object.isRequired,
};

export default Example;
