import { Container, Point } from 'pixi.js';
import PuzzleTile from './PuzzleTile';

const scratch = new Point();

export default class HitArea {
  constructor(private readonly host: Container) {}

  contains(x: number, y: number): boolean {
    scratch.set(x, y);
    const children = this.host.children;
    let boundsHit = false;
    for (let i = 0, n = children.length; i < n; i++) {
      const tile = children[i];
      if (!(tile instanceof PuzzleTile)) continue;
      if (!tile.containsPathBounds(x, y, 2)) continue;
      if (tile.containsPoint(scratch)) return true;
      boundsHit = true;
    }
    return boundsHit;
  }
}
