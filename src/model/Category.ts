
export class Category {

  constructor(id: string, label: string, backGroundColor: string, stroke: string) {
    this.id = id;
    this.label = label;
    this.backgroundColor = backGroundColor;
    this.stroke = stroke;
  }

  public id: string;
  public label: string;
  public backgroundColor: string;
  public stroke: string;
}