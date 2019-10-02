"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RoiHeatMap = RoiHeatMap;
exports.HeatMapLabels = HeatMapLabels;
exports.ColorLegend = ColorLegend;
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _colormap = _interopRequireDefault(require("colormap"));

var _colorbox = _interopRequireDefault(require("@neuprint/colorbox"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var viridisColorMap = (0, _colormap["default"])({
  colormap: 'viridis',
  nshades: 101,
  format: 'hex',
  alpha: 1
});

function RoiHeatMap(_ref) {
  var roiInfoObject = _ref.roiInfoObject,
      roiInfoObjectKey = _ref.roiInfoObjectKey,
      sumOfValues = _ref.sumOfValues,
      listOfRoisToUse = _ref.listOfRoisToUse;
  var type = roiInfoObjectKey;
  var total = Math.max(sumOfValues, 0.01);
  return listOfRoisToUse.map(function (roi) {
    var percent = roiInfoObject[roi] ? roiInfoObject[roi][type] * 1.0 / total * 100 : 0;
    return _react["default"].createElement(_colorbox["default"], {
      margin: 0,
      width: 10,
      height: 20,
      backgroundColor: roiInfoObject[roi] ? viridisColorMap[Math.floor(roiInfoObject[roi][type] * 1.0 / total * 100)] : viridisColorMap[0],
      key: roi,
      title: "".concat(roi, " ").concat(Math.round(percent * 100) / 100, "%"),
      text: ""
    });
  });
}

function HeatMapLabels(_ref2) {
  var roiList = _ref2.roiList;
  var styles = {
    margin: '0px',
    width: '10px',
    height: '40px',
    overflow: 'visible',
    display: 'inline-flex',
    flexDirection: 'row',
    whiteSpace: 'nowrap',
    transform: 'rotate(-90deg) translateX(-40px)',
    transformOrigin: 'left top 0',
    fontSize: '10px'
  };
  return roiList.map(function (roi) {
    return _react["default"].createElement("div", {
      title: roi,
      style: styles,
      key: roi
    }, roi);
  });
}

function ColorLegend() {
  var styles = {
    display: 'inline-flex',
    overflow: 'visible',
    flexDirection: 'row'
  };
  return _react["default"].createElement("div", {
    style: styles
  }, '0% ', ' ', viridisColorMap.map(function (color, index) {
    var key = "".concat(color).concat(index);
    var divStyles = {
      margin: '0px',
      width: '1px',
      height: '10px',
      backgroundColor: color
    };
    return _react["default"].createElement("div", {
      key: key,
      style: divStyles
    });
  }), ' 100%');
}

var _default = function _default(_ref3) {
  var roiList = _ref3.roiList,
      roiInfoObject = _ref3.roiInfoObject,
      preTotal = _ref3.preTotal,
      postTotal = _ref3.postTotal;
  var styles = {
    display: 'flex',
    flexDirection: 'row',
    margin: '5px'
  };

  var text = _react["default"].createElement("div", {
    key: "labels",
    style: styles
  }, _react["default"].createElement(HeatMapLabels, {
    roiList: roiList
  }));

  var hmPost = _react["default"].createElement("div", {
    key: "post",
    style: styles
  }, _react["default"].createElement(RoiHeatMap, {
    listOfRoisToUse: roiList,
    roiInfoObject: roiInfoObject,
    roiInfoObjectKey: "post",
    sumOfValues: postTotal
  }), "inputs*");

  var hmPre = _react["default"].createElement("div", {
    key: "pre",
    style: styles
  }, _react["default"].createElement(RoiHeatMap, {
    listOfRoisToUse: roiList,
    roiInfoObject: roiInfoObject,
    roiInfoObjectKey: "pre",
    sumOfValues: preTotal
  }), "outputs*");

  return [text, hmPost, hmPre];
};

exports["default"] = _default;
//# sourceMappingURL=miniroiheatmap.js.map