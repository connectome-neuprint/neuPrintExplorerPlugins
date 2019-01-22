# neuPrintExplorerPlugins
Query and View plugins used by the neuPrintExplorer site to generate reusable
query forms and visualisations.

  Query plugins generate a form to take user input and query the neuPrint
cypher api to fetch data from the server. The resulting data is then passed
on to a selected view plugin for display.

  View plugins take data from the query plugins and format them in a specific way
for display on the site. This could be a table, graphic, or chart.

## Writing a Plugin
  Please read below to see how to create your own plugin.

### Getting started

An example template for the plugins can be found at

    packages/query/Example.jsx # query plugin
    packages/view/Example.jsx # view plugin

Copy the example and name it to reflect the purpose of your plugin. Instructions for modifying
the template to fit your requirements can be found as comments inside it.

neuPrint plugins are React [components](https://reactjs.org/docs/components-and-props.html)
from the [React](https://reactjs.org/) framework. A familiarity with the framework
would be helpful for authors, but is not required.

Once complete, you will need to install it...

### Installing the plugin

Place the plugin in the plugins directory of neuPrintExplorer, run the build, and
it will be automatically included in the site. For Example, here are the steps to
add a query plugin.

   1. copy the plugin into the correct location
      - cp plugin.jsx <neuPrintExplorerPlugins>/packages/query/plugin.jsx
   2. edit &lt;neuPrintExplorerPlugins&gt;/packages/query/index.js
      - Add the import line that includes your plugin:
        - export { default as &lt;PluginName&gt; } from './&lt;PluginName&gt;';
   3. build the transpiled code.
      - npm run build
   4. link it in to core node modules
      - npm link
   5. move into neuPrintExplorer checkout
      - cd &lt;neuPrintExplorer&gt;
   6. link the updated plugins into the explorer
      - npm link @neuprint/queries
   7. rebuild the explorer
      - npm run build
