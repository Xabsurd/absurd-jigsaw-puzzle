import { Bounds, Sprite, SpriteOptions, Texture, TextureSourceLike } from 'pixi.js';

export default class PuzzleTile extends Sprite {
  public row: number = -1;
  public column: number = -1;
  public offsetBounds: Bounds = new Bounds();
  constructor(options?: SpriteOptions | Texture){
    super(options);
  }
  public clone() {
    const target = new PuzzleTile(this.texture);
    target.row = this.row;
    target.column = this.column;
    target.offsetBounds = this.offsetBounds;
    target.x = this.x;
    target.y = this.y;
    return target;
  }
  static from(source: Texture | TextureSourceLike, skipCache?: boolean){
    return new PuzzleTile(super.from(source, skipCache));
  };
}
