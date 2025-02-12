# Change Log

## Version 1.14.0

- Fixed bug in regex to account for comments before class definitions. Thanks @FBosito for the error report and bugfix suggestion.
- Bump Packages to latest

## Version 1.13.1

- Maintenance: Bump packages to latest

## Version 1.13.0

- Fixed issue with case sensitive filenames when using the .vscodeangulartools setting file.
- Updated vis-network.min.js to latest v9.1.9
- Maintenance: Bump packages to latest

## Version 1.12.0

- Updated vis-network.min.js to latest v9.1.7
- Maintenance: Bump packages to latest

## Version 1.11.0

- It is now possible to include or exclude folders by placing a .vscodeangulartools config file in the project folder
- Bugfix: Mermaid markdown graph representing the component hierarchy now shows unrelated components correctly.

## Version 1.10.2

- Maintenance: Bump packages to latest

## Version 1.10.1

- Adding label to links in generated dgml file.
- Bugfix: TsFilename path in generated dgml file are now correct for injected services.

## Version 1.10.0

- In the dependency injection graph, now all injected entities are shown.

## Version 1.9.1

- Maintenance: Bump packages to latest

## Version 1.9.0

- Routing relations between components are now visualized. Notice that routes defined with module destinations are not yet visualized.

## Version 1.8.5

- Security issue fixed: Now using npm package @xmldom/xmldom instead of xmldom

## Version 1.8.4

- Maintenance: Bump packages to latest

## Version 1.8.3

- When edges have the same source and target the edges no longer overlap.
- A popup is now shown when the mouse pointer is hovered above an edge or a node.
- It is now possible to click a node in the graphs to open the file the node is associated with.
- Bugfix: Save as Png is now working correctly

## Version 1.8.2

- The state of the checkbox and the dropdown boxes are now persisted.

## Version 1.8.1

- The position of nodes are now persisted. If you rearrange the nodes you work won't be lost when changing to another tab and back again.
- You now has to click the 'Regenerate graph' button to generate a new random graph.

## Version 1.8.0

- All three graph type can now be saved as a dot file.
- A file icon is added to nodes when saving to a dgml file.
- Bugfix: If a graph window has already been opened for a specific graph then it is reused next time the graph is generated instead of opening a new window every time.

## Version 1.7.3

- Bugfix: GraphDirection is now saved correctly when saving as Dgml.

## Version 1.7.2

- Added missing xml prolog to generated dgml file.
- Added missing properties to generated dgml file.
- Removed unused properties in generated dgml file.
- Changed property TsFilename to TypescriptFilepath and made it a reference attribute.
- Now only show message in the vscode status bar when dgml or png file has been saved.

## Version 1.7.1

- Bugfix: input, outputs, viewchilds, etc. are now shown correctly in the dependency injection graph.

## Version 1.7.0

- All three graph types: Dependency injection graph, module hierarchy graph and component hierarchy graph can now be saved as a dgml file.
- Component hierarchy dgml command has been removed because its now obsolete.

## Version 1.6.0

- Added Dependency injection graph command that visualizes what services are injected into the components. Graph also include all the inputs, outputs, viewchild, viewchildren, contentchild and contentchildren of each component.

## Version 1.5.1

- Now using webpack to reduce size of extension.

## Version 1.5.0

- Added Show module hierarchy command that visualizes the module structure and their import and exports.
- Improved the layout of nodes in the Show Component hierarchy command

## Version 1.4.5

- Bugfix: The Package json to Markdown command failed if the node_modules folder did not exist.

## Version 1.4.4

- Bugfix: Not all modules was recognized by the 'Generate a Markdown file of all modules in the current project.' command.
- Various refactoring.

## Version 1.4.3

- Updated: PackageJsonToMarkdown command now shows the package license for each package.

## Version 1.4.2

- You can now select a random layout for the component hierarchy graph.
- Bugfix: Savíng a selection did not work if you had change the layout of the graph.

## Version 1.4.1

- Updated: PackageJsonToMarkdown command now shows the local version pattern and  the latest version number of the packages.
- Bugfix: The list of packages in the generated markdown file for the packages is now sorted.

## Version 1.4.0

- New feature: You can now choose how to auto-layout the component hierarchy graph.

## Version 1.3.0

- New feature: You can now generate a markdown file that summarizes all the Angular modules.
- Various refactoring.

## Version 1.2.2

- Fixed bug: Show component hierarchy no longer fails when the Angular application contains recursive component.

## Version 1.2.1

- Fixed bug in Readme.md

## Version 1.2.0

- New feature: It is now possible to change shape, line colors, default filenames and a lot more for the commands in the extension. Go to the Preferences in the File menu and find the AngularTools section under the Extensions section.

## Version 1.1.1

- Bugfix: The edges in the component hierarchy graph are now straight and the dynamics of the graph is turned off.

## Version 1.1.0

- New feature: You can now generate a markdown(Mermaid) file with the component hierarchy.
- Bugfix: The List imports command now also find the require(...) packages.

## Version 1.0.1

- Bugfix: The Show component hierarchy graph command did not work

## Version 1.0.0

- Initial release

[Keep a Changelog](http://keepachangelog.com/)
