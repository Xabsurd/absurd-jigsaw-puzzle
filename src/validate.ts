import { Container } from 'pixi.js';
import PuzzleTile from './PuzzleTile';

export default class Validate {
  constructor(public puzzleTiles: Map<string, PuzzleTile>, public redundancy = 10) {}

  public validate(target: Container) {
    for (const tile of target.children as PuzzleTile[]) {
      const id = tile.column + '-' + tile.row;
      const left_id = tile.column - 1 + '-' + tile.row;
      const right_id = tile.column + 1 + '-' + tile.row;
      const up_id = tile.column + '-' + (tile.row - 1);
      const down_id = tile.column + '-' + (tile.row + 1);

      const left_tile = this.puzzleTiles.get(left_id);
      const right_tile = this.puzzleTiles.get(right_id);
      const up_tile = this.puzzleTiles.get(up_id);
      const down_tile = this.puzzleTiles.get(down_id);
      if (left_tile) {
        this.overlapping(tile, left_tile);
      }
    }
  }
  public overlapping(tile1: PuzzleTile, tile2: PuzzleTile) {
    const tile1_x = tile1.x + tile1.parent.x - tile1.offsetBounds.x;
    const tile1_y = tile1.y + tile1.parent.y - tile1.offsetBounds.y;
    const tile2_x = tile2.x + tile2.parent.x - tile2.offsetBounds.x;
    const tile2_y = tile2.y + tile2.parent.y - tile2.offsetBounds.y;
    if (
      Math.abs(tile1_x - tile2_x) < this.redundancy ||
      Math.abs(tile1_y - tile2_y) < this.redundancy
    ) {
      return true;
    } else {
      return false;
    }
  }
}
