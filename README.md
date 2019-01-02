# neuPrintExplorerPlugins
Query and View plugins used by the neuPrintExplorer site to generate reusable
query forms and visualisations.

## Writing a Query Plugin
Query plugins generate a form to take user input and query the neuPrint
cypher api to fetch data from the server. The resulting data is then passed
on to a selected view plugin for display.

### Getting started

An example template for the query plugins can be found at

    query/Example.template

Copy this and change the extenstion to .jsx to make sure that it will be recoginzed
by the neuPrintExplorer plugin system. Instructions for modifying the template to 
fit your requirements can be found as comments inside it. Once complete, you will need
to install it...

### Installing the plugin

Place the plugin in the plugins directory of neuPrintExplorer, run the build, and
it will be automatically included in the site.

    cp plugin.jsx <neuPrintExplorer>/src/js/components/plugins/plugin.jsx
    cd <neuPrintExplorer>
    npm run build

## Writing a View Plugin
View plugins take data from the query plugins and format them in a specific way
for display on the site. This could be a table, graphic, or chart.

### Getting started

An example template for the query plugins can be found at

    view/Example.template

Copy this and change the extenstion to .jsx to make sure that it will be recoginzed
by the neuPrintExplorer plugin system. Instructions for modifying the template to 
fit your requirements can be found as comments inside it. Once complete, you will need
to install it...

### Installing the plugin

    cp view-plugin.jsx <neuPrintExplorer>/src/js/components/view-plugins/view-plugin.jsx
    cd <neuPrintExplorer>
    npm run build
