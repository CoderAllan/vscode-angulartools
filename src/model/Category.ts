
export class Category {

  constructor(id: string, label: string, backGroundColor: string) {
    this.id = id;
    this.label = label;
    this.backgroundColor = backGroundColor;
  }

  public id: string;
  public label: string;
  public backgroundColor: string;
}