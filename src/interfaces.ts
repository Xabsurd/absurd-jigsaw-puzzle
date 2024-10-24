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
  constructor() {
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
    this.init();
  }
  init() {
    this.columnsInput.addEventListener('input', () => {
      this.columnsSpan.innerHTML = this.columnsInput.value;
      if (this.fileInput.files && this.fileInput.files[0]) {
        const file = this.fileInput.files[0];
        const src = URL.createObjectURL(file);
        this.renderPreview(src);
      }
    });

    this.rowsInput.addEventListener('input', () => {
      this.rowsSpan.innerHTML = this.rowsInput.value;
      if (this.fileInput.files && this.fileInput.files[0]) {
        const file = this.fileInput.files[0];
        const src = URL.createObjectURL(file);
        this.renderPreview(src);
      }
    });
    this.uploadButton.onclick = () => {
      this.fileInput.click();
    };
    this.fileInput.onchange = () => {
      if (this.fileInput.files && this.fileInput.files[0]) {
        const file = this.fileInput.files[0];
        const src = URL.createObjectURL(file);
        this.renderPreview(src);
      }
    };
    return new Promise<{
      src: string;
      rows: number;
      columns: number;
      optimization: OptimizationType
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
              resolve({ src, rows: parseInt(this.rowsInput.value), columns: parseInt(this.columnsInput.value), optimization: element.id as OptimizationType });
              return;
            }
          }
        } else {
          alert('请选择文件');
        }
      };
    });
  }
  renderPreview(src: string) {
    this.previewImage.src = src;
    this.previewImage.onload = () => {
      const generatePath = new GeneratePath(
        this.previewImage.width,
        this.previewImage.height,
        parseInt(this.rowsInput.value),
        parseInt(this.columnsInput.value)
      );
      const svg = generatePath.getPath();
      this.previewSvg.style.width = `${this.previewImage.width}px`;
      this.previewSvg.style.height = `${this.previewImage.height}px`;
      this.previewSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      this.previewSvg.setAttribute('version', '1.0');
      this.previewSvg.setAttribute(
        'viewBox',
        `0 0 ${this.previewImage.width} ${this.previewImage.height}`
      );
      this.previewSvg.innerHTML = svg;
    };
  }
  start() {
    (document.getElementById('ui') as HTMLDivElement).style.display = 'none';
  }
}
