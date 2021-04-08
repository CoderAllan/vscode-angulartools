# Change Log

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
