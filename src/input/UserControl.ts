import {
  Application,
  Container,
  FederatedPointerEvent,
  FederatedWheelEvent,
  Graphics,
  GraphicsPath,
  Point
} from 'pixi.js';
import PuzzleTile from '../game/PuzzleTile';
import HitArea from '../game/HitArea';

export type UserControlEventName = 'pointermove' | 'pointerdown' | 'pointerup';
export type UserControlEvent = {
  pointermove: (target?: Container) => void;
  pointerdown: (target?: Container) => void;
  pointerup: (target?: Container) => void;
};

type DragTarget = {
  cachePosition: { x: number; y: number };
  mousePosition: { x: number; y: number };
  target: Container;
  needScale: boolean;
};

type PinchState = {
  distance: number;
  scale: number;
  worldX: number;
  worldY: number;
};

export default class UserControl {
  #dragTarget: DragTarget | null = null;
  public maxScale = 8;
  public minScale = 0.15;
  public enabled = true;
  private listener = new Map<UserControlEventName, UserControlEvent[UserControlEventName]>();
  private pointers = new Map<number, { x: number; y: number }>();
  private pinch: PinchState | null = null;
  private outline: Graphics | null = null;
  private readonly pickLocal = new Point();
  private readonly boundKeyDown: (event: KeyboardEvent) => void;
  private readonly boundPointerUp: (event: PointerEvent) => void;
  private readonly boundPointerMove: (event: PointerEvent) => void;
  private readonly boundWheel: (event: WheelEvent) => void;

  constructor(
    public app: Application,
    public mainContainer: Container,
    public borderColor = '#8bc5ff'
  ) {
    app.stage.hitArea = app.screen;
    app.stage.eventMode = 'static';
    app.stage.interactiveChildren = false;
    mainContainer.eventMode = 'none';
    mainContainer.interactiveChildren = false;
    app.stage.on('pointermove', this.pointermove, this);
    app.stage.on('pointerup', this.pointerup, this);
    app.stage.on('pointerupoutside', this.pointerup, this);
    app.stage.on('pointercancel', this.pointerup, this);
    app.stage.on('wheel', this.wheel, this);
    app.stage.on('pointerdown', this.stagePointerdown, this);

    this.boundKeyDown = this.keydown.bind(this);
    this.boundPointerUp = this.windowPointerup.bind(this);
    this.boundPointerMove = this.windowPointermove.bind(this);
    this.boundWheel = (event) => event.preventDefault();
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('pointerup', this.boundPointerUp);
    window.addEventListener('pointercancel', this.boundPointerUp);
    window.addEventListener('pointermove', this.boundPointerMove);
    app.canvas.addEventListener('wheel', this.boundWheel, { passive: false });
    app.canvas.style.touchAction = 'none';
    app.canvas.style.cursor = 'grab';
  }

  public on(eventName: UserControlEventName, cb: UserControlEvent[UserControlEventName]) {
    this.listener.set(eventName, cb);
  }

  public off(eventName: UserControlEventName) {
    this.listener.delete(eventName);
  }

  destroy() {
    this.enabled = false;
    this.#dragTarget = null;
    this.pinch = null;
    this.clearOutline();
    this.pointers.clear();
    this.listener.clear();
    this.app.stage.off('pointermove', this.pointermove, this);
    this.app.stage.off('pointerup', this.pointerup, this);
    this.app.stage.off('pointerupoutside', this.pointerup, this);
    this.app.stage.off('pointercancel', this.pointerup, this);
    this.app.stage.off('wheel', this.wheel, this);
    this.app.stage.off('pointerdown', this.stagePointerdown, this);
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('pointerup', this.boundPointerUp);
    window.removeEventListener('pointercancel', this.boundPointerUp);
    window.removeEventListener('pointermove', this.boundPointerMove);
    this.app.canvas.removeEventListener('wheel', this.boundWheel);
  }

  private isBlocked() {
    return !this.enabled || !!document.querySelector('dialog[open]');
  }

