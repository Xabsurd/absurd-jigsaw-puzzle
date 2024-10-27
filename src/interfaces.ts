import { Model } from './model';
import { OptimizationType } from './pieceTools';
import { GeneratePath } from './svgTools';

export default class Interfaces {
  tipButton: HTMLButtonElement;
  columnsSpan: HTMLSpanElement;
  rowsSpan: HTMLSpanElement;
  columnsInput: HTMLInputElement;
  rowsInput: HTMLInputElement;
  optimizationInput: NodeListOf<HTMLInputElement>;
  uploadButton: HTMLButtonElement;
  startButton: HTMLButtonElement;
  fileInput: HTMLInputElement;
  previewImage: HTMLImageElement;
  previewSvg: HTMLElement;
  borderColor: HTMLInputElement;
  backgroundColor: HTMLInputElement;
  appDiv: HTMLDivElement;
  model: Model = new Model();
  fpsSpan: HTMLSpanElement;
  timerSpan: HTMLSpanElement;
  fps: number = 0;
  timer: number = 0;
  beginTime: number = 0;
  lastTime: number = 0;
  constructor() {
    this.appDiv = document.getElementById('app') as HTMLDivElement;
    this.columnsSpan = document.getElementById('colmuns-label') as HTMLSpanElement;
    this.rowsSpan = document.getElementById('rows-label') as HTMLSpanElement;
    this.columnsInput = document.getElementById('colmuns') as HTMLInputElement;
    this.rowsInput = document.getElementById('rows') as HTMLInputElement;
    this.optimizationInput = document.getElementsByName(
      'optimization'
    ) as NodeListOf<HTMLInputElement>;
    this.uploadButton = document.getElementById('upload') as HTMLButtonElement;
    this.startButton = document.getElementById('start') as HTMLButtonElement;
    this.fileInput = document.getElementById('file-upload') as HTMLInputElement;
    this.previewImage = document.getElementById('preview-image') as HTMLImageElement;
    this.previewSvg = document.getElementById('preview-svg') as HTMLElement;
    this.borderColor = document.getElementById('border-color') as HTMLInputElement;
    this.backgroundColor = document.getElementById('background-color') as HTMLInputElement;
    this.tipButton = document.getElementById('control-tip') as HTMLButtonElement;
    this.fpsSpan = document.getElementById('fps') as HTMLSpanElement;
    this.timerSpan = document.getElementById('timer') as HTMLSpanElement;
    this.setup();
  }
  setup() {
    this.columnsInput.addEventListener('change', () => {
      this.columnsSpan.innerHTML = this.columnsInput.value;
    });

    this.rowsInput.addEventListener('change', () => {
      this.rowsSpan.innerHTML = this.rowsInput.value;
      this.renderPreview();
    });

    this.borderColor.addEventListener('change', () => {
      this.renderPreview();
    });

    this.backgroundColor.addEventListener('change', () => {
      this.appDiv.style.backgroundColor = this.backgroundColor.value;
    });
    this.uploadButton.onclick = () => {
      this.fileInput.click();
    };
    this.fileInput.onchange = () => {
      this.renderPreview();
    };
    this.tipButton.onclick = () => {
      this.model.change(
        '提示',
        `
        <p class='space'>重新开始按钮无法完全清理内存和显存，目前还没研究出什么原因，直接刷新网页即可完全清理</p>
        <p class='space'>如您知道解决方式或其他意见，可以给<a href="https://github.com/Xabsurd/absurd-jigsaw-puzzle" target="_blank">仓库</a>提<a href="https://github.com/Xabsurd/absurd-jigsaw-puzzle/issues" target="_blank">issue</a></p>
        <strong>使用说明</strong>
        <ul>
          <li><strong>鼠标滚轮:</strong>缩放画布</li>
          <li><strong>鼠标左键选中拼图:</strong>拖动拼图</li>
          <li><strong>鼠标左键选中空白区域:</strong>拖动整个画布</li>
        `
      );
      this.model.open();
    };
    requestAnimationFrame(this.nextFrame.bind(this));
  }
  init() {
    return new Promise<{
      src: string;
      rows: number;
      columns: number;
      optimization: OptimizationType;
      borderColor: string;
    }>((resolve) => {
      this.startButton.onclick = () => {
        if (this.fileInput.files && this.fileInput.files[0]) {
          const file = this.fileInput.files[0];
          const src = URL.createObjectURL(file);
          for (let i = 0; i < this.optimizationInput.length; i++) {
            const element = this.optimizationInput[i];
            console.log(element.id);
            if (element.checked) {
              this.start();
              resolve({
                src,
                rows: parseInt(this.rowsInput.value),
                columns: parseInt(this.columnsInput.value),
                optimization: element.id as OptimizationType,
                borderColor: this.borderColor.value
              });
              return;
            }
          }
        } else {
          this.model.change('提示', '请先上传图片', '');
          this.model.open();
        }
      };
    });
  }
  renderPreview() {
    if (this.fileInput.files && this.fileInput.files[0]) {
      const file = this.fileInput.files[0];
      const src = URL.createObjectURL(file);

      this.previewImage.src = src;
      this.previewImage.onload = () => {
        const generatePath = new GeneratePath(
          this.previewImage.width,
          this.previewImage.height,
          parseInt(this.rowsInput.value),
          parseInt(this.columnsInput.value)
        );
        const svg = generatePath.getPath(this.borderColor.value);
        this.previewSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        this.previewSvg.setAttribute('version', '1.0');
        this.previewSvg.setAttribute(
          'viewBox',
          `0 0 ${this.previewImage.width} ${this.previewImage.height}`
        );
        this.previewSvg.innerHTML = svg;
      };
    }
  }
  start() {
    const form = document.getElementById('ui')?.getElementsByTagName('form');
    if (form) form[0].style.display = 'none';
    const preview = document.getElementById('ui')?.getElementsByClassName('preview') as
      | NodeListOf<HTMLDivElement>
      | undefined;
    if (preview) preview[0].style.display = 'none';
    (document.getElementById('ui')?.getElementsByClassName('game-control')[0] as HTMLDivElement).style.display = 'block';
    this.beginTime = performance.now();
  }
  restart() {
    const form = document.getElementById('ui')?.getElementsByTagName('form');
    if (form) form[0].style.display = 'block';
    const preview = document.getElementById('ui')?.getElementsByClassName('preview') as
      | NodeListOf<HTMLDivElement>
      | undefined;
    if (preview) preview[0].style.display = 'block';
    (document.getElementById('ui')?.getElementsByClassName('game-control')[0] as HTMLDivElement).style.display = 'none';
    this.fps = 0;
    this.timer = 0;
    this.beginTime = 0;
    return this.init();
  }
  addControlEventListener<K extends keyof HTMLElementEventMap>(
    name: ControlName,
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: HTMLButtonElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ) {
    switch (name) {
      case 'center':
        (document.getElementById('control-aim') as HTMLButtonElement).addEventListener(
          type,
          listener,
          options
        );
        break;
      case 'restart':
        (document.getElementById('control-refresh') as HTMLButtonElement).addEventListener(
          type,
          listener,
          options
        );
        break;
    }
  }
  nextFrame() {
    const now = performance.now();
    this.timer = now - this.beginTime;
    this.fps++;
    if(now - this.lastTime >= 1000){
      this.fpsSpan.innerHTML = `fps:<strong>${this.fps}</strong>`;
      this.timerSpan.innerHTML = `用时:<strong>${this.formatTime(this.timer)}</strong>`;
      this.fps = 0;
      this.lastTime = now;
    }

    // Request the next animation frame
    requestAnimationFrame(this.nextFrame.bind(this));
  }
  formatTime(time: number) {
    const second = Math.floor(time / 1000);
    const minute = Math.floor(second / 60);
    const hour = Math.floor(minute / 60);
    return `${hour? `${hour}:` : ''}${minute? `${minute}:` : ''}${second % 60}`;
  }
  finish() {
    this.model.change('恭喜', '游戏结束');
    this.model.open();
  }
}
export type ControlName = 'center' | 'restart';
