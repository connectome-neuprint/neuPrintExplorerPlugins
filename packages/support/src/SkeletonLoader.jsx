import React from 'react';
import PropTypes from 'prop-types';
import Skeleton from '@neuprint/react-skeleton';

class SkeletonLoader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      swc: null
    };
  }

  componentDidMount() {
    this.fetchSWC();
  }

  componentDidUpdate(prevProps) {
    const { bodyIds, dataSet } = this.props;
    if (prevProps.bodyIds !== bodyIds || prevProps.dataSet !== dataSet) {
      this.fetchSWC();
    }
  }

  fetchSWC() {
    const { bodyIds, dataSet } = this.props;
    fetch(`/api/skeletons/skeleton/${dataSet}/${bodyIds[0]}`, {
      headers: {
        'content-type': 'application/json',
        Accept: 'application/json'
      },
      method: 'GET',
      credentials: 'include'
    })
      .then(result => result.json())
      .then(result => {
        if ('error' in result) {
          throw result.error;
        }
        const data = {};

        result.data.forEach(row => {
          data[parseInt(row[0], 10)] = {
            x: parseInt(row[1], 10),
            y: parseInt(row[2], 10),
            z: parseInt(row[3], 10),
            radius: parseInt(row[4], 10),
            parent: parseInt(row[5], 10)
          };
        });

        this.setState({ swc: data });
      })
      .catch(error => console.log(error));
  }

  render() {
    const { bodyIds, dataSet } = this.props;
    const { swc } = this.state;
    if (!swc) {
      const loadingString = `Loading...${bodyIds[0]}, ${dataSet}`;
      return <p>{loadingString}</p>;
    }


    return <Skeleton swc={swc} />;
  }
}

SkeletonLoader.propTypes = {
  bodyIds: PropTypes.arrayOf(PropTypes.number).isRequired,
  dataSet: PropTypes.string.isRequired
};

export default SkeletonLoader;
