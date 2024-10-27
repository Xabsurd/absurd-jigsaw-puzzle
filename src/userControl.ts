import { Application, Container, FederatedPointerEvent, FederatedWheelEvent } from 'pixi.js';
export type UserControlEventName = 'pointermove' | 'pointerdown' | 'pointerup';
export type UserControlEvent = {
  pointermove: (target?: Container) => void;
  pointerdown: (target?: Container) => void;
  pointerup: (target?: Container) => void;
};
export default class UserControl {
  #dragTarget: {
    cachePosition: { x: number; y: number };
    mousePosition: { x: number; y: number };
    target: Container;
    needScale?: boolean;
  } | null = null;
  public maxScale = 4;
  public minScale = 0.25;
  private listener = new Map<UserControlEventName, UserControlEvent[UserControlEventName]>();
  constructor(
    public app: Application,
    public mainContainer: Container,
    public baseSprite: Container
  ) {
    app.stage.hitArea = app.screen;
    app.stage.eventMode = 'static';
    app.stage.on('pointermove', this.pointermove.bind(this));
    app.stage.on('pointerup', this.pointerup.bind(this));
    app.stage.on('wheel', this.wheel.bind(this));
    app.stage.on('pointerdown', (e) => {
      this.#dragTarget = {
        cachePosition: { x: this.mainContainer.x, y: this.mainContainer.y },
        mousePosition: { x: e.pageX, y: e.pageY },
        target: this.mainContainer,
        needScale: false
      };
    });
  }
  public on(eventName: UserControlEventName, cb: UserControlEvent[UserControlEventName]) {
    this.listener.set(eventName, cb);
  }
  public off(eventName: UserControlEventName) {
    this.listener.delete(eventName);
  }
  public handle(target: Container) {
    target.zIndex = 1;
    target.on('pointerdown', this.pointerdown.bind(this));
  }
  public dehandle(target: Container) {
    target.off('pointerdown');
  }
  private pointerdown(event: FederatedPointerEvent) {
    //判断event.currentTarget是不是container
    if (event.currentTarget instanceof Container) {
      event.stopPropagation();
    }
    event.currentTarget.zIndex = 2;
    // event.preventDefault();
    this.#dragTarget = {
      cachePosition: { x: event.currentTarget.x, y: event.currentTarget.y },
      mousePosition: { x: event.pageX, y: event.pageY },
      target: event.currentTarget as Container,
      needScale: true
    };
    this.listener.get('pointerdown')?.(event.currentTarget);
  }
  private pointermove(event: FederatedPointerEvent) {
    if (this.#dragTarget) {
      this.#dragTarget.target.position.x =
        this.#dragTarget.cachePosition.x +
        (event.x - this.#dragTarget.mousePosition.x) /
          (this.#dragTarget.needScale ? this.mainContainer.scale.x : 1);
      this.#dragTarget.target.position.y =
        this.#dragTarget.cachePosition.y +
        (event.y - this.#dragTarget.mousePosition.y) /
          (this.#dragTarget.needScale ? this.mainContainer.scale.x : 1);
      this.listener.get('pointermove')?.(this.#dragTarget?.target);
    }
  }
  private pointerup() {
    if (this.#dragTarget) {
      this.#dragTarget.target.zIndex = 1;
      this.listener.get('pointerup')?.(this.#dragTarget?.target);
      this.#dragTarget = null;
    }
  }
  private wheel(event: FederatedWheelEvent) {
    //计算当前鼠标相对于container的位置并还原成未缩放前的位置
    const opposeX = (event.screenX - this.mainContainer.x) / this.mainContainer.scale.x;
    const opposeY = (event.screenY - this.mainContainer.y) / this.mainContainer.scale.x;
    const scale = Math.max(
      this.minScale,
      Math.min(this.maxScale, this.mainContainer.scale.x * (1 - event.deltaY / 1000))
    );
    const offserScale = scale - this.mainContainer.scale.x;
    this.mainContainer.scale.x = scale;
    this.mainContainer.scale.y = scale;
    this.mainContainer.x = this.mainContainer.x - opposeX * offserScale;
    this.mainContainer.y = this.mainContainer.y - opposeY * offserScale;
  }
  setCenter() {
    const widthProp = this.app.screen.width / this.baseSprite.width;
    const heightProp = this.app.screen.height / this.baseSprite.height;
    const scale = Math.min(widthProp, heightProp) / 2;
    this.mainContainer.scale.x = scale;
    this.mainContainer.scale.y = scale;
    this.minScale = scale / 2;
    // this.mainContainer.x=(this.app.screen.width-this.baseSprite.width*scale)/2;
    // this.mainContainer.y=(this.app.screen.height-this.baseSprite.height*scale)/2;
    this.mainContainer.x=0;
    this.mainContainer.y=0;
    console.log(this.app.screen.width, this.baseSprite.height * scale);
  }
}
