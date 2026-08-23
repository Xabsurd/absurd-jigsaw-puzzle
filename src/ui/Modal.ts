export default class Modal {
  private readonly dialog = document.createElement('dialog');
  private resolveConfirm: ((value: boolean) => void) | null = null;
  private closeTimer = 0;

  constructor() {
    this.dialog.innerHTML = `<article>
        <header>
            <button class="close" aria-label="Close" rel="prev"></button>
            <p><strong></strong></p>
        </header>
        <div class="body"></div>
        <footer>
            <button type="button" class="secondary" data-action="cancel">取消</button>
            <button type="button" data-action="ok">确定</button>
        </footer>
    </article>`;
    document.body.appendChild(this.dialog);

    this.dialog.querySelector('.close')!.addEventListener('click', () => this.finish(false));
    this.dialog.querySelector('[data-action="ok"]')!.addEventListener('click', () => this.finish(true));
    this.dialog
      .querySelector('[data-action="cancel"]')!
      .addEventListener('click', () => this.finish(false));
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.finish(false);
    });
    this.dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.finish(false);
    });
  }

  alert(header: string, body: string) {
    this.setContent(header, body, false);
    this.open();
  }

  confirm(header: string, body: string) {
    this.setContent(header, body, true);
    this.open();
    return new Promise<boolean>((resolve) => {
      this.resolveConfirm = resolve;
    });
  }

  change(header: string, body: string, footer?: string) {
    this.setContent(header, body, Boolean(footer && footer !== ''));
    if (footer) {
      const footerEl = this.dialog.querySelector('footer')!;
      footerEl.style.display = 'flex';
      footerEl.innerHTML = footer;
    }
  }

  open() {
    window.clearTimeout(this.closeTimer);
    this.dialog.classList.add('modal-is-opening');
    this.dialog.classList.remove('modal-is-closing');
    if (!this.dialog.open) this.dialog.showModal();
  }

  close() {
    this.finish(false);
  }

  private setContent(header: string, body: string, withActions: boolean) {
    this.dialog.querySelector('header strong')!.textContent = header;
    this.dialog.querySelector('.body')!.innerHTML = body;
    const footer = this.dialog.querySelector('footer') as HTMLElement;
    footer.style.display = withActions ? 'flex' : 'none';
  }

  private finish(result: boolean) {
    if (!this.dialog.open) {
      this.resolveConfirm?.(result);
      this.resolveConfirm = null;
      return;
    }
    this.dialog.classList.add('modal-is-closing');
    this.dialog.classList.remove('modal-is-opening');
    const resolve = this.resolveConfirm;
    this.resolveConfirm = null;
    this.closeTimer = window.setTimeout(() => {
      this.dialog.close();
      resolve?.(result);
    }, 180);
  }

  destroy() {
    window.clearTimeout(this.closeTimer);
    this.dialog.remove();
  }
}
