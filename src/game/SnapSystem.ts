import { Container } from 'pixi.js';
import { getGroupCells, setGroupCells } from './puzzleGroup';

const NEIGHBORS: Array<[number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1]
];

export default class SnapSystem {
  constructor(
    public groups: Map<string, Container>,
    private getWorldThreshold: () => number,
    private rebuild: (group: Container) => void
  ) {}

  public validate(target: Container): Container {
    let group = target;
    const limit = Math.max(1, this.groups.size);
    for (let i = 0; i < limit; i++) {
      const match = this.findMatch(group);
      if (!match) break;
      group = this.merge(group, match);
    }
    return group;
  }

  private findMatch(group: Container): Container | null {
    const threshold = this.getWorldThreshold();
    for (const cell of getGroupCells(group)) {
      for (const [dx, dy] of NEIGHBORS) {
        const neighbor = this.groups.get(`${cell.column + dx}-${cell.row + dy}`);
        if (!neighbor || neighbor === group || neighbor.destroyed) continue;
        if (this.overlapping(group, neighbor, threshold)) {
          return neighbor;
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
    const src = getGroupCells(dragged).length <= getGroupCells(resting).length ? dragged : resting;
    const dst = src === dragged ? resting : dragged;
    const cells = [...getGroupCells(dst), ...getGroupCells(src)];
    setGroupCells(dst, cells);
    for (const cell of getGroupCells(src)) {
      this.groups.set(`${cell.column}-${cell.row}`, dst);
    }
    src.destroy({ children: true });
    this.rebuild(dst);
    return dst;
  }
}
