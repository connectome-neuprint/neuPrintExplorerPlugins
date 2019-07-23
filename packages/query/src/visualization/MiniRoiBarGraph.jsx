import React from 'react';
import ColorBox from './ColorBox';

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
const roiToColorMap = {};

function pickTextColorBasedOnBgColorAdvanced(bgColor, lightColor, darkColor) {
    const color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    const r = parseInt(color.substring(0, 2), 16); // hexToR
    const g = parseInt(color.substring(2, 4), 16); // hexToG
    const b = parseInt(color.substring(4, 6), 16); // hexToB
    const uicolors = [r / 255, g / 255, b / 255];
    const c = uicolors.map((col) => {
          if (col <= 0.03928) {
                  return col / 12.92;
                }
          return Math.pow((col + 0.055) / 1.055, 2.4);
        });
    const L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
    return (L > 0.179) ? darkColor : lightColor;
}

function BarGraph({ listOfRoisToUse, roiInfoObject, roiInfoObjectKey, sumOfValues }) {
  const type = roiInfoObjectKey;
  const total = Math.max(sumOfValues, 0.01);

  return Object.keys(roiInfoObject).map(roi => {
    if (
      listOfRoisToUse.find(element => element === roi)
    ) {
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
      const percent = Math.round(((roiInfoObject[roi][type] * 1.0) / total) * 100);

      let text = '';
      if (percent > 30) {
        text = `${roi} ${percent}%`;
      } else if (percent > 10) {
        text = `${percent}%`;
      }

      const textColor = pickTextColorBasedOnBgColorAdvanced(color, '#fff', '#000');
      return (
        <ColorBox
          key={roi}
          margin={0}
          width={percent * 4}
          height={20}
          backgroundColor={color}
          color={textColor}
          title={`${roi} ${percent}%`}
          text={text}
        />
      );
    }
    return null;
  });
}

export default ({ roiList, roiInfoObject, preTotal, postTotal }) => {
  const styles = {
    display: 'flex',
    flexDirection: 'row',
    margin: '5px'
  };

  const inputBar = (
    <div key="post" style={styles}>
      <BarGraph
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
      <BarGraph
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
