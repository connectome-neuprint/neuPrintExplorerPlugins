import React from 'react';
import { pickTextColorBasedOnBgColorAdvanced } from '@neuprint/support';
import ColorBox from '@neuprint/colorbox';

const colorArray = [
  '#4e79a7',
  '#f28e2b',
  '#e15759',
  '#76b7b2',
  '#59a14f',
  '#edc948',
  '#b07aa1',
  '#9c755f',
  '#bab0ac'
];
let usedColorIndex = 0;
const pixelsPerPercentage = 4;
const roiToColorMap = {};

export function MiniROIBarGraph({ listOfRoisToUse, roiInfoObject, roiInfoObjectKey, sumOfValues }) {
  const type = roiInfoObjectKey;

  // if the total is 0 then bail out early, since the

  if (sumOfValues === 0) {
    return (
      <ColorBox
        key="none"
        margin={0}
        width={100 * pixelsPerPercentage}
        height={20}
        backgroundColor="#eeeeee"
        color="#cccccc"
        title="0%"
        text="0%"
      />
    );
  }

  let sumOfPercentages = 0;

  // to get a set of percentage that add up to 100% we need to do more than just round the
  // values off. See https://stackoverflow.com/questions/13483430/how-to-make-rounded-percentages-add-up-to-100
  // for more details.
  const roiWithColors = Object.keys(roiInfoObject)
    .map(roi => {
      if (listOfRoisToUse.find(element => element === roi)) {
        let color;
        if (roiToColorMap[roi]) {
          color = roiToColorMap[roi];
        } else {
          roiToColorMap[roi] = colorArray[usedColorIndex];
          color = colorArray[usedColorIndex];
          if (usedColorIndex < colorArray.length - 1) {
            usedColorIndex += 1;
          } else {
            usedColorIndex = 0;
          }
        }
        const percentage = ((roiInfoObject[roi][type] * 1.0) / sumOfValues) * 100 || 0;
        const integer = Math.floor(percentage);
        const decimal = Math.abs(percentage) - Math.floor(Math.abs(percentage));
        sumOfPercentages += integer;
        return [roi, integer, decimal, color];
      }
      return null;
    })
    .filter(item => item)
    .sort((a, b) => b[2] - a[2]);

  // loop over the results and add 1 to the values with the biggest remainder
  // until the sum = 100%. Assumes that the array is order by the decimal portion
  // due to the sorting of the roiWithColors array after the previous map operation.
  if (100 - sumOfPercentages) {
    for (let i = 0; i < 100 - sumOfPercentages; i += 1) {
      // check that 'i' is in the array. If it is out of range, then something went
      // wrong with the data and we can't calculate an accurate percentage.
      if (roiWithColors[i]) {
        roiWithColors[i][1] += 1;
      } else {
        return (
          <ColorBox
            key="error"
            margin={0}
            width={100 * pixelsPerPercentage}
            height={20}
            backgroundColor="#00000"
            color="#ff0000"
            borderColor="#ff0000"
            title="Error calculating %"
            text="Error calculating %"
          />
        );
      }
    }
  }

  const colors = roiWithColors
    .sort((a, b) => {
      if (a[0] < b[0]) {
        return -1;
      }
      if (a[0] > b[0]) {
        return 1;
      }
      return 0;
    })
    .map(roi => {
      const [roiName, integer, , color] = roi;
      // if percent turns out to be Nan, then we don't want to show it, so return nothing.
      if (!integer) {
        return null;
      }

      let text = '';
      if (integer > 30) {
        text = `${roiName} ${integer}%`;
      } else if (integer > 10) {
        text = `${integer}%`;
      }

      const textColor = pickTextColorBasedOnBgColorAdvanced(color, '#fff', '#000');
      return (
        <ColorBox
          key={roiName}
          margin={0}
          width={integer * pixelsPerPercentage}
          height={20}
          backgroundColor={color}
          color={textColor}
          title={`${roiName} ${integer}%`}
          text={text}
        />
      );
    });
  return colors;
}

export default ({ roiList, roiInfoObject, preTotal, postTotal }) => {
  const styles = {
    display: 'flex',
    flexDirection: 'row',
    margin: '5px'
  };

  const inputBar = (
    <div key="post" style={styles}>
      <MiniROIBarGraph
        roiInfoObject={roiInfoObject}
        listOfRoisToUse={roiList}
        roiInfoObjectKey="post"
        sumOfValues={postTotal}
      />
      inputs
    </div>
  );
  const outputBar = (
    <div key="pre" style={styles}>
      <MiniROIBarGraph
        roiInfoObject={roiInfoObject}
        listOfRoisToUse={roiList}
        roiInfoObjectKey="pre"
        sumOfValues={preTotal}
      />
      outputs
    </div>
  );

  return [inputBar, outputBar];
};
