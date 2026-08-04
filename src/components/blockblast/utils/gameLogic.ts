import { BlockShape, Grid, GridCell } from '../types';
import { GRID_SIZE } from '../constants/shapes';

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null)
  );
}

export function canPlaceShape(grid: Grid, shape: BlockShape, startRow: number, startCol: number): boolean {
  for (let r = 0; r < shape.height; r++) {
    for (let c = 0; c < shape.width; c++) {
      if (shape.matrix[r][c] === 1) {
        const gridRow = startRow + r;
        const gridCol = startCol + c;

        // Check grid boundary
        if (gridRow < 0 || gridRow >= GRID_SIZE || gridCol < 0 || gridCol >= GRID_SIZE) {
          return false;
        }

        // Check if cell is occupied
        if (grid[gridRow][gridCol] !== null) {
          return false;
        }
      }
    }
  }
  return true;
}

export function placeShapeOnGrid(grid: Grid, shape: BlockShape, startRow: number, startCol: number): Grid {
  const newGrid = grid.map(row => [...row]);

  for (let r = 0; r < shape.height; r++) {
    for (let c = 0; c < shape.width; c++) {
      if (shape.matrix[r][c] === 1) {
        const gridRow = startRow + r;
        const gridCol = startCol + c;
        newGrid[gridRow][gridCol] = shape.color;
      }
    }
  }

  return newGrid;
}

export interface LineClearResult {
  newGrid: Grid;
  clearedRows: number[];
  clearedCols: number[];
  linesClearedCount: number;
}

export function checkAndClearLines(grid: Grid): LineClearResult {
  const clearedRows: number[] = [];
  const clearedCols: number[] = [];

  // Check horizontal rows
  for (let r = 0; r < GRID_SIZE; r++) {
    let isFull = true;
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      clearedRows.push(r);
    }
  }

  // Check vertical columns
  for (let c = 0; c < GRID_SIZE; c++) {
    let isFull = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][c] === null) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      clearedCols.push(c);
    }
  }

  const linesClearedCount = clearedRows.length + clearedCols.length;

  if (linesClearedCount === 0) {
    return {
      newGrid: grid,
      clearedRows: [],
      clearedCols: [],
      linesClearedCount: 0,
    };
  }

  // Create new grid with cleared rows & columns set to null
  const newGrid = grid.map((rowArr, r) =>
    rowArr.map((cell, c) => {
      if (clearedRows.includes(r) || clearedCols.includes(c)) {
        return null;
      }
      return cell;
    })
  );

  return {
    newGrid,
    clearedRows,
    clearedCols,
    linesClearedCount,
  };
}

export function checkCanAnyShapeFit(grid: Grid, hand: (BlockShape | null)[]): boolean {
  const activeShapes = hand.filter((s): s is BlockShape => s !== null);
  if (activeShapes.length === 0) return true; // Hand is empty, next deal will come

  for (const shape of activeShapes) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (canPlaceShape(grid, shape, r, c)) {
          return true;
        }
      }
    }
  }

  return false;
}

export function rotateShape(shape: BlockShape): BlockShape {
  const oldH = shape.height;
  const oldW = shape.width;
  const newMatrix: number[][] = Array.from({ length: oldW }, () => Array(oldH).fill(0));

  for (let r = 0; r < oldH; r++) {
    for (let c = 0; c < oldW; c++) {
      newMatrix[c][oldH - 1 - r] = shape.matrix[r][c];
    }
  }

  return {
    ...shape,
    matrix: newMatrix,
    width: oldH,
    height: oldW,
  };
}

export function calculateScore(placedShapeTileCount: number, linesCleared: number, streak: number): {
  points: number;
  comboLabel?: string;
} {
  let points = placedShapeTileCount;
  let comboLabel: string | undefined = undefined;

  if (linesCleared > 0) {
    // Multi-line bonus formula
    const lineBonus = linesCleared * 100 + (linesCleared - 1) * 150;
    const streakMultiplier = Math.max(1, streak);
    const linePoints = lineBonus * streakMultiplier;

    points += linePoints;

    if (linesCleared === 1) {
      comboLabel = streak > 1 ? `BERUNTUN x${streak}!` : 'BERSIH 1 BARIS!';
    } else if (linesCleared === 2) {
      comboLabel = streak > 1 ? `BERUNTUN x${streak}!` : 'BERSIH 2 BARIS!';
    } else if (linesCleared === 3) {
      comboLabel = 'BERSIH 3 BARIS!';
    } else {
      comboLabel = 'LUAR BIASA!';
    }
  }

  return { points, comboLabel };
}
