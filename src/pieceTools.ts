import {
  Application,
  Bounds,
  Container,
  Graphics,
  GraphicsPath,
  IHitArea,
  Point,
  Polygon,
  RenderTexture,
  Sprite,
} from 'pixi.js';
import { svgPathProperties } from 'svg-path-properties';
import PuzzleTile from './puzzleTile';
import HitArea from './hitArea';
export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
export type OptimizationType = 'none' | 'antialias' | 'reRender';
export default class PieceTools {
  constructor(public app: Application, public optimization: OptimizationType = 'none', public borderColor = '0x8bc5ff') {}
  getTextureByPath(target: Sprite, path: string) {
    const graphicsPath = new GraphicsPath(path);
    const mask = new Graphics();
    mask.path(graphicsPath);
    mask.fill({ color: 0xffffff });
    // mask.stroke({ color: 0x8bc5ff, width: 3, alpha: 1 });
    target.mask = mask;
    const texture = this.app.renderer.generateTexture({
      target: target,
      frame: graphicsPath.bounds.rectangle
    });
    return { texture, parentBound: graphicsPath.bounds };
  }
  async getSpriteByPath(target: Sprite, path: string) {
    const offset = 2;
    let graphicsPath: GraphicsPath | null = new GraphicsPath(path);
    const mask = new Graphics();
    mask.path(graphicsPath);
    mask.fill({ color: 0xffffff });
    target.mask = mask;
    const border_g = new Graphics();
    border_g.path(graphicsPath);
    border_g.stroke({ color: this.borderColor, width: 2});
    const texture: RenderTexture | null = RenderTexture.create({
      width: graphicsPath.bounds.width + offset * 2,
      height: graphicsPath.bounds.height + offset * 2,
      antialias: this.optimization !== 'none' ? true : false
    });
    const render_container = new Container();
    render_container.x = -graphicsPath.bounds.x + offset;
    render_container.y = -graphicsPath.bounds.y + offset;
    render_container.addChild(target);
    render_container.addChild(border_g);
    this.app.renderer.render({ target: texture, container: render_container });
    let sprite;
    if (this.optimization === 'reRender') {
      const image = await this.app.renderer.extract.image(texture);
      sprite = PuzzleTile.from(image);
    } else {
      sprite = PuzzleTile.from(texture);
    }
    sprite.x = graphicsPath.bounds.x - offset;
    sprite.y = graphicsPath.bounds.y - offset;
    const container = new Container();
    container.addChild(sprite);
    const svg = new svgPathProperties(path);
    svg.getTotalLength();
    const points = [];
    for (let i = 0; i < svg.getTotalLength(); i += 10) {
      const point = svg.getPointAtLength(i);
      points.push(new Point(point.x, point.y));
    }
    container.hitArea = new HitArea([new Polygon(points)]);

    const bounds = new Bounds(
      graphicsPath.bounds.x - offset,
      graphicsPath.bounds.y - offset,
      texture.width + offset * 2,
      texture.height + offset * 2
    );
    if (this.optimization === 'reRender') {
      texture.destroy(true);
    }
    render_container.removeChild(target);
    render_container.removeChild(border_g);
    render_container.destroy(true);
    border_g.destroy(true);
    target.mask = null;
    mask.destroy(true);
    graphicsPath.clear();
    graphicsPath = null;
    return { target: container, parentBound: bounds };
  }
}
export class IHitGraphics implements IHitArea {
  constructor(public target: Graphics) {}
  contains(x: number, y: number): boolean {
    // throw new Error("Method not implemented.");
    if (this.target.bounds.containsPoint(x - this.target.x, y - this.target.y)) {
      return this.target.hitArea?.contains(x, y) || false;
    } else {
      return false;
    }
  }
}
