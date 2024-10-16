import { Application, Container, Sprite, TextStyle, Texture, Text as PixiText } from 'pixi.js';
import './style.css';
import { GeneratePath, TileTool } from './svgTools';
import PieceTools, { loadImage, OptimizationType } from './pieceTools';
import UserControl from './userControl';
import Interfaces from './interfaces';
import PuzzleTile from './puzzleTile';
import Validate from './validate';
// const columns = 50,
// const baseImageSrc = './95494859_p0.jpg';
//   rows = 50;
const appDiv = document.getElementById('app') as HTMLDivElement;
// const svgContainer = document.getElementById('svg-container') as HTMLDivElement;
// init();
const interfaces = new Interfaces();
interfaces.onStart = (src: string, rows: number, columns: number,optimization:OptimizationType) => {
  init(src, rows, columns,optimization);
};
async function init(baseImageSrc: string, rows: number, columns: number,optimization:OptimizationType='none') {
  const app = new Application();
  await app.init({
    resizeTo: appDiv,
    backgroundAlpha: 0,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    preference: 'webgpu',
    // antialias: true
  });
  appDiv.appendChild(app.canvas);
  addFps(app);
  // return;
  const pixiTools = new PieceTools(app,optimization);
  const img = await loadImage(baseImageSrc);
  const generatePath = new GeneratePath(img.width, img.height, rows, columns);
  const base_texture = Texture.from(img);
  const container = new Container();
  app.stage.addChild(container);
  const baseSprite = new Sprite(base_texture);
  const lines = generatePath.getLines();
  const tileTool = new TileTool(lines);
  const userControl = new UserControl(app, container, baseSprite);
  const puzzleTiles = new Map<string, PuzzleTile>();
  userControl.setCenter();
  console.log(app.screen.width - baseSprite.width * container.scale.x);
  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {
      const path = tileTool.getTilePath(x, y);
      const puzzle = await pixiTools.getSpriteByPath(baseSprite, path);
      const target = puzzle.target;
      target.x =
        Math.random() * (baseSprite.width * 2 - target.children[0].width) -
        puzzle.parentBound.x +
        (app.screen.width - baseSprite.width * container.scale.x * 2) / 2 / container.scale.x;
      target.y =
        Math.random() * (baseSprite.height * 2 - target.children[0].height) -
        puzzle.parentBound.y +
        (app.screen.height - baseSprite.height * container.scale.y * 2) / 2 / container.scale.y;
      target.eventMode = 'static';
      target.interactive = true;
      target.zIndex = 0;
      container.addChild(target);
      userControl.handle(target);
      const puzzleTile = target.children[0] as PuzzleTile;
      puzzleTile.column = x;
      puzzleTile.row = y;
      puzzleTile.offsetBounds = puzzle.parentBound;
      puzzleTiles.set(x + '-' + y, puzzleTile);
    }
  }
  const validate = new Validate(puzzleTiles);
  userControl.on('pointerup', (target) => {
    if (target) validate.validate(target);
    if (container.children.length === 1) {
      alert('拼图完成');
    }
  });
}
function addFps(app: Application) {
  const style = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 36,
    fontStyle: 'italic',
    fontWeight: 'bold',
    stroke: { color: '#cecece', width: 2, join: 'round' },
    dropShadow: {
      color: '#000000',
      blur: 2,
      angle: Math.PI / 6,
      distance: 6
    },
    wordWrap: true,
    wordWrapWidth: 440
  });

  // 创建一个文本对象用于显示帧率
  const fpsText = new PixiText({
    text: 'FPS: 0',
    style
  });
  // 设置文本位置
  fpsText.x = 10;
  fpsText.y = 10;

  fpsText.zIndex = 9999;
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
}
