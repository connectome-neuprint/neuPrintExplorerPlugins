# neuPrintExplorerPlugins

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

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

    packages/query/src/Example.jsx # query plugin
    packages/view/src/Example.jsx # view plugin

Copy the example and name it to reflect the purpose of your plugin. Instructions for modifying
the template to fit your requirements can be found as comments in the code.

neuPrint plugins are React [components](https://reactjs.org/docs/components-and-props.html)
from the [React](https://reactjs.org/) framework. A familiarity with the framework
would be helpful for authors, but is not required.

neuPrintexplorer uses material-ui components and styles. As such these need to be imported
into your plugin. More information can be found at the [Material-UI](https://material-ui.com/)
documentation site.

### Installing the plugin

Once complete, you will need to install it into the explorer site. Place the plugin in the
plugins directory of the [neuPrintExplorer](https://github.com/connectome-neuprint/neuPrintExplorer)
checkout, run the build, and it will be automatically included in the site. For Example, here are the
steps to add a query plugin.

   1. copy the plugin into the correct location
      - cp Plugin.jsx &lt;neuPrintExplorer&gt;/plugins/Plugin.jsx
   2. build the explorer.
      - cd &lt;path to your neuPrintExplorer checkout&gt;
      - npm run build

The process for installing View plugins is almost identical. Just change the directory
that the files are placed in to the view-plugins directory in neuPrintExplorer.


###  Testing the plugin.

In order to test the plugin you will need to have a local copy of both
neuPrintHTTP and neuPrintExplorer. Information on installing and running
them can be found in their respective repositories.

- [neuPrintHttp](https://github.com/connectome-neuprint/neuPrintHTTP)
- [neuPrintExplorer](https://github.com/connectome-neuprint/neuPrintExplorer)

Once installed and running, follow the directions to install your plugin and reload
the site to see it in action. Additionally, you can leverage the
[jest](https://jestjs.io/en/versions) testing framework to test your plugin independently.
An example of this can be seen in the example test file at:

      packages/query/src/Example.test.js


### Contributing a core plugin.

Once you are happy that your plugin is working as intended, you can issue a
[pull request](https://help.github.com/articles/about-pull-requests/) to have the plugin included
in the core @neuprint/plugins package and it will be reviewed by the core team.
