import { NamedEntity } from "./NamedEntity";

export class Component extends NamedEntity {
  public dependencyInjections: string[] = [];
  public inputs: string[] = [];
  public outputs: string[] = [];
  public viewchilds: string[] = [];
  public viewchildren: string[] = [];
  public contentchilds: string[] = [];
  public contentchildren: string[] = [];
}