  private stagePointerdown(event: FederatedPointerEvent) {
    if (this.isBlocked()) return;
    this.pointers.set(event.pointerId, { x: event.global.x, y: event.global.y });
    if (this.pointers.size >= 2) {
      this.beginPinch();
      return;
    }
    if (this.#dragTarget) return;

    const piece = this.pick(event.global.x, event.global.y);
    if (piece) {
      this.mainContainer.addChild(piece);
      piece.alpha = 0.92;
      this.app.canvas.style.cursor = 'grabbing';
      this.showOutline(piece);
      this.#dragTarget = {
        cachePosition: { x: piece.x, y: piece.y },
        mousePosition: { x: event.global.x, y: event.global.y },
        target: piece,
        needScale: true
      };
      this.listener.get('pointerdown')?.(piece);
      return;
    }

    this.app.canvas.style.cursor = 'grabbing';
    this.#dragTarget = {
      cachePosition: { x: this.mainContainer.x, y: this.mainContainer.y },
      mousePosition: { x: event.global.x, y: event.global.y },
      target: this.mainContainer,
      needScale: false
    };
  }

  private pick(globalX: number, globalY: number): Container | null {
    const local = this.mainContainer.toLocal({ x: globalX, y: globalY }, undefined, this.pickLocal);
    const children = this.mainContainer.children;
    let fallback: Container | null = null;
    for (let i = children.length - 1; i >= 0; i--) {
      const group = children[i];
      const x = local.x - group.x;
      const y = local.y - group.y;
      let inBounds = false;
      for (const child of group.children) {
        if (!(child instanceof PuzzleTile)) continue;
        if (child.containsPathBounds(x, y, 2)) {
          inBounds = true;
          break;
        }
      }
      if (!inBounds) continue;
      const hit = group.hitArea;
      if (hit instanceof HitArea && hit.contains(x, y)) return group;
      if (!fallback) fallback = group;
    }
    return fallback;
  }

  private showOutline(group: Container) {
    this.clearOutline();
    const outline = new Graphics();
    outline.eventMode = 'none';
    outline.cullable = false;
    for (const child of group.children) {
      if (!(child instanceof PuzzleTile) || !child.pathData) continue;
      outline.path(new GraphicsPath(child.pathData));
      outline.stroke({ color: this.borderColor, width: 2 });
    }
    group.addChild(outline);
    this.outline = outline;
  }

  private clearOutline() {
    if (!this.outline || this.outline.destroyed) {
      this.outline = null;
      return;
    }
    this.outline.destroy();
    this.outline = null;
  }

  private pointermove(event: FederatedPointerEvent) {
    if (this.isBlocked()) return;
    if (this.pointers.has(event.pointerId)) {
      this.pointers.set(event.pointerId, { x: event.global.x, y: event.global.y });
    }
    if (this.pinch && this.pointers.size >= 2) {
      this.updatePinch();
      return;
    }
    if (!this.#dragTarget || this.#dragTarget.target.destroyed) return;
    const scale = this.#dragTarget.needScale ? this.mainContainer.scale.x : 1;
    this.#dragTarget.target.position.x =
      this.#dragTarget.cachePosition.x + (event.global.x - this.#dragTarget.mousePosition.x) / scale;
    this.#dragTarget.target.position.y =
      this.#dragTarget.cachePosition.y + (event.global.y - this.#dragTarget.mousePosition.y) / scale;
    this.listener.get('pointermove')?.(this.#dragTarget.target);
  }

  private pointerup(event?: FederatedPointerEvent) {
    if (event) this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (!this.#dragTarget) return;
    const target = this.#dragTarget.target;
    this.#dragTarget = null;
    this.clearOutline();
    this.app.canvas.style.cursor = 'grab';
    if (!target.destroyed) {
      target.alpha = 1;
    }
    this.listener.get('pointerup')?.(target.destroyed ? undefined : target);
  }

  private windowPointerup(event: PointerEvent) {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (this.#dragTarget && this.pointers.size === 0) {
      this.pointerup();
    }
  }

  private windowPointermove(event: PointerEvent) {
    if (this.isBlocked()) return;
    if (this.pointers.has(event.pointerId)) {
      const point = this.toLocal(event.clientX, event.clientY);
      this.pointers.set(event.pointerId, point);
    }
    if (this.pinch && this.pointers.size >= 2) {
      this.updatePinch();
      return;
    }
    if (!this.#dragTarget || this.#dragTarget.target.destroyed) return;
    const point = this.toLocal(event.clientX, event.clientY);
    const scale = this.#dragTarget.needScale ? this.mainContainer.scale.x : 1;
    this.#dragTarget.target.position.x =
      this.#dragTarget.cachePosition.x + (point.x - this.#dragTarget.mousePosition.x) / scale;
    this.#dragTarget.target.position.y =
      this.#dragTarget.cachePosition.y + (point.y - this.#dragTarget.mousePosition.y) / scale;
    this.listener.get('pointermove')?.(this.#dragTarget.target);
  }

  private toLocal(clientX: number, clientY: number) {
    const rect = this.app.canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  private wheel(event: FederatedWheelEvent) {
    if (this.isBlocked()) return;
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    this.zoomAt(event.global.x, event.global.y, this.mainContainer.scale.x * factor);
  }

  private keydown(event: KeyboardEvent) {
    if (this.isBlocked()) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;

    const pan = 48;
    switch (event.key) {
      case 'c':
      case 'C':
      case 'Home':
        event.preventDefault();
        this.fitToView();
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomAt(this.app.screen.width / 2, this.app.screen.height / 2, this.mainContainer.scale.x * 1.15);
        break;
      case '-':
      case '_':
        event.preventDefault();
        this.zoomAt(this.app.screen.width / 2, this.app.screen.height / 2, this.mainContainer.scale.x / 1.15);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.mainContainer.x += pan;
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.mainContainer.x -= pan;
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.mainContainer.y += pan;
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.mainContainer.y -= pan;
        break;
      default:
        break;
    }
  }

  private beginPinch() {
    this.clearOutline();
    this.app.canvas.style.cursor = 'grab';
    if (this.#dragTarget && !this.#dragTarget.target.destroyed) {
      this.#dragTarget.target.alpha = 1;
      if (this.#dragTarget.target !== this.mainContainer) {
        this.#dragTarget.target.cursor = 'grab';
      }
    }
    this.#dragTarget = null;
    const pts = [...this.pointers.values()];
    if (pts.length < 2) return;
    const [a, b] = pts;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const scale = this.mainContainer.scale.x || 1;
    this.pinch = {
      distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      scale,
      worldX: (midX - this.mainContainer.x) / scale,
      worldY: (midY - this.mainContainer.y) / scale
    };
  }

  private updatePinch() {
    if (!this.pinch) return;
    const pts = [...this.pointers.values()];
    if (pts.length < 2) return;
    const [a, b] = pts;
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const scale = this.clampScale(this.pinch.scale * (dist / this.pinch.distance));
    this.mainContainer.scale.set(scale);
    this.mainContainer.x = midX - this.pinch.worldX * scale;
    this.mainContainer.y = midY - this.pinch.worldY * scale;
  }

  private zoomAt(screenX: number, screenY: number, nextScale: number) {
    const scale = this.clampScale(nextScale);
    const current = this.mainContainer.scale.x || 1;
    const worldX = (screenX - this.mainContainer.x) / current;
    const worldY = (screenY - this.mainContainer.y) / current;
    this.mainContainer.scale.set(scale);
    this.mainContainer.x = screenX - worldX * scale;
    this.mainContainer.y = screenY - worldY * scale;
  }

  private clampScale(scale: number) {
    return Math.max(this.minScale, Math.min(this.maxScale, scale));
  }

  fitToView(padding = 0.88) {
    const children = this.mainContainer.children;
    if (!children.length) {
      this.mainContainer.scale.set(1);
      this.mainContainer.position.set(0, 0);
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const child of children) {
      for (const tile of child.children) {
        if (!(tile instanceof PuzzleTile)) continue;
        const bounds = tile.pathBounds;
        minX = Math.min(minX, child.x + bounds.x);
        minY = Math.min(minY, child.y + bounds.y);
        maxX = Math.max(maxX, child.x + bounds.x + bounds.width);
        maxY = Math.max(maxY, child.y + bounds.y + bounds.height);
      }
    }

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const scale = Math.min(this.app.screen.width / width, this.app.screen.height / height) * padding;
    this.minScale = Math.max(0.05, scale * 0.2);
    this.maxScale = Math.max(4, scale * 10);
    this.mainContainer.scale.set(scale);
    this.mainContainer.x = (this.app.screen.width - (minX + maxX) * scale) / 2;
    this.mainContainer.y = (this.app.screen.height - (minY + maxY) * scale) / 2;
  }

  setCenter() {
    this.fitToView();
  }
}
