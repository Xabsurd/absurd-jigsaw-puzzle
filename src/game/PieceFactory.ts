import { Container, Texture } from 'pixi.js';
import PuzzleTile, { boundsFromPath } from './PuzzleTile';
import type { DisplaySettings } from '../displaySettings';
import { getGroupCells, paintGroup } from './puzzleGroup';
import type { TileTool } from '../svgTools';

export type PieceResult = {
  target: Container;
  sprite: PuzzleTile;
};

export default class PieceFactory {
  constructor(
    public display: DisplaySettings,
    public texture: Texture,
    public tileTool: TileTool
  ) {}

  create(path: string, column: number, row: number): PieceResult {
    const container = new Container();
    container.eventMode = 'none';
    container.interactiveChildren = false;
    container.cullable = true;
    container.cullableChildren = true;
    paintGroup(
      container,
      [{ column, row, pathBounds: boundsFromPath(path) }],
      this.texture,
      this.tileTool,
      this.display
    );
    return { target: container, sprite: container.children[0] as PuzzleTile };
  }

  rebuild(group: Container) {
    paintGroup(group, getGroupCells(group), this.texture, this.tileTool, this.display);
  }
}
