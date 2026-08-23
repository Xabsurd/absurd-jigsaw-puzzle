import { Container, GraphicsPath, Rectangle, Texture } from 'pixi.js';
import PuzzleTile, { boundsFromPath } from './PuzzleTile';
import HitArea from './HitArea';
import type { DisplaySettings } from '../displaySettings';

export type PieceResult = {
  target: Container;
  sprite: PuzzleTile;
};

export default class PieceFactory {
  constructor(public display: DisplaySettings) {}

  create(texture: Texture, path: string): PieceResult {
    const tile = new PuzzleTile();
    tile.pathData = path;
    tile.pathBounds = boundsFromPath(path);
    tile.eventMode = 'none';
    tile.cullable = true;
    tile.interactiveChildren = false;
    tile.path(new GraphicsPath(path));
    tile.fill({
      texture,
      textureSpace: 'global'
    });
    void tile.bounds;
    tile.setStroke(this.display.showStroke, this.display.borderColor);

    const container = new Container();
    container.eventMode = 'none';
    container.interactiveChildren = false;
    container.cullable = true;
    container.cullableChildren = true;
    container.cullArea = new Rectangle(
      tile.pathBounds.x,
      tile.pathBounds.y,
      tile.pathBounds.width,
      tile.pathBounds.height
    );
    container.addChild(tile);
    container.hitArea = new HitArea(container);

    return { target: container, sprite: tile };
  }
}
