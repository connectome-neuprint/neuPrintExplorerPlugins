module.exports = {
  extends: ["react-app", "airbnb", "prettier", "prettier/react"],
  env: {
    browser: true,
    es6: true
  },
  parser: "babel-eslint",
  plugins: ["react"],
  rules: {
    "react/forbid-prop-types": [
      1,
      {
        forbid: ['any', 'array']
      }
    ]
  }
};
