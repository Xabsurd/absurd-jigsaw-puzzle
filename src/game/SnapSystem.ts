import { Container } from 'pixi.js';
import PuzzleTile from './PuzzleTile';

const NEIGHBORS: Array<[number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1]
];

export default class SnapSystem {
  constructor(
    public puzzleTiles: Map<string, PuzzleTile>,
    private getWorldThreshold: () => number
  ) {}

  public validate(target: Container): Container {
    let group = target;
    const limit = Math.max(1, this.puzzleTiles.size);
    for (let i = 0; i < limit; i++) {
      const match = this.findMatch(group);
      if (!match) break;
      group = this.merge(group, match);
    }
    return group;
  }

  private findMatch(group: Container): Container | null {
    const threshold = this.getWorldThreshold();
    for (const tile of group.children as PuzzleTile[]) {
      for (const [dx, dy] of NEIGHBORS) {
        const neighbor = this.puzzleTiles.get(`${tile.column + dx}-${tile.row + dy}`);
        if (!neighbor || neighbor.parent === group || neighbor.parent.destroyed) continue;
        if (this.overlapping(group, neighbor.parent, threshold)) {
          return neighbor.parent;
        }
      }
    }
    return null;
  }

  private overlapping(a: Container, b: Container, threshold: number) {
    return Math.abs(a.x - b.x) < threshold && Math.abs(a.y - b.y) < threshold;
  }

  public merge(dragged: Container, resting: Container): Container {
    dragged.position.copyFrom(resting.position);

    const src = dragged.children.length <= resting.children.length ? dragged : resting;
    const dst = src === dragged ? resting : dragged;

    const moving = src.children.slice();
    for (const child of moving) {
      dst.addChild(child);
    }
    src.destroy({ children: false });
    return dst;
  }
}
