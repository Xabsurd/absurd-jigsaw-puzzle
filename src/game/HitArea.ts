import { Container, Point } from 'pixi.js';
import PuzzleTile from './PuzzleTile';

const scratch = new Point();

export default class HitArea {
  constructor(private readonly host: Container) {}

  contains(x: number, y: number): boolean {
    scratch.set(x, y);
    const children = this.host.children;
    for (let i = 0, n = children.length; i < n; i++) {
      if ((children[i] as PuzzleTile).containsPoint(scratch)) {
        return true;
      }
    }
    return false;
  }
}
