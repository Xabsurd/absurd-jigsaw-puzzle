import { Bounds, Sprite } from "pixi.js";

export default class PuzzleTile extends Sprite {
  public row: number=-1;
  public column: number=-1;
  public offsetBounds: Bounds=new Bounds();
  constructor() {
    super();
  }
}
