import { OptimizationType } from './pieceTools';
import { GeneratePath } from './svgTools';

export default class Interfaces {
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
    this.init();
  }
  init() {
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
          alert('请选择文件');
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
    if (preview) preview[0].style.display = 'block';
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
}
export type ControlName = 'center' | 'restart';
