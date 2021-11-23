import { NamedEntity } from "./NamedEntity";

export class Component extends NamedEntity {
  public dependencyInjections: NamedEntity[] = [];
  public inputs: NamedEntity[] = [];
  public outputs: NamedEntity[] = [];
  public viewChilds: NamedEntity[] = [];
  public viewChildren: NamedEntity[] = [];
  public contentChilds: NamedEntity[] = [];
  public contentChildren: NamedEntity[] = [];  
  public templateFilename: string = '';
  public selector: string = '';
  public subComponents: Component[] = [];
  public isRoot: boolean = false;
  public isRouterOutlet: boolean = false;

  constructor(className: string, filename: string, templateFilename: string = '', selector: string = '', subComponents: Component[] = [], isRoot: boolean = false) {
    super(className, filename);
    this.templateFilename = templateFilename;
    this.selector = selector;
    this.subComponents = subComponents;
    this.isRoot = isRoot;
  }
}