export interface NetworkNode {
  id: string;
  label: string;
  position: {
    x: number,
    y: number
  };
  boundingBox: {
    top: number,
    left: number,
    right: number,
    bottom: number
  };
}