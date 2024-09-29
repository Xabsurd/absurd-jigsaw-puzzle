import {
  Application,
  autoDetectRenderer,
  Container,
  ContainerChild,
  ExtractOptions,
  GlTextureSystem,
  GpuTextureSystem,
  Graphics,
  GraphicsPath,
  Polygon,
  RenderTexture,
  Sprite,
  Texture,
  TextureSource,
  BLEND_MODES,
  Text as PixiText,
  FederatedPointerEvent,
  TextStyle,
} from "pixi.js";
import "./style.css";
import { GeneratePath, TileTool } from "./svgTools";
import PixiTools, { loadImage } from "./pixiTools";
import UserControl from "./userControl";
const baseImageSrc = "./95494859_p0.jpg";
const columns = 20,
  rows = 20;
const appDiv = document.getElementById("app") as HTMLDivElement;
const svgContainer = document.getElementById("svg-container") as HTMLDivElement;
const app = new Application();
await app.init({
  resizeTo: appDiv,
  backgroundAlpha: 0,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  preference: "webgpu",
});
appDiv.appendChild(app.canvas);
const pixiTools = new PixiTools(app);
const img = await loadImage(baseImageSrc);
const generatePath = new GeneratePath(img.width, img.height, rows, columns);
const base_texture = Texture.from(img);
const container = new Container({
  isRenderGroup: true,
});
app.stage.addChild(container);
container.scale = 0.25;
const baseSprite = new Sprite(base_texture);

const lines = generatePath.getLines();
console.log(lines);
const tileTool = new TileTool(lines);
const userControl = new UserControl(app, container);
console.time("time");
for (let x = 0; x < columns; x++) {
  for (let y = 0; y < rows; y++) {
    const path = tileTool.getTilePath(x, y);
    const _sprite = await pixiTools.getSpriteByPath(baseSprite, path);
    const sprite = _sprite.sprite;
    sprite.x = _sprite.parentBound.x;
    sprite.y = _sprite.parentBound.y;
    sprite.eventMode = "static";
    sprite.interactive = true;
    sprite.zIndex = 0;
    container.addChild(sprite);
    userControl.handle(sprite);
  }
}

const style = new TextStyle({
  fontFamily: "Arial",
  fontSize: 36,
  fontStyle: "italic",
  fontWeight: "bold",
  stroke: { color: "#4a1850", width: 5, join: "round" },
  dropShadow: {
    color: "#000000",
    blur: 4,
    angle: Math.PI / 6,
    distance: 6,
  },
  wordWrap: true,
  wordWrapWidth: 440,
});

// 创建一个文本对象用于显示帧率
const fpsText = new PixiText({
  text: "FPS: 0",
  style,
});
// 设置文本位置
fpsText.x = 10;
fpsText.y = 10;

// 将文本添加到舞台
app.stage.addChild(fpsText);

// 创建一个计数器和时间变量
let frameCount = 0;
let lastTime = performance.now();

// 渲染循环
app.ticker.add(() => {
  frameCount++;

  // 每秒更新一次帧率
  const currentTime = performance.now();
  if (currentTime - lastTime >= 1000) {
    fpsText.text = `FPS: ${frameCount}`;
    frameCount = 0;
    lastTime = currentTime;
  }
});
