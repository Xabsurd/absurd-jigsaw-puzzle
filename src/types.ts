export type OptimizationType = 'none' | 'antialias' | 'reRender';

export type GameConfig = {
  src: string;
  rows: number;
  columns: number;
  optimization: OptimizationType;
  borderColor: string;
};

export type ControlName = 'center' | 'restart';
