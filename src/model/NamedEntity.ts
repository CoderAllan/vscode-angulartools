
export class NamedEntity {
  public name: string = '';
  public constructor(name: string) {
    this.name = name;
  }
}

export class Directive extends NamedEntity { }

export class Pipe extends NamedEntity { }

export class Injectable extends NamedEntity { }
