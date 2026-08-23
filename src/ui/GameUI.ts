import Modal from './Modal';
import { GeneratePath } from '../svgTools';
import { GameConfig } from '../types';
import { debounce } from '../assets';

function must<T extends HTMLElement>(id: string) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

export default class GameUI {
  private readonly modal = new Modal();
  private readonly appDiv = must<HTMLDivElement>('app');
  private readonly ui = must<HTMLElement>('ui');
  private readonly form = this.ui.querySelector('form') as HTMLFormElement;
  private readonly preview = this.ui.querySelector('.preview') as HTMLDivElement;
  private readonly columnsSpan = must<HTMLSpanElement>('columns-label');
  private readonly rowsSpan = must<HTMLSpanElement>('rows-label');
  private readonly columnsInput = must<HTMLInputElement>('columns');
  private readonly rowsInput = must<HTMLInputElement>('rows');
  private readonly pieceCount = must<HTMLSpanElement>('piece-count');
  private readonly uploadButton = must<HTMLButtonElement>('upload');
  private readonly startButton = must<HTMLButtonElement>('start');
  private readonly fileInput = must<HTMLInputElement>('file-upload');
  private readonly previewImage = must<HTMLImageElement>('preview-image');
  private readonly previewSvg = must<HTMLElement>('preview-svg');
  private readonly borderColor = must<HTMLInputElement>('border-color');
  private readonly backgroundColor = must<HTMLInputElement>('background-color');
  private readonly tipButton = must<HTMLButtonElement>('control-tip');
  private readonly centerButton = must<HTMLButtonElement>('control-aim');
  private readonly restartButton = must<HTMLButtonElement>('control-refresh');
  private readonly fpsSpan = must<HTMLSpanElement>('fps');
  private readonly timerSpan = must<HTMLSpanElement>('timer');
  private readonly progressSpan = must<HTMLSpanElement>('progress-stat');
  private readonly loading = must<HTMLElement>('loading');
  private readonly loadingProgress = must<HTMLProgressElement>('loading-progress');
  private readonly loadingText = must<HTMLElement>('loading-text');
  private previewUrl: string | null = null;
  private beginTime = 0;
  private timerId = 0;
  private elapsed = 0;
  onStart: (config: GameConfig) => void = () => {};
  onCenter: () => void = () => {};
  onRestart: () => void = () => {};

  constructor() {
    this.setup();
  }

  private setup() {
    this.syncLabels();
    this.startButton.disabled = true;

    const previewSoon = debounce(() => this.renderPreview(), 140);
    this.columnsInput.addEventListener('input', () => {
      this.syncLabels();
      previewSoon();
    });
    this.rowsInput.addEventListener('input', () => {
      this.syncLabels();
      previewSoon();
    });
    this.borderColor.addEventListener('input', previewSoon);
    this.backgroundColor.addEventListener('input', () => {
      this.appDiv.style.backgroundColor = this.backgroundColor.value;
    });

    this.uploadButton.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', () => this.onFileChosen());
    this.startButton.addEventListener('click', () => this.submit());
    this.tipButton.addEventListener('click', () => this.showHelp());
    this.centerButton.addEventListener('click', () => this.onCenter());
    this.restartButton.addEventListener('click', () => this.onRestart());

    window.addEventListener('dragover', (event) => {
      if (this.ui.classList.contains('game-start')) return;
      event.preventDefault();
    });
    window.addEventListener('drop', (event) => {
      if (this.ui.classList.contains('game-start')) return;
      event.preventDefault();
      const file = event.dataTransfer?.files[0];
      if (file && file.type.startsWith('image/')) {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        this.fileInput.files = transfer.files;
        this.onFileChosen();
      }
    });
  }

  private onFileChosen() {
    const file = this.fileInput.files?.[0];
    this.startButton.disabled = !file;
    this.uploadButton.textContent = file ? file.name : '选择图片';
    this.preview.hidden = !file;
    this.preview.style.display = file ? 'block' : 'none';
    this.renderPreview();
  }

  private async submit() {
    const file = this.fileInput.files?.[0];
    if (!file) {
      this.modal.alert('提示', '请先上传图片');
      return;
    }
    const rows = Math.max(2, parseInt(this.rowsInput.value, 10) || 2);
    const columns = Math.max(2, parseInt(this.columnsInput.value, 10) || 2);
    if (rows * columns > 1600) {
      const ok = await this.modal.confirm(
        '块数较多',
        `当前为 ${columns}×${rows}，共 ${rows * columns} 块，生成会比较慢。确定继续吗？`
      );
      if (!ok) return;
    }
    this.startButton.disabled = true;
    const src = URL.createObjectURL(file);
    this.enterGame();
    this.onStart({
      src,
      rows,
      columns,
      borderColor: this.borderColor.value
    });
  }

  private syncLabels() {
    this.columnsSpan.textContent = this.columnsInput.value;
    this.rowsSpan.textContent = this.rowsInput.value;
    const total =
      Math.max(2, parseInt(this.columnsInput.value, 10) || 2) *
      Math.max(2, parseInt(this.rowsInput.value, 10) || 2);
    this.pieceCount.textContent = `共 ${total} 块`;
  }

