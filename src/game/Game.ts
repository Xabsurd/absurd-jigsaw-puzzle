import { Application, Container, CullerPlugin, Texture, extensions } from 'pixi.js';
import { GeneratePath, TileTool } from '../svgTools';
import PieceFactory from './PieceFactory';
import UserControl from '../input/UserControl';
import PuzzleTile from './PuzzleTile';
import SnapSystem from './SnapSystem';
import { GameConfig } from '../types';
import type { DisplaySettings } from '../displaySettings';
import { loadPuzzleImage, yieldFrame } from '../assets';

try {
  extensions.add(CullerPlugin);
} catch {
  // already registered
}

export default class Game {
  puzzleTiles = new Map<string, Container>();
  app: Application | undefined;
  userControl: UserControl | undefined;
  private factory: PieceFactory | undefined;
  private container: Container | undefined;
  private snap: SnapSystem | undefined;
  private objectUrl: string | undefined;
  private display: DisplaySettings = {
    showStroke: true,
    borderColor: '#8bc5ff',
    backgroundColor: '#111111'
  };
  private fpsHook: (() => void) | undefined;
  private session = 0;
  private disposed = true;
  finished = false;

  onFinish: () => void = () => {};
  onProgress: (done: number, total: number) => void = () => {};
  onStats: (merged: number, total: number, groups: number) => void = () => {};
  onFps: (fps: number) => void = () => {};

  constructor(public dom: HTMLElement) {}

  async play(config: GameConfig) {
    await this.dispose();
    const session = this.session;
    this.disposed = false;
    this.objectUrl = config.src;
    this.display = {
      showStroke: config.showStroke,
      borderColor: config.borderColor,
      backgroundColor: config.backgroundColor
    };
    this.finished = false;
    await this.initRenderer();
    if (this.isStale(session)) return;
    try {
      await this.startSession(config, session);
    } catch (error) {
      if (this.isStale(session)) return;
      throw error;
    }
  }

  private async initRenderer() {
    this.app = new Application();
    await this.app.init({
      resizeTo: this.dom,
      backgroundAlpha: 0,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: 'webgpu',
      antialias: true,
      bezierSmoothness: 0,
      powerPreference: 'high-performance',
      culler: { updateTransform: true }
    });
    this.app.canvas.style.display = 'block';
    this.app.canvas.style.touchAction = 'none';
    this.dom.appendChild(this.app.canvas);

    let lastFpsAt = 0;
    this.fpsHook = () => {
      if (!this.app) return;
      const now = performance.now();
      if (now - lastFpsAt >= 400) {
        lastFpsAt = now;
        this.onFps(Math.round(this.app.ticker.FPS));
      }
    };
    this.app.ticker.add(this.fpsHook);
  }

  private async startSession(config: GameConfig, session: number) {
    if (!this.app) return;

    const { image, width, height } = await loadPuzzleImage(config.src);
    const generatePath = new GeneratePath(width, height, config.rows, config.columns);
    const texture = Texture.from(image);
    texture.source.autoGenerateMipmaps = true;
    texture.source.scaleMode = 'linear';
    const lines = generatePath.getLines();
    const tileTool = new TileTool(lines);

    this.container = new Container();
    this.container.eventMode = 'none';
    this.container.interactiveChildren = false;
    this.container.cullable = false;
    this.container.cullableChildren = true;
    this.app.stage.addChild(this.container);

    this.userControl = new UserControl(this.app, this.container, this.display.borderColor);
    this.factory = new PieceFactory(this.display, texture, tileTool);
    this.snap = new SnapSystem(this.puzzleTiles, () => this.snapThreshold(), (group) => {
      this.factory?.rebuild(group);
    });

    const total = config.columns * config.rows;
    const yieldEvery = Math.max(1, Math.floor(total / 80));
    let done = 0;
    const areaW = width * 2;
    const areaH = height * 2;

    for (let x = 0; x < config.columns; x++) {
      for (let y = 0; y < config.rows; y++) {
        if (this.isStale(session) || !this.factory) return;
        const path = tileTool.getTilePath(x, y);
        const puzzle = this.factory.create(path, x, y);
        if (this.isStale(session) || !this.userControl || !this.container) return;
        const target = puzzle.target;
        const bounds = puzzle.sprite.pathBounds;
        const rangeX = Math.max(1, areaW - bounds.width);
        const rangeY = Math.max(1, areaH - bounds.height);
        target.x = Math.random() * rangeX - bounds.x;
        target.y = Math.random() * rangeY - bounds.y;
        this.container.addChild(target);
        this.puzzleTiles.set(`${x}-${y}`, target);
        done++;
        if (done === 1 || done === total || done % yieldEvery === 0) {
          this.onProgress(done, total);
          await yieldFrame();
        }
      }
    }

    this.userControl.fitToView();
    this.emitStats();

    this.userControl.on('pointerup', (target) => {
      if (!target || !this.container || target === this.container || this.finished) return;
      this.snap?.validate(target);
      this.emitStats();
      if (this.container.children.length <= 1 && this.puzzleTiles.size > 0) {
        this.finish();
      }
    });
  }

  private snapThreshold() {
    const scale = this.container?.scale.x || 1;
    return 28 / scale;
  }

  private emitStats() {
    const total = this.puzzleTiles.size;
    const groups = this.container?.children.length ?? 0;
    this.onStats(Math.max(0, total - groups), total, groups);
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.onFinish();
  }

  toCenter() {
    this.userControl?.fitToView();
  }

  applyDisplay(settings: DisplaySettings) {
    this.display = settings;
    this.dom.style.backgroundColor = settings.backgroundColor;
    if (this.userControl) this.userControl.borderColor = settings.borderColor;
    if (this.factory) this.factory.display = settings;
    const seen = new Set<Container>();
    this.puzzleTiles.forEach((group) => {
      if (seen.has(group) || group.destroyed) return;
      seen.add(group);
      for (const child of group.children) {
        if (child instanceof PuzzleTile) {
          child.setStroke(settings.showStroke, settings.borderColor);
        }
      }
    });
  }

  private isStale(session: number) {
    return this.disposed || session !== this.session;
  }

  async dispose() {
    this.disposed = true;
    this.session += 1;
    this.userControl?.destroy();
    this.userControl = undefined;
    this.factory = undefined;
    this.snap = undefined;
    this.puzzleTiles.clear();
    this.container = undefined;

    if (this.app) {
      if (this.fpsHook) this.app.ticker.remove(this.fpsHook);
      this.app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true, context: true });
      this.app = undefined;
    }

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
  }
}
