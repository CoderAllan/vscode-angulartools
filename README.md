# AngularTools

AngularTools is a collection of tools for exploring an Angular project, help you with documenting, reverse engineering a project or help when refactoring.

Some of the tools may seem very basic, but can be a powerful help when you have them right at your fingertips.

## Features

* Generate DGML graph of project component hierarchy
* Show the component hierarchy
* Show the directory structure of the project
* Generate list of packages used in the project
* List all imports

Below is a detailed description of each feature.

### Generate DGML graph of project component hierarchy [#](#generate-dgml-graph- 'Generate DGML graph of project component hierarchy')

The Generate Directed Graph Markup Language ([dgml](https://docs.microsoft.com/en-us/visualstudio/modeling/directed-graph-markup-language-dgml-reference)) file command analyzes the all angular components and generates a graph of the relationship between the components.

The dgml file can be viewed and modified using Microsoft Visual Studio. I don't believe there is an extension for Visual Studio Code yet for viewing dgml files.

![Generate DGML graph](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/GenerateDgml.gif)

### Show the component hierarchy [#](#show-component-hierarchy- 'Show the component hierarchy')

If you don't want install Microsoft Visual Studio or you are on a platform not supporting Microsoft Visual Studio to view the dgml files with the component relationship, you can use the 'Show the component hierarchy' command to render the  hierarchy and show it directly in vscode.

This command uses a vscode webview extension component to render the hierarchy using html, javascript and the [Vis.js](https://visjs.org/index.html) javascript library. This has the downside that copying the generated graph to the clipboard is not yet possible due to limitations in the vscode extension api. So to overcome this limitation the generated graph can be saved as a Png file to the root of the project you are analyzing.

![Show component hierarchy](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/ShowComponentHierarchy.gif)

You can also choose to save a selection from the graph as shown in the example below.

![Show component hierarchy](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/ShowComponentHierarchy2.gif)

### Show the directory structure of the project [#](#directory-structure- 'Show the directory structure of the project')

This command lists the entire directory structure of the currently open project. Sometimes this can be a quick way to get an overview of the project if you are new to the project before og maybe need to document it.

The directory structure will be listed in the output window for the AngularTools extension for easy copy/pasting.

![Show the directory structure of the project](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/ShowProjectStructure.gif)

### Generate list of packages used in the project [#](#package-json-to-markdown- 'Generate list of packages used in the project')

Sometimes your boss or a customer requires documentation of which packages is used in the project. This command can save you a lot of tedious manual work by analyzing the package.json file and for each referenced package queries the [npmjs.com](https://www.npmjs.com/) website to fetch the description for the package and from that generates a Markdown file with a table of the packages with their descriptions.

![Generate list of packages used in the project](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/PackageMarkdown.gif)

### List all imports [#](#list-all-imports- 'List all imports')

This command will analyse all Angular components in the project and collect all the imports of the components together with the number of times the imported component is used. This can be useful when refactoring or identifying frequently used modules. Usually frequently used modules needs extra attention or care before being changed during refactoring. You can also use the command to identify modules that are not referenced in a consistent way where some components are using relative path and some components using path-aliases.

![List all imports](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/ListAllImports.gif)

## Third party components and resources

* [Vis.js](https://visjs.org/index.html) - Used for generating the directed graph for showing the component hierarchy.
* [npmjs.com](https://www.npmjs.com/) - The extension queries the NpmJs.com api.
