import { Application, Container, Sprite, Texture } from 'pixi.js';
import './style.css';
import { GeneratePath, TileTool } from './svgTools';
import PieceTools, { loadImage } from './pieceTools';
import UserControl from './userControl';
import Interfaces from './interfaces';
import PuzzleTile from './puzzleTile';
import Validate from './validate';
const baseImageSrc = './95494859_p0.jpg';
const columns = 50,
  rows = 50;
const appDiv = document.getElementById('app') as HTMLDivElement;
// const svgContainer = document.getElementById('svg-container') as HTMLDivElement;
init();
async function init() {
  const app = new Application();
  await app.init({
    resizeTo: appDiv,
    backgroundAlpha: 0,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    preference: 'webgpu',
    antialias: true
  });
  appDiv.appendChild(app.canvas);
  const pixiTools = new PieceTools(app);
  const img = await loadImage(baseImageSrc);
  const generatePath = new GeneratePath(img.width, img.height, rows, columns);
  const base_texture = Texture.from(img);
  const container = new Container();
  app.stage.addChild(container);
  const baseSprite = new Sprite(base_texture);
  const lines = generatePath.getLines();
  const tileTool = new TileTool(lines);
  const userControl = new UserControl(app, container, baseSprite);
  const interfaces = new Interfaces(app);
  const puzzleTiles = new Map<string, PuzzleTile>();
  interfaces.addFps();
  userControl.setCenter();
  console.log(app.screen.width-baseSprite.width*container.scale.x);
  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {
      const path = tileTool.getTilePath(x, y);
      const puzzle = await pixiTools.getSpriteByPath(baseSprite, path);
      const target = puzzle.target;
      target.x =
        Math.random() * (baseSprite.width * 2-target.children[0].width)-puzzle.parentBound.x+(app.screen.width-baseSprite.width*container.scale.x*2)/2/container.scale.x;
      target.y =
        Math.random() * (baseSprite.height * 2-target.children[0].height)-puzzle.parentBound.y+(app.screen.height-baseSprite.height*container.scale.y*2)/2/container.scale.y;
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
      console.log('win');
    }
  });
}
