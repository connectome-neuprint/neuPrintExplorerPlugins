import React from 'react';
import PropTypes from 'prop-types';
import Sunburst from '@neuprint/react-sunburst';

class SunburstLoader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {}
    };
  }

  componentDidMount() {
    const { bodyId, dataSet } = this.props;
    const cypher = `MATCH (n :Neuron {bodyId: ${bodyId}})<-[:From]-(cs :ConnectionSet)-[:To]->(m) MATCH (n)-[x :ConnectsTo]->(m) RETURN m.bodyId, m.type, x.weight, cs.roiInfo, m.status, 'output' as direction UNION MATCH (n :Neuron {bodyId: ${bodyId}})<-[:To]-(cs :ConnectionSet)-[:From]->(m) MATCH (n)-[x :ConnectsTo]->(m) RETURN m.bodyId, m.type, x.weight, cs.roiInfo, m.status, 'input' as direction`;

    const parameters = {
      cypher,
      dataset: dataSet
    };

    const queryUrl = '/api/custom/custom';
    const querySettings = {
      headers: {
        'content-type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(parameters),
      credentials: 'include',
      method: 'POST'
    };

    fetch(queryUrl, querySettings)
      .then(result => result.json())
      .then(resp => {
        this.constructDataObject(resp.data);
      })
      .catch(error => {
        console.log(error);
      });
  }

  constructDataObject(rawData) {
    const { bodyId } = this.props;
    const data = {
      name: bodyId,
      children: [
        {
          name: 'input',
          children: []
        },
        { name: 'output',
          children: []
        }
      ]
    };

    rawData.forEach(row => {
      const [ , type = 'none', , roisJSON, status, direction] = row;
      // check that the status is traced
      if (/(traced|leave)/i.test(status)) {
        // check if this is an input or an output
        const dirPosition = (direction === 'input') ? 0 : 1;
        const topLevel = data.children[dirPosition];

        const rois = JSON.parse(roisJSON);
        // need to obtain the super ROI list from global state?
        Object.entries(rois).forEach(([roiLabel, roiData]) => {
          let roiLevel = topLevel.children.find(el => el.name === roiLabel);
          if (!roiLevel) {
            const roiObject = { name: roiLabel, children: [] };
            topLevel.children.push(roiObject);
            roiLevel = roiObject;
          }

          let typeLevel = roiLevel.children.find(el => el.name === type);
          if (!typeLevel) {
            const typeObject = { name: type, value: 0};
            roiLevel.children.push(typeObject);
            typeLevel = typeObject;
          }

          typeLevel.value += roiData.post;
        });

      }
    });

    this.setState({ data });
  }

  render() {
    const { data } = this.state;
    const colors = ['#396a9f', '#e2b72f'];
    if (data.name) {
      return <Sunburst data={data} colors={colors} />;
    }
    return <p>Loading</p>;
  }
}

SunburstLoader.propTypes = {
  bodyId: PropTypes.object.isRequired,
  dataSet: PropTypes.string.isRequired
};

export default SunburstLoader;
