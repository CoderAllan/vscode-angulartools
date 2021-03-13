# AngularTools 

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/coderAllan.vscode-angulartools) ![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/coderAllan.vscode-angulartools) ![GitHub top language](https://img.shields.io/github/languages/top/CoderAllan/vscode-angulartools.svg) ![GitHub last commit](https://img.shields.io/github/last-commit/CoderAllan/vscode-angulartools.svg) ![GitHub](https://img.shields.io/github/license/CoderAllan/vscode-angulartools.svg)

AngularTools is a collection of tools for exploring an Angular project, help you with documenting, reverse engineering a project or help when refactoring.

Some of the tools may seem very basic, but can be a powerful help when you have them right at your fingertips.

Find it on the [Visual Studio Code marketplace](https://marketplace.visualstudio.com/items?itemName=coderAllan.vscode-angulartools).

## Features

* Show the module hierarchy
* Show the dependency injection graph
* Show the component hierarchy
* Generate DGML graph of project component hierarchy
* Summarizes all the Angular modules
* Generate a markdown file with the component hierarchy in Mermaid format.
* Show the directory structure of the project
* Generate list of packages used in the project
* List all imports

Below is a detailed description of each feature.

### Show the module hierarchy [#](#show-module-hierarchy- 'Show the module hierarchy')

The 'Show module hierarchy' command is used for visualizing the hierarchy of the modules in an Angular application. The command scans all the *.ts files in the project to identify classes decorated with the `@NgModule` class decorator and then visualize how each module is imported by other modules. It will also visualize the classes specified in the imports and the exports section of the NgModule definition.

In the visualization the classes will be colored depending on the class decorator of each class:

* Modules are red
* Components are blue
* Pipes are yellow
* Directives are green

![Show module hierarchy](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/ShowModuleHierarchy.gif)

### Show the dependency injection graph [#](#show-dependency-injection-graph- 'Show the dependency injection graph')

The 'Show a graph representing the components and the injected dependencies' command generates a directed graph representing the components and the services injected into the components of an Angular application. The command scans all *.ts files of the application and for each class decorated with the @Component decorator, it analyses the constructor and each field in the class to identify all injected classes and to identify all the fields decorated with the Input, Output, ViewChild, ViewChildren, ContentChild and ContentChildren decorators.

In the visualization the components will by default be colored dark blue and the injected classes will be colored light blue.

![Show dependency injection graph](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/ShowDependencyInjectionGraph.gif)

### Show the component hierarchy [#](#show-component-hierarchy- 'Show the component hierarchy')

The 'Show the component hierarchy' command is used for visualizing the component hierarchy and Angular application. It analyses all the *.component.ts files and all the corresponding template files to determine how the component use each other and then generates a directed graph showing the component hierarchy.

The command uses a vscode webview extension component to render the hierarchy using html, javascript and the [Vis.js](https://visjs.org/index.html) javascript library. This has the downside that copying the generated graph to the clipboard is not yet possible due to limitations in the vscode extension api. So to overcome this limitation the generated graph can be saved as a Png file to the root of the project you are analyzing.

![Show component hierarchy](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/ShowComponentHierarchy.gif)

You can also choose to save a selection from the graph as shown in the example below.

![Show component hierarchy](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/ShowComponentHierarchy2.gif)

By default the component hierarchy graph is rendered using a random layout. You can change the layout method to use a hierarchical layout to line up the nodes in the graph in different ways and also change how the layout engine sorts the nodes in the graph. This is all done by checking the 'Change layout' checkbox to show the drop down boxes with the available options.

![Show component hierarchy](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/ShowComponentHierarchy3.gif)

### Generate DGML graph of project component hierarchy [#](#generate-dgml-graph- 'Generate DGML graph of project component hierarchy')

The Generate Directed Graph Markup Language ([dgml](https://docs.microsoft.com/en-us/visualstudio/modeling/directed-graph-markup-language-dgml-reference)) file command analyzes the all angular components and generates a graph of the relationship between the components.

The dgml file can be viewed and modified using Microsoft Visual Studio. I have also created an extension for Visual Studio Code for viewing dgml files. The [DGML Viewer extension](https://github.com/CoderAllan/vscode-dgmlviewer) can be found on the [Visual Studio code marketplace](https://marketplace.visualstudio.com/items?itemName=coderAllan.vscode-dgmlviewer).

![Generate DGML graph](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/GenerateDgml.gif)

### Generate a markdown file with the component hierarchy in Mermaid format [#](#component-hierarchy-markdown- 'Component hierarchy in Mermaid format')

This command will generate the component hierarchy in markdown format using [Mermaid notation](https://mermaid-js.github.io/mermaid/#/).

Please notice that some online tools and sites do not support Mermaid markdown format yet, like GitHub and Visual Studio Code. To preview markdown files using the mermaid notation in Visual Studio Code i'm using the [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension.

![Generate graph in Mermaid notation](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/GenerateMermaid.gif)

### Generate a markdown file that summarizes all the Angular modules [#](modules-to-markdown- 'Modules to Markdown')

This command will scan all *.ts files in the workspace folders and find those classes that are decorated with the '@NgModule' class decorator and parse the module definition and then summarize each module into a markdown file.

The summarization will consist of two parts: First a table listing how many imports, exports, declarations and so on each module contains. The second part shows what each module contain.

![Generate markdown file from all modules](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/ModulesToMarkdown.gif)

### Show the directory structure of the project [#](#directory-structure- 'Show the directory structure of the project')

This command lists the entire directory structure of the currently open project. Sometimes this can be a quick way to get an overview of the project if you are new to the project before og maybe need to document it.

The directory structure will be listed in the output window for the AngularTools extension for easy copy/pasting.

![Show the directory structure of the project](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/ShowProjectStructure.gif)

### Generate list of packages used in the project [#](#package-json-to-markdown- 'Generate list of packages used in the project')

Sometimes your boss or a customer requires documentation of which packages is used in the project. This command can save you a lot of tedious manual work by analyzing the package.json file and for each referenced package queries the [npmjs.com](https://www.npmjs.com/) website to fetch the description for the package and from that generates a Markdown file with a table of the packages with their descriptions.

The license information is retrieved from the package.json file for each package in the node_modules folder in the root of the workspace, this mean that the license will show 'N/A' if you have not run the 'npm install' yet.

![Generate list of packages used in the project](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/PackageMarkdown.gif)

### List all imports [#](#list-all-imports- 'List all imports')

This command will analyse all Angular components in the project and collect all the imports of the components together with the number of times the imported component is used. This can be useful when refactoring or identifying frequently used modules. Usually frequently used modules needs extra attention or care before being changed during refactoring. You can also use the command to identify modules that are not referenced in a consistent way where some components are using relative path and some components using path-aliases.

![List all imports](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/ListAllImports.gif)

## Settings

In the Visual Studio Code settings you find under File --> Preferences --> Settings, under Extensions, there is a section with all the settings for AngularTools. It is possible to change the default filenames used when the extension saves a file to the workspace folder. You can change how the component hierarchy graph nodes are rendered, the edge endings, the color of the root nodes and a lot more.

See the full list of settings below the screenshot.

![AngularTools settings](https://github.com/CoderAllan/vscode-angulartools/raw/main/images/Settings.gif)

| Setting | Description |
| --- | --- |
| angularTools.excludeDirectories | Semicolon separated list of directories that should be excluded when scanning for for Angular components. |
| angularTools.componentHierarchyDgml.defaultGraphFilename | The default filename used when saving a component hierarchy to a Directed Graph Markup Language (Dgml) file. |
| angularTools.componentHierarchyDgml.graphLayout | This is the algorithm used to layout the nodes of the graph. Sugiyama wil try to avoid crossing edges as far as possible. ForceDirected will try to cluster the nodes. |
| angularTools.componentHierarchyDgml.graphDirection | This will make the layout algorithm position the graph nodes in the specified direction. |
| angularTools.componentHierarchyDgml.rootNodeBackgroundColor | The color of the root nodes of the directed graph. The string should be in rgba format. |
| angularTools.packageJsonMarkdownFilename | The default filename used when saving the packages.json as a markdown file. |
| angularTools.projectDirectoryStructureMarkdownFilename | The default filename used when saving the project directory structure as a markdown file. |
| angularTools.showComponentHierarchy.rootNodeBackgroundColor | The color of the root nodes of the component hierarchy graph. The string should be in rgba format or standard css color names. |
| angularTools.showComponentHierarchy.edgeArrowToType | The default ending of the edges. |
| angularTools.showComponentHierarchy.nodeShape | The shape of the nodes in the component hierarchy graph. Notice that 'ellipse','circle','database','box' and 'text' have the label inside the shape, the rest have the label outside the shape. |
| angularTools.showComponentHierarchy.graphSelectionGuidelineColor | The color of the guidelines used when selecting part of a component hierarchy graph. The string should be in rgba format or standard css color names. |
| angularTools.showComponentHierarchy.graphSelectionGuidelineWidth | The width of the guide lines shown when selecting part of a component hierarchy graph |
| angularTools.showComponentHierarchy.graphSelectionColor | The color of the selection rectangle used when selecting part of a component hierarchy graph. The string should be in rgba format or standard css color names. |
| angularTools.showComponentHierarchy.graphSelectionWidth | The width of the selection rectangle shown when selecting part of a component hierarchy graph |
| angularTools.showComponentHierarchy.componentHierarchyFilename | The default name used when saving the component hierarchy to a Png file. |
| angularTools.componentHierarchyMarkdownFilename | The default name used when saving the component hierarchy to a markdown file. |
| angularTools.modulesToMarkdownFilename | The default name used when saving the modules to a markdown file. |

## Third party components and resources

* [Vis.js](https://visjs.org/index.html) - Used for generating the directed graph for showing the component hierarchy.
* [npmjs.com](https://www.npmjs.com/) - The extension queries the NpmJs.com api.
* [Directed Graph Markup Language (DGML) reference](https://schemas.microsoft.com/vs/2009/dgml/)
* [DGMLViewer VsCode extension](https://marketplace.visualstudio.com/items?itemName=coderAllan.vscode-dgmlviewer)
* [Mermaid markdown notation](https://mermaid-js.github.io/mermaid/#/)
