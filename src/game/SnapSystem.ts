import { Container, Rectangle } from 'pixi.js';
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
        const parent = neighbor?.parent;
        if (!neighbor || !parent || parent === group || parent.destroyed) continue;
        if (this.overlapping(group, parent, threshold)) {
          return parent;
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
    updateGroupCullArea(dst);
    return dst;
  }
}

export function updateGroupCullArea(group: Container) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const child of group.children) {
    if (!(child instanceof PuzzleTile)) continue;
    const bounds = child.pathBounds;
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }
  if (!Number.isFinite(minX)) return;
  group.cullArea = new Rectangle(minX, minY, maxX - minX, maxY - minY);
}
