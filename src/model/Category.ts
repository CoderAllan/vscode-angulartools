
export class Category {

  constructor(id: string, label: string, backGroundColor: string, stroke: string, icon: string) {
    this.id = id;
    this.label = label;
    this.backgroundColor = backGroundColor;
    this.stroke = stroke;
    this.icon = icon;
  }

  public id: string;
  public label: string;
  public backgroundColor: string;
  public stroke: string;
  public icon: string;
}