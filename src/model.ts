export class Model {
  dom = document.createElement('dialog');
  visible = false;
  constructor() {
    this.dom.innerHTML = `<article>
        <header>
            <button class="close" aria-label="Close" rel="prev"></button>
            <p>
            <strong></strong>
            </p>
        </header>
        <p class="body"></p>
        <footer style="display: none"></footer>
    </article>`;
    document.body.appendChild(this.dom);
    this.dom.getElementsByClassName('close')[0].addEventListener('click', () => {
      this.close();
    });
    // Close with a click outside
    document.addEventListener('click', this.autoClose.bind(this));
    
  }
  change(header: string, body: string, footer?: string) {
    this.dom.querySelector('header strong')!.innerHTML = header;
    this.dom.querySelector('.body')!.innerHTML = body;
    if (footer && footer !== '') {
      this.dom.querySelector('footer')!.style.display = 'block';
      this.dom.querySelector('footer')!.innerHTML = footer;
    }
  }
  changeHeader(header: string) {
    this.dom.querySelector('header strong')!.innerHTML = header;
  }
  changeBody(body: string) {
    this.dom.querySelector('.body')!.innerHTML = body;
  }
  changeFooter(footer: string) {
    this.dom.querySelector('footer')!.style.display = 'block';
    this.dom.querySelector('footer')!.innerHTML = footer;
  }
  open() {
    this.dom.classList.add('modal-is-opening');
    this.dom.classList.remove('modal-is-closing');
    this.dom.open = true;
    setTimeout(() => {
      this.visible = true;
    }, 300);
  }
  close() {
    this.dom.classList.add('modal-is-closing');
    this.dom.classList.remove('modal-is-opening');
    setTimeout(() => {
      this.dom.open = false;
      this.visible = false;
    }, 300);
  }
  autoClose(event: MouseEvent) {
    if (!this.visible) return;
    const modalContent = this.dom.querySelector('article');
    if (modalContent) {
      const isClickInside = modalContent.contains(event.target as Node);
      if (!isClickInside) {
        this.close();
      }
    }
  }
  destroy() {
    document.body.removeChild(this.dom);
    // 删除对象的引用
    for (const prop in this) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        delete this[prop];
      }
    }
  }
}
