import { NgModule } from "@src";
import { Component } from './Component';

export class Project {
  public modules: NgModule[] = [];
  public moduleNames: Map<string, string> = new Map<string, string>();
  public components: Map<string, Component> = new Map<string, Component>();
  public pipes: Map<string, string> = new Map<string, string>();
  public directives: Map<string, string> = new Map<string, string>();
  public injectables: Map<string, string> = new Map<string, string>();
}
