import { Container, GraphicsPath, Rectangle, Texture } from 'pixi.js';
import PuzzleTile, { PathBounds, boundsFromPath } from './PuzzleTile';
import HitArea from './HitArea';
import type { DisplaySettings } from '../displaySettings';
import type { TileTool } from '../svgTools';

export type PuzzleCell = {
  column: number;
  row: number;
  pathBounds: PathBounds;
};

type GroupData = Container & { cells: PuzzleCell[] };

export function getGroupCells(group: Container): PuzzleCell[] {
  return (group as GroupData).cells ?? [];
}

export function setGroupCells(group: Container, cells: PuzzleCell[]) {
  (group as GroupData).cells = cells;
}

export function paintGroup(
  group: Container,
  cells: PuzzleCell[],
  texture: Texture,
  tileTool: TileTool,
  display: DisplaySettings
) {
  setGroupCells(group, cells);
  const path = tileTool.getGroupPath(cells.map((cell) => ({ x: cell.column, y: cell.row })));
  for (const child of group.removeChildren()) {
    child.destroy({ children: true });
  }
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
  tile.setStroke(display.showStroke, display.borderColor);
  group.addChild(tile);
  group.cullArea = new Rectangle(
    tile.pathBounds.x,
    tile.pathBounds.y,
    tile.pathBounds.width,
    tile.pathBounds.height
  );
  group.hitArea = new HitArea(group);
}
