import { ArrayUtils } from "@src";

export class NgModule {
  public imports: string[] = [];
  public exports: string[] = [];
  public declarations: string[] = [];
  public entryComponents: string[] = [];
  public providers: string[] = [];
  public bootstrap: string[] = [];
  public filename: string = '';
  public moduleName: string = '';
  public isRoutingModule: boolean = false;
  public moduleStats(): number[] {
    return [
      this.declarations === undefined ? 0 : ArrayUtils.arrayLength(this.declarations),
      this.imports === undefined ? 0 : ArrayUtils.arrayLength(this.imports),
      this.exports === undefined ? 0 : ArrayUtils.arrayLength(this.exports),
      this.bootstrap === undefined ? 0 : ArrayUtils.arrayLength(this.bootstrap),
      this.providers === undefined ? 0 : ArrayUtils.arrayLength(this.providers),
      this.entryComponents === undefined ? 0 : ArrayUtils.arrayLength(this.entryComponents),
    ];
  }
}