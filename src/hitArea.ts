import { Polygon } from 'pixi.js';

export default class HitArea {
  constructor(public polygons: Polygon[]) {}
  contains(x: number, y: number): boolean {
    for (const polygon of this.polygons) {
      if (polygon.contains(x, y)) {
        return true;
      }
    }
    return false;
  }
  merge(hitArea: HitArea) {
    this.polygons = this.polygons.concat(hitArea.polygons); 
  }
}
