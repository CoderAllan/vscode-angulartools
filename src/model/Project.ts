import { NgModule } from "@src";
import { Component } from './Component';
import { NamedEntity } from "./NamedEntity";

export class Project {
  public modules: NgModule[] = [];
  public moduleNames: Map<string, string> = new Map<string, string>();
  public components: Map<string, Component> = new Map<string, Component>();
  public pipes: Map<string, NamedEntity> = new Map<string, NamedEntity>();
  public directives: Map<string, NamedEntity> = new Map<string, NamedEntity>();
  public injectables: Map<string, NamedEntity> = new Map<string, NamedEntity>();
}