  private renderPreview() {
    const file = this.fileInput.files?.[0];
    if (!file) return;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = URL.createObjectURL(file);
    this.previewImage.src = this.previewUrl;
    this.previewImage.onload = () => {
      const rows = Math.max(2, parseInt(this.rowsInput.value, 10) || 2);
      const columns = Math.max(2, parseInt(this.columnsInput.value, 10) || 2);
      const width = this.previewImage.naturalWidth;
      const height = this.previewImage.naturalHeight;
      this.previewSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      if (rows * columns > 900) {
        this.previewSvg.innerHTML = gridPreview(width, height, rows, columns, this.borderColor.value);
        return;
      }
      const generatePath = new GeneratePath(width, height, rows, columns);
      this.previewSvg.innerHTML = generatePath.getPath(this.borderColor.value);
    };
  }

  enterGame() {
    this.form.style.display = 'none';
    this.preview.style.display = 'none';
    this.ui.classList.add('game-start');
  }

  showMenu() {
    this.hideLoading();
    this.stopTimer();
    this.form.style.display = 'block';
    const hasFile = Boolean(this.fileInput.files?.[0]);
    this.preview.hidden = !hasFile;
    this.preview.style.display = hasFile ? 'block' : 'none';
    this.startButton.disabled = !hasFile;
    this.ui.classList.remove('game-start');
    this.setFps(0);
    this.setProgress(0, 0, 0);
    this.timerSpan.innerHTML = '用时: <strong>0:00</strong>';
  }

  showLoading(text = '正在生成拼图...') {
    this.loading.hidden = false;
    this.loadingText.textContent = text;
    this.loadingProgress.value = 0;
  }

  setLoading(done: number, total: number) {
    this.loading.hidden = false;
    this.loadingProgress.max = total;
    this.loadingProgress.value = done;
    this.loadingText.textContent = `正在生成拼图 ${done} / ${total}`;
  }

  hideLoading() {
    this.loading.hidden = true;
  }

  startTimer() {
    this.stopTimer();
    this.beginTime = performance.now();
    this.elapsed = 0;
    this.timerId = window.setInterval(() => {
      this.elapsed = performance.now() - this.beginTime;
      this.timerSpan.innerHTML = `用时: <strong>${formatTime(this.elapsed)}</strong>`;
    }, 250);
  }

  stopTimer() {
    window.clearInterval(this.timerId);
    this.timerId = 0;
  }

  setFps(fps: number) {
    this.fpsSpan.innerHTML = `FPS: <strong>${fps}</strong>`;
  }

  setProgress(merged: number, total: number, groups: number) {
    const need = Math.max(0, total - 1);
    this.progressSpan.innerHTML = `进度: <strong>${merged}/${need}</strong> · 组 ${groups}`;
  }

  showHelp() {
    this.modal.alert(
      '操作说明',
      `
        <ul>
          <li><strong>滚轮 / 双指捏合：</strong>缩放画布</li>
          <li><strong>拖动拼图：</strong>移动选中的拼图组</li>
          <li><strong>拖动空白：</strong>平移整个画布</li>
          <li><strong>靠近正确邻居：</strong>松开后自动吸附，并连锁拼接</li>
          <li><strong>C / Home：</strong>居中并适配全部碎片</li>
          <li><strong>+ / -：</strong>缩放</li>
          <li><strong>方向键：</strong>平移画布</li>
        </ul>
        <p class="space">重新开始会销毁当前画布并释放显存。如果仍有占用，刷新页面即可彻底清理。</p>
      `
    );
  }

  async confirmRestart() {
    return this.modal.confirm('重新开始', '当前进度将丢失，确定重新开始吗？');
  }

  finish() {
    this.stopTimer();
    this.modal.alert('恭喜', `拼图完成<br>用时 ${formatTime(this.elapsed)}`);
  }

  alert(title: string, body: string) {
    this.modal.alert(title, body);
  }
}

function formatTime(time: number) {
  const total = Math.max(0, Math.floor(time / 1000));
  const second = total % 60;
  const minute = Math.floor(total / 60) % 60;
  const hour = Math.floor(total / 3600);
  const pad = (value: number) => value.toString().padStart(2, '0');
  return hour ? `${hour}:${pad(minute)}:${pad(second)}` : `${minute}:${pad(second)}`;
}

function gridPreview(width: number, height: number, rows: number, columns: number, color: string) {
  let d = '';
  for (let x = 1; x < columns; x++) {
    const px = (width * x) / columns;
    d += `M ${px} 0 L ${px} ${height} `;
  }
  for (let y = 1; y < rows; y++) {
    const py = (height * y) / rows;
    d += `M 0 ${py} L ${width} ${py} `;
  }
  return `<path fill="none" stroke="${color}" stroke-width="1" d="${d}"></path>`;
}
