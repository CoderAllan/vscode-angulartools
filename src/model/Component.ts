import { NamedEntity } from "./NamedEntity";

export class Component extends NamedEntity {
  public dependencyInjections: NamedEntity[] = [];
  public inputs: NamedEntity[] = [];
  public outputs: NamedEntity[] = [];
  public viewchilds: NamedEntity[] = [];
  public viewchildren: NamedEntity[] = [];
  public contentchilds: NamedEntity[] = [];
  public contentchildren: NamedEntity[] = [];
}