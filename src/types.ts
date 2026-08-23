import type { DisplaySettings } from './displaySettings';

export type GameConfig = {
  src: string;
  rows: number;
  columns: number;
} & DisplaySettings;
