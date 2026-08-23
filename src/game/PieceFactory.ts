import { Container, GraphicsPath, Renderer, Texture } from 'pixi.js';
import PuzzleTile, { boundsFromPath, forceBatch } from './PuzzleTile';
import HitArea from './HitArea';
import type { DisplaySettings } from '../displaySettings';

export type PieceResult = {
  target: Container;
  sprite: PuzzleTile;
};

export default class PieceFactory {
  constructor(
    public display: DisplaySettings,
    public renderer: Renderer
  ) {}

  create(texture: Texture, path: string): PieceResult {
    const tile = new PuzzleTile();
    tile.pathData = path;
    tile.pathBounds = boundsFromPath(path);
    tile.eventMode = 'none';
    tile.cullable = true;
    tile.interactiveChildren = false;
    tile.path(new GraphicsPath(path));
    tile.fill({ texture });
    void tile.bounds;
    forceBatch(this.renderer, tile);
    tile.attachRenderer(this.renderer);
    tile.setStroke(this.display.showStroke, this.display.borderColor);

    const container = new Container();
    container.eventMode = 'none';
    container.interactiveChildren = false;
    container.cullable = true;
    container.addChild(tile);
    container.hitArea = new HitArea(container);

    return { target: container, sprite: tile };
  }
}
