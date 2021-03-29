
export class NamedEntity {
  public name: string = '';
  public filename: string = '';
  public constructor(name: string, filename: string) {
    this.name = name;
    this.filename = filename;
  }
}

export class Directive extends NamedEntity { }

export class Pipe extends NamedEntity { }

export class Injectable extends NamedEntity { }
