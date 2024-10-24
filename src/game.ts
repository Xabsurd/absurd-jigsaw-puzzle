import { Application, Container, Sprite, TextStyle, Texture, Text as PixiText } from 'pixi.js';
import { clearTextureCache } from '@pixi/utils';
import { GeneratePath, LinesType, TileTool } from './svgTools';
import PieceTools, { loadImage, OptimizationType } from './pieceTools';
import UserControl from './userControl';

import PuzzleTile from './puzzleTile';
import Validate from './validate';
export default class Gmae {
  puzzleTiles!: Map<string, PuzzleTile>;
  app: Application;
  userControl: UserControl | undefined;
  pieceTools!: PieceTools;
  img!: HTMLImageElement;
  generatePath!: GeneratePath;
  base_texture!: Texture;
  container!: Container;
  baseSprite: Sprite = new Sprite();
  lines!: LinesType;
  tileTool!: TileTool;
  constructor(
    public dom: HTMLElement,
    public baseImageSrc: string,
    public rows: number,
    public columns: number,
    public optimization: OptimizationType = 'none',
    public borderColor = '#ffffff'
  ) {
    this.app = new Application();
  }
  async init() {
    await this.app.init({
      resizeTo: this.dom,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preference: 'webgpu',
      antialias: true
    });
    this.dom.appendChild(this.app.canvas);
    this.addFps();
    this.pieceTools = new PieceTools(this.app, this.optimization, this.borderColor);
  }
  async start() {
    this.img = await loadImage(this.baseImageSrc);
    this.generatePath = new GeneratePath(this.img.width, this.img.height, this.rows, this.columns);
    this.base_texture = Texture.from(this.img);
    this.container = new Container();
    this.baseSprite = new Sprite(this.base_texture);
    this.lines = this.generatePath.getLines();
    this.tileTool = new TileTool(this.lines);
    this.userControl = new UserControl(this.app, this.container, this.baseSprite);
    this.puzzleTiles = new Map<string, PuzzleTile>();
    this.app.stage.addChild(this.container);
    this.userControl.setCenter();
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        const path = this.tileTool.getTilePath(x, y);
        const puzzle = await this.pieceTools.getSpriteByPath(this.baseSprite, path);
        const target = puzzle.target;
        target.x =
          Math.random() * (this.baseSprite.width * 2 - target.children[0].width) -
          puzzle.parentBound.x +
          (this.app.screen.width - this.baseSprite.width * this.container.scale.x * 2) /
            2 /
            this.container.scale.x;
        target.y =
          Math.random() * (this.baseSprite.height * 2 - target.children[0].height) -
          puzzle.parentBound.y +
          (this.app.screen.height - this.baseSprite.height * this.container.scale.y * 2) /
            2 /
            this.container.scale.y;
        target.eventMode = 'static';
        target.interactive = true;
        target.zIndex = 0;
        this.container.addChild(target);
        this.userControl.handle(target);
        const puzzleTile = target.children[0] as PuzzleTile;
        puzzleTile.column = x;
        puzzleTile.row = y;
        puzzleTile.offsetBounds = puzzle.parentBound;
        this.puzzleTiles.set(x + '-' + y, puzzleTile);
      }
    }
    const validate = new Validate(this.puzzleTiles);
    this.userControl.on('pointerup', (target) => {
      if (target) validate.validate(target);
      if (this.container.children.length === 1) {
        this.finish();
      }
    });
  }
  finish() {
    alert('finish');
  }
  restart(
    baseImageSrc: string,
    rows: number,
    columns: number,
    optimization: OptimizationType = 'none',
    borderColor = '#ffffff'
  ) {
    this.baseImageSrc = baseImageSrc;
    this.rows = rows;
    this.columns = columns;
    this.optimization = optimization;
    this.borderColor = borderColor;
    this.destroy();
    this.start();
  }
  destroy() {
    this.container.destroy(true);
    this.baseSprite.destroy(true);
    this.base_texture.destroy(true);
    this.app.stage.removeChildren();
    this.puzzleTiles.clear();
    clearTextureCache();
    // this.puzzleTiles.forEach((tile) => tile.destroy(true));
    // this.app.destroy(true);
  }
  toCenter() {
    this.userControl?.setCenter();
  }

  addFps() {
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
    this.app.stage.addChild(fpsText);

    // 创建一个计数器和时间变量
    let frameCount = 0;
    let lastTime = performance.now();

    // 渲染循环
    this.app.ticker.add(() => {
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
}
