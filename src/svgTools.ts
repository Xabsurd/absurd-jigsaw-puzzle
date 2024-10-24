export class GeneratePath {
  // a, b, c, d, e, t, j, flip, xi, yi, xn, yn, vertical, offset, width, height, radius
  #a = 0;
  #b = 0;
  #c = 0;
  #d = 0;
  #e = 0;
  #t = 0.1;
  #j = 0.01;
  #flip = false;
  #xi = 0;
  #yi = 0;
  #vertical = 0;

  constructor(
    public width = 300,
    public height = 300,
    public rows = 10,
    public columns = 10,
    public seed = 1
  ) {}
  static getPathInfo(path: string) {
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttributeNS(null, 'd', path);
    const length = pathEl.getTotalLength();
    const points = [];
    for (let i = 0; i < length; i += 10) {
      const point = pathEl.getPointAtLength(i);
      points.push(point);
    }
    return points;
  }
  getLines() {
    const dh = this.gen_dh();
    const dv = this.gen_dv();
    return { dh, dv, width: this.width, height: this.height };
  }
  getSVG(): string {
    let data = '<svg xmlns="http://www.w3.org/2000/svg" version="1.0" ';
    data +=
      'width="' +
      this.width +
      'px" height="' +
      this.height +
      'px" viewBox="0 0 ' +
      this.width +
      ' ' +
      this.height +
      '">';
    data += '<path fill="none" stroke="DarkBlue" stroke-width="1" d="';
    data += this.gen_dh().str;
    data += '"></path>';
    data += '<path fill="none" stroke="DarkRed" stroke-width="1" d="';
    data += this.gen_dv().str;
    data += '"></path>';
    data += '</svg>';
    return data;
  }
  getPath(color: string='#8bc5ff') {
    let data='';
    data += '<path fill="none" stroke="' + color + '" stroke-width="1" d="';
    data += this.gen_dh().str;
    data += '"></path>';
    data += '<path fill="none" stroke="' + color + '" stroke-width="1" d="';
    data += this.gen_dv().str;
    data += '"></path>';
    return data;
  }
  setTabSize(tabSize: number) {
    if (tabSize < 10 || tabSize > 30) {
      throw new Error('tabSize must be between 10 and 30');
    } else {
      this.#t = tabSize / 200;
    }
  }
  setJitter(jitter: number) {
    if (jitter < 0 || jitter > 13) {
      throw new Error('jitter must be between 0 and 13');
    } else {
      this.#j = jitter / 100;
    }
  }

  rbool() {
    return this.random() > 0.5;
  }
  uniform(min: number, max: number) {
    const r = this.random();
    return min + r * (max - min);
  }
  random() {
    const x = Math.sin(this.seed) * 10000;
    this.seed += 1;
    return x - Math.floor(x);
  }
  first() {
    this.#e = this.uniform(-this.#j, this.#j);
    this.next();
  }
  next() {
    const flipold = this.#flip;
    this.#flip = this.rbool();
    this.#a = this.#flip == flipold ? -this.#e : this.#e;
    this.#b = this.uniform(-this.#j, this.#j);
    this.#c = this.uniform(-this.#j, this.#j);
    this.#d = this.uniform(-this.#j, this.#j);
    this.#e = this.uniform(-this.#j, this.#j);
  }
  sl() {
    return this.#vertical ? this.height / this.rows : this.width / this.columns;
  }
  sw() {
    return this.#vertical ? this.width / this.columns : this.height / this.rows;
  }
  ol() {
    return this.sl() * (this.#vertical ? this.#yi : this.#xi);
  }
  ow() {
    return this.sw() * (this.#vertical ? this.#xi : this.#yi);
  }
  l(v: number) {
    const ret = this.ol() + this.sl() * v;
    return Math.round(ret * 100) / 100;
  }
  w(v: number) {
    const ret = this.ow() + this.sw() * v * (this.#flip ? -1.0 : 1.0);
    return Math.round(ret * 100) / 100;
  }
  p0l() {
    return this.l(0.0);
  }
  p0w() {
    return this.w(0.0);
  }
  p1l() {
    return this.l(0.2);
  }
  p1w() {
    return this.w(this.#a);
  }
  p2l() {
    return this.l(0.5 + this.#b + this.#d);
  }
  p2w() {
    return this.w(-this.#t + this.#c);
  }
  p3l() {
    return this.l(0.5 - this.#t + this.#b);
  }
  p3w() {
    return this.w(this.#t + this.#c);
  }
  p4l() {
    return this.l(0.5 - 2.0 * this.#t + this.#b - this.#d);
  }
  p4w() {
    return this.w(3.0 * this.#t + this.#c);
  }
  p5l() {
    return this.l(0.5 + 2.0 * this.#t + this.#b - this.#d);
  }
  p5w() {
    return this.w(3.0 * this.#t + this.#c);
  }
  p6l() {
    return this.l(0.5 + this.#t + this.#b);
  }
  p6w() {
    return this.w(this.#t + this.#c);
  }
  p7l() {
    return this.l(0.5 + this.#b + this.#d);
  }
  p7w() {
    return this.w(-this.#t + this.#c);
  }
  p8l() {
    return this.l(0.8);
  }
  p8w() {
    return this.w(this.#e);
  }
  p9l() {
    return this.l(1.0);
  }
  p9w() {
    return this.w(0.0);
  }
  gen_dh() {
    let str = '';
    this.#vertical = 0;
    const lines: { start: string; paths: string[] }[] = [];
    for (this.#yi = 1; this.#yi < this.rows; ++this.#yi) {
      this.#xi = 0;
      this.first();
      const start = 'M ' + this.p0l() + ' ' + this.p0w() + ' ';
      str += start;
      lines.push({ start: start, paths: [] });

      for (; this.#xi < this.columns; ++this.#xi) {
        const c1 =
          'C ' +
          this.p1l() +
          ' ' +
          this.p1w() +
          ' ' +
          this.p2l() +
          ' ' +
          this.p2w() +
          ' ' +
          this.p3l() +
          ' ' +
          this.p3w() +
          ' ';
        const c2 =
          'C ' +
          this.p4l() +
          ' ' +
          this.p4w() +
          ' ' +
          this.p5l() +
          ' ' +
          this.p5w() +
          ' ' +
          this.p6l() +
          ' ' +
          this.p6w() +
          ' ';
        const c3 =
          'C ' +
          this.p7l() +
          ' ' +
          this.p7w() +
          ' ' +
          this.p8l() +
          ' ' +
          this.p8w() +
          ' ' +
          this.p9l() +
          ' ' +
          this.p9w() +
          ' ';

        str += c1 + c2 + c3;
        lines[this.#yi - 1].paths.push(c1 + c2 + c3);
        this.next();
      }
    }
    return { str, lines };
  }
  gen_dv() {
    let str = '';
    this.#vertical = 1;
    const lines: { start: string; paths: string[] }[] = [];
    for (this.#xi = 1; this.#xi < this.columns; ++this.#xi) {
      this.#yi = 0;
      this.first();
      const start = 'M ' + this.p0w() + ' ' + this.p0l() + ' ';
      str += start;
      lines.push({ start: start, paths: [] });
      for (; this.#yi < this.rows; ++this.#yi) {
        const c1 =
          'C ' +
          this.p1w() +
          ' ' +
          this.p1l() +
          ' ' +
          this.p2w() +
          ' ' +
          this.p2l() +
          ' ' +
          this.p3w() +
          ' ' +
          this.p3l() +
          ' ';
        const c2 =
          'C ' +
          this.p4w() +
          ' ' +
          this.p4l() +
          ' ' +
          this.p5w() +
          ' ' +
          this.p5l() +
          ' ' +
          this.p6w() +
          ' ' +
          this.p6l() +
          ' ';
        const c3 =
          'C ' +
          this.p7w() +
          ' ' +
          this.p7l() +
          ' ' +
          this.p8w() +
          ' ' +
          this.p8l() +
          ' ' +
          this.p9w() +
          ' ' +
          this.p9l() +
          ' ';

        str += c1 + c2 + c3;
        lines[this.#xi - 1].paths.push(c1 + c2 + c3);
        this.next();
      }
    }
    return { str, lines };
  }
}
export class TileTool {
  constructor(
    public data: {
      dh: {
        str: string;
        lines: {
          start: string;
          paths: string[];
        }[];
      };
      dv: {
        str: string;
        lines: {
          start: string;
          paths: string[];
        }[];
      };
      width: number;
      height: number;
    }
  ) {}
  getTilePath(x: number, y: number) {
    if (
      x < 0 ||
      y < 0 ||
      x >= this.data.dv.lines.length + 1 ||
      y >= this.data.dh.lines.length + 1
    ) {
      throw new Error('out of range');
    }
    let line1;
    let line2;
    let line3;
    let line4;
    if (x > 0) {
      line1 = this.formatDV(x - 1, y);
    } else {
      line1 = {
        start: y > 0 ? this.data.dh.lines[y - 1].start : 'M 0 0',
        path:
          y < this.data.dh.lines.length
            ? this.data.dh.lines[y].start.replace('M ', 'L ')
            : `L 0 ${this.data.height}`
      };
    }
    if (x < this.data.dv.lines.length) {
      line3 = this.reverseDV(x, y);
    } else {
      const prev_dh_path = this.data.dh.lines[y - 1]?.paths[x].trim().split(' ') || [
        this.data.width,
        '0'
      ];
      const dh_path = this.data.dh.lines[x]?.paths[y].trim().split(' ') || [this.data.width, '0'];
      line3 = {
        start:
          x < this.data.dh.lines.length
            ? 'M ' + dh_path[dh_path.length - 2] + ' ' + dh_path[dh_path.length - 1]
            : `M ${this.data.width} ${this.data.height}`,
        path:
          x > 0
            ? 'L' +
              prev_dh_path[prev_dh_path.length - 2] +
              ' ' +
              prev_dh_path[prev_dh_path.length - 1]
            : `L ${this.data.width} 0`
      };
    }
    if (y > 0) {
      line4 = this.reverseDH(x, y - 1);
    } else {
      line2 = {
        start: y > 0 ? this.data.dv.lines[y - 1].start : 'M 0 0',
        path:
          y < this.data.dv.lines.length
            ? this.data.dv.lines[y].start.replace('M ', 'L ')
            : `L ${this.data.width} 0`
      };
      line4 = {
        start: y > 0 ? this.data.dv.lines[y - 1].start : 'M 0 0',
        path:
          y < this.data.dv.lines.length
            ? x > 0
              ? this.data.dv.lines[x - 1].start.replace('M ', 'L ')
              : 'L 0 0'
            : `L ${this.data.width} 0`
      };
    }
    if (y < this.data.dh.lines.length) {
      line2 = this.formatDH(x, y);
    } else {
      line2 = {
        start: y > 0 ? this.data.dv.lines[y - 1].start : `M 0 ${this.data.height}`,
        path: line3.start.replace('M ', 'L ')
      };
    }
    return `${line1.start} ${line1.path} ${line2.path} ${line3.path} ${line4.path} Z`;
    // const rectPath =
    //     "M " +
    //     line1.start.join() +
    //     " " +
    //     line1.path +
    //     " " +
    //     line2.path +
    //     " " +
    //     line3.path +
    //     " " +
    //     line4.path +
    //     "Z";
    //   return rectPath;
  }
  formatDV(x: number, y: number) {
    const dv = this.data.dv.lines[x].paths[y];
    if (y > 0) {
      const prev_dv = this.data.dv.lines[x].paths[y - 1];
      const prev_dv_str = prev_dv.trim().split(' ');
      return {
        start:
          'M ' + prev_dv_str[prev_dv_str.length - 2] + ' ' + prev_dv_str[prev_dv_str.length - 1],
        path: dv
      };
    } else {
      return {
        start: this.data.dv.lines[x].start,
        path: dv
      };
    }
  }
  formatDH(x: number, y: number) {
    const dh = this.data.dh.lines[y].paths[x];
    if (x > 0) {
      const prev_dh = this.data.dh.lines[y].paths[x - 1];
      const prev_dh_str = prev_dh.trim().split(' ');
      return {
        start:
          'M ' + prev_dh_str[prev_dh_str.length - 2] + ' ' + prev_dh_str[prev_dh_str.length - 1],
        path: dh
      };
    } else {
      return {
        start: this.data.dh.lines[x].start,
        path: dh
      };
    }
  }
  // reverseDV(1, 1);
  reverseDV(x: number, y: number) {
    const dv = this.data.dv.lines[x].paths[y];
    const prev_dv = y > 0 ? this.data.dv.lines[x].paths[y - 1] : this.data.dv.lines[x].start;
    const prev_dv_str = prev_dv.trim().split(' ');
    const dv_str = dv.replaceAll('C ', '').trim().split(' ');
    const reserve_dv_str = [];
    for (let i = dv_str.length - 2; i >= 0; i -= 2) {
      reserve_dv_str.push(dv_str[i], dv_str[i + 1]);
    }
    const start = [reserve_dv_str[0], reserve_dv_str[1]];
    const c1 = ' C ' + reserve_dv_str.slice(2, 8).join(' ');
    const c2 = ' C ' + reserve_dv_str.slice(8, 14).join(' ');
    const c3 =
      ' C ' +
      reserve_dv_str.slice(14, 20).join(' ') +
      ' ' +
      prev_dv_str[prev_dv_str.length - 2] +
      ' ' +
      prev_dv_str[prev_dv_str.length - 1];
    return {
      start: 'M ' + start.join(' '),
      path: c1 + c2 + c3
    };
  }

  reverseDH(x: number, y: number) {
    const dh = this.data.dh.lines[y].paths[x];
    const prev_dh = x > 0 ? this.data.dh.lines[y].paths[x - 1] : this.data.dh.lines[y].start;
    const prev_dh_str = prev_dh.trim().split(' ');
    const dh_str = dh.replaceAll('C ', '').trim().split(' ');
    const reserve_dh_str = [];
    for (let i = dh_str.length - 2; i >= 0; i -= 2) {
      reserve_dh_str.push(dh_str[i], dh_str[i + 1]);
    }
    const start = [reserve_dh_str[0], dh_str[1]];
    const c1 = ' C ' + reserve_dh_str.slice(2, 8).join(' ');
    const c2 = ' C ' + reserve_dh_str.slice(8, 14).join(' ');
    const c3 =
      ' C ' +
      reserve_dh_str.slice(14, 20).join(' ') +
      ' ' +
      prev_dh_str[prev_dh_str.length - 2] +
      ' ' +
      prev_dh_str[prev_dh_str.length - 1];
    return {
      start: 'M ' + start,
      path: c1 + c2 + c3
    };
  }
}
