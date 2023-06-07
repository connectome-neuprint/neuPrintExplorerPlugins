import React, { useState, useEffect } from 'react';
import PropTypes from "prop-types";

import { Sketch, NeuprintExecutor } from '@vimo-public/vimo-sketches';

export default function Vimo({
  isQuerying,
  dataServer,
  dataVersion,
  token,
  vimoServer,
  processRequest,
}) {
  const ne = new NeuprintExecutor(dataServer, dataVersion, token, vimoServer);

  const [attributes, setAttributes] = useState({
    getMotifCount: ne.getMotifCount,
    getRelativeMotifCount: ne.getRelativeMotifCount,
    isQuerying,
    displayMotifCount: dataVersion.match(/^hemibrain/),
  });

  useEffect(async () => {
    setAttributes({
      ...attributes,
      NodeFields: await ne.getNodeFields(),
      EdgeFields: await ne.getEdgeFields(),
    });
  }, []);

  const processor = async (motifJson, lim) => {
    const query = await ne.json2cypher(motifJson, lim);
    processRequest(query);
  };

  return <Sketch processRequest={processor} attributes={attributes} />;
}

Vimo.propTypes = {
  isQuerying: PropTypes.bool.isRequired,
  dataServer: PropTypes.string.isRequired,
  dataVersion: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  vimoServer: PropTypes.string.isRequired,
  processRequest: PropTypes.func.isRequired,
};
