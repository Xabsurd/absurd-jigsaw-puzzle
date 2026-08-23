import { Graphics, GraphicsPath, Renderer } from 'pixi.js';

export type PathBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function boundsFromPath(path: string): PathBounds {
  const nums = path.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!nums || nums.length < 2) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = Number(nums[i]);
    const y = Number(nums[i + 1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY)
  };
}

export default class PuzzleTile extends Graphics {
  public row = -1;
  public column = -1;
  public pathData = '';
  public pathBounds: PathBounds = { x: 0, y: 0, width: 1, height: 1 };
  private strokeGfx: Graphics | null = null;
  private renderer: Renderer | undefined;

  containsPathBounds(x: number, y: number, pad = 0) {
    const bounds = this.pathBounds;
    return (
      x >= bounds.x - pad &&
      y >= bounds.y - pad &&
      x <= bounds.x + bounds.width + pad &&
      y <= bounds.y + bounds.height + pad
    );
  }

  attachRenderer(renderer: Renderer) {
    this.renderer = renderer;
  }

  setStroke(enabled: boolean, color: string) {
    if (!enabled) {
      if (this.strokeGfx) this.strokeGfx.visible = false;
      return;
    }
    if (!this.strokeGfx) {
      this.strokeGfx = new Graphics();
      this.strokeGfx.eventMode = 'none';
      this.strokeGfx.interactiveChildren = false;
      this.strokeGfx.cullable = true;
      this.addChild(this.strokeGfx);
    }
    this.strokeGfx.clear();
    this.strokeGfx.visible = true;
    this.strokeGfx.path(new GraphicsPath(this.pathData));
    this.strokeGfx.stroke({
      color,
      width: 2,
      alignment: 0.5,
      join: 'miter',
      cap: 'butt',
      miterLimit: 2
    });
    forceBatch(this.renderer, this.strokeGfx);
  }
}

export function forceBatch(renderer: Renderer | undefined, graphics: Graphics) {
  if (!renderer) return;
  const gpu = renderer.graphicsContext.updateGpuContext(graphics.context);
  gpu.isBatchable = true;
}
