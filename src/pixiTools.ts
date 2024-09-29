import {
  Application,
  Container,
  Graphics,
  GraphicsPath,
  IHitArea,
  Point,
  Polygon,
  RenderTexture,
  SCALE_MODES,
  Sprite,
  Texture,
} from "pixi.js";
import { GeneratePath } from "./svgTools";
import {svgPathProperties} from "svg-path-properties";
export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default class PixiTools {
  constructor(public app: Application) {}
  getTextureByPath(target: Sprite, path: string) {
    const graphicsPath = new GraphicsPath(path);
    const mask = new Graphics();
    mask.path(graphicsPath);
    mask.fill({ color: 0xebc5ff });
    mask.stroke({ color: 0x8bc5ff, width: 3, alpha: 1 });
    target.mask = mask;
    const texture = this.app.renderer.generateTexture({
      target: target,
      frame: graphicsPath.bounds.rectangle,
    });
    return { texture, parentBound: graphicsPath.bounds };
  }
  async getSpriteByPath(target: Sprite, path: string) {
    const graphicsPath = new GraphicsPath(path);
    const mask = new Graphics();
    mask.path(graphicsPath);
    mask.fill({ color: 0xebc5ff });
    mask.stroke({ color: 0x8bc5ff, width: 3, alpha: 1 });
    target.mask = mask;
    target.x = -graphicsPath.bounds.x;
    target.y = -graphicsPath.bounds.y;
    const texture = RenderTexture.create({
      width: graphicsPath.bounds.width,
      height: graphicsPath.bounds.height,
      // antialias: true,
    });
    this.app.renderer.render({ target: texture, container: target });
    const sprite = new Sprite(texture);
    const container = new Container();
    container.addChild(sprite);
    mask.destroy();

    const border_g = new Graphics();
    border_g.path(graphicsPath);
    border_g.stroke({ color: 0x8bc5ff, width: 2, alpha: 1 });
    border_g.x = -graphicsPath.bounds.x;
    border_g.y = -graphicsPath.bounds.y;
    const border_texture = RenderTexture.create({
      width: border_g.bounds.width,
      height: border_g.bounds.height,
      // antialias: true,
    });
    const border = new Sprite(border_texture);
    this.app.renderer.render({ target: border_texture, container: border_g });
    // border_g.destroy();
    container.addChild(border);
    border_g.fill({ color: 0x000000, alpha: 0 });
    const svg =new   svgPathProperties(path);
    svg.getTotalLength();
    const points = [];
    for (let i = 0; i < svg.getTotalLength(); i+=10) {
      const point = svg.getPointAtLength(i);
      points.push(new Point(point.x+border_g.x, point.y+border_g.y));
    }
    container.hitArea = new Polygon(points);
    
    return { sprite: container, parentBound: graphicsPath.bounds };
  }
}
export class IHitGraphics implements IHitArea {
  constructor(public target: Graphics) {}
  contains(x: number, y: number): boolean {
    // throw new Error("Method not implemented.");
    if (this.target.bounds.containsPoint(x - this.target.x, y - this.target.y)) {
      return this.target.hitArea?.contains(x, y)||false;
    }else{
      return false;
    }
  }
}
