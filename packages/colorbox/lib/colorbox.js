"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ColorBox(_ref) {
  var margin = _ref.margin,
      width = _ref.width,
      height = _ref.height,
      backgroundColor = _ref.backgroundColor,
      title = _ref.title,
      text = _ref.text,
      color = _ref.color;
  var styles = {
    margin: "".concat(margin, "px"),
    width: "".concat(width, "px"),
    minWidth: "".concat(width, "px"),
    height: "".concat(height, "px"),
    minHeight: "".concat(height, "px"),
    backgroundColor: backgroundColor,
    color: color,
    overflow: 'visible',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column'
  };
  return _react["default"].createElement("div", {
    style: styles,
    title: title
  }, text);
}

ColorBox.defaultProps = {
  color: '#000'
};
ColorBox.propTypes = {
  margin: _propTypes["default"].number.isRequired,
  width: _propTypes["default"].number.isRequired,
  height: _propTypes["default"].number.isRequired,
  backgroundColor: _propTypes["default"].string.isRequired,
  title: _propTypes["default"].string.isRequired,
  color: _propTypes["default"].string,
  text: _propTypes["default"].oneOfType([_propTypes["default"].object, _propTypes["default"].string]).isRequired
};
var _default = ColorBox;
exports["default"] = _default;
//# sourceMappingURL=colorbox.js.map