import { Application, TextStyle, Text as PixiText } from "pixi.js";

export default class Interfaces {
  constructor(public app: Application) {}
  addFps() {
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
