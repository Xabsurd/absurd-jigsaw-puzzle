import { Container } from 'pixi.js';
import PuzzleTile from './puzzleTile';
import HitArea from './hitArea';
export default class Validate {
  constructor(public puzzleTiles: Map<string, PuzzleTile>, public redundancy = 10) {}

  public validate(target: Container) {
    for (const tile of target.children as PuzzleTile[]) {
      const left_id = tile.column - 1 + '-' + tile.row;
      const right_id = tile.column + 1 + '-' + tile.row;
      const up_id = tile.column + '-' + (tile.row - 1);
      const down_id = tile.column + '-' + (tile.row + 1);
      const left_tile = this.puzzleTiles.get(left_id);
      const right_tile = this.puzzleTiles.get(right_id);
      const up_tile = this.puzzleTiles.get(up_id);
      const down_tile = this.puzzleTiles.get(down_id);
      if (left_tile && tile.parent.uid !== left_tile.parent.uid) {
        if (this.overlapping(tile, left_tile)) {
          this.merge(tile, left_tile);
          return;
        }
      }

      if (right_tile && tile.parent.uid !== right_tile.parent.uid) {
        if (this.overlapping(tile, right_tile)) {
          this.merge(tile, right_tile);
          return;
        }
      }
      if (up_tile && tile.parent.uid !== up_tile.parent.uid) {
        if (this.overlapping(tile, up_tile)) {
          this.merge(tile, up_tile);
          return;
        }
      }

      if (down_tile && tile.parent.uid !== down_tile.parent.uid) {
        if (this.overlapping(tile, down_tile)) {
          this.merge(tile, down_tile);
          return;
        }
      }
    }
  }
  public overlapping(tile1: PuzzleTile, tile2: PuzzleTile) {
    const tile1_x = tile1.x + tile1.parent.x - tile1.offsetBounds.x;
    const tile1_y = tile1.y + tile1.parent.y - tile1.offsetBounds.y;
    const tile2_x = tile2.x + tile2.parent.x - tile2.offsetBounds.x;
    const tile2_y = tile2.y + tile2.parent.y - tile2.offsetBounds.y;
    try {
      if (
        Math.abs(tile1_x - tile2_x) < this.redundancy ||
        Math.abs(tile1_y - tile2_y) < this.redundancy
      ) {
        return true;
      } else {
        return false;
      }
    } catch{
      return false;
    }
  }
  public merge(tile1: PuzzleTile, tile2: PuzzleTile) {
    const parent1 = tile1.parent;
    const parent2 = tile2.parent;
    for (const children of parent1.children as PuzzleTile[]) {
      const new_children = children.clone();
      parent2.addChild(new_children);
      this.puzzleTiles.set(new_children.column + '-' + new_children.row, new_children);
    }
    (parent2.hitArea as HitArea).merge(parent1.hitArea as HitArea);
    parent1.destroy();
  }
}
