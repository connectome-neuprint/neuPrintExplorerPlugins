/**
 * Creates a map of column identifier to column index. Column indices
 * are assigned according to the order in array. For example,
 *
 *  setColumnIndices(["id","name","size"])
 *
 * returns
 *
 *  {id:0, name:1, size:2}
 *
 * @export
 * @param {Array.<string>} propertyNames
 * @returns {Object.<string,number>}
 */
export function setColumnIndices(propertyNames) {
  const indexMap = {};
  propertyNames.forEach((p, index) => {
    indexMap[p] = index;
  });
  return indexMap;
}

export default { setColumnIndices };
