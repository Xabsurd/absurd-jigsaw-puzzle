import { Container, GraphicsPath, Texture } from 'pixi.js';
import PuzzleTile from './PuzzleTile';
import HitArea from './HitArea';

export type PieceResult = {
  target: Container;
  sprite: PuzzleTile;
};

export default class PieceFactory {
  constructor(public borderColor = '#8bc5ff') {}

  create(texture: Texture, path: string): PieceResult {
    const tile = new PuzzleTile();
    tile.eventMode = 'none';
    tile.cullable = true;
    tile.path(new GraphicsPath(path));
    tile.fill({ texture });
    tile.stroke({ color: this.borderColor, width: 2 });
    void tile.bounds;

    const container = new Container();
    container.eventMode = 'static';
    container.cursor = 'grab';
    container.cullable = true;
    container.addChild(tile);
    container.hitArea = new HitArea(container);

    return { target: container, sprite: tile };
  }
}
