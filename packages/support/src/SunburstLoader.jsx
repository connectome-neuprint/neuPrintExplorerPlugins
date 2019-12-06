import React from 'react';
import PropTypes from 'prop-types';
import Sunburst from '@neuprint/react-sunburst';

class SunburstLoader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rawData: null,
      superROIs: null
    };
  }

  componentDidMount() {
    // fetch information about super ROIs.
    this.fetchSuperROIs();
    // fetch information about inputs/outputs
    this.fetchConnections();
  }

  componentDidUpdate(prevProps) {
    const { bodyId, dataSet } = this.props;
    if (prevProps.bodyId !== bodyId || prevProps.dataSet !== dataSet) {
      this.fetchConnections();
    }
    if (prevProps.dataSet !== dataSet) {
      this.fetchSuperROIs();
    }
  }

  fetchConnections() {
    const { bodyId, dataSet } = this.props;
    const cypher = `MATCH (n :Neuron {bodyId: ${bodyId}})-[x :ConnectsTo]->(m) RETURN m.bodyId, m.type, x.weight, x.roiInfo, m.status, 'output' as direction UNION MATCH (n :Neuron {bodyId: ${bodyId}})<-[x :ConnectsTo]-(m) RETURN m.bodyId, m.type, x.weight, x.roiInfo, m.status, 'input' as direction`;

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
        this.setState({ rawData: resp.data});
      })
      .catch(error => {
        console.log(error);
      });
  }

  fetchSuperROIs() {
    const { dataSet } = this.props;
    const cypher = `MATCH (n:Meta) RETURN n.superLevelRois`;

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
        this.setState({ superROIs: resp.data[0][0]});
      })
      .catch(error => {
        console.log(error);
      });

  }

  constructDataObject(rawData, superROIs) {
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

        // sometimes we get an empty string instead of JSON. Do nothing in those
        // cases.
        if (roisJSON === "") {
          return;
        }

        const rois = JSON.parse(roisJSON);
        // filter to show only super ROIs
        Object.entries(rois).filter(entry => superROIs.includes(entry[0])).forEach(([roiLabel, roiData]) => {
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
    return data;
  }

  render() {
    const { rawData, superROIs } = this.state;
    const colors = ['#396a9f', '#e2b72f'];
    if (rawData && superROIs) {
      const data = this.constructDataObject(rawData, superROIs);
      return <Sunburst data={data} colors={colors} />;
    }
    return <p>Loading</p>;
  }
}

SunburstLoader.propTypes = {
  bodyId: PropTypes.number.isRequired,
  dataSet: PropTypes.string.isRequired
};

export default SunburstLoader;
