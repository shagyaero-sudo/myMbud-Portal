export type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan' | 'yellow' | 'pink';

export interface BlockShape {
  id: string;
  matrix: number[][]; // 2D array where 1 represents filled block, 0 empty
  color: ColorScheme;
  width: number;
  height: number;
}

export type GridCell = ColorScheme | null;

export type Grid = GridCell[][]; // 8x8 array

export interface Position {
  row: number;
  col: number;
}

export interface FloatingText {
  id: string;
  text: string;
  subtext?: string;
  x: number; // percentage or px
  y: number;
  color?: string;
}

export interface GameStats {
  score: number;
  highScore: number;
  linesClearedTotal: number;
  combosCount: number;
  highestStreak: number;
}

export interface DragState {
  shape: BlockShape;
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  grabC: number;
  grabR: number;
  hoverPos: Position | null;
  isValid: boolean;
}
