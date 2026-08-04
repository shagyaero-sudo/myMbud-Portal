import React from 'react';
import { BlockShape, Grid } from '../types';
import { PiecePreview } from './PiecePreview';
import { canPlaceShape } from '../utils/gameLogic';
import { GRID_SIZE } from '../constants/shapes';

interface PieceDeckProps {
  hand: (BlockShape | null)[];
  selectedShapeId: string | null;
  draggedShapeId?: string | null;
  grid: Grid;
  onSelectShape: (shape: BlockShape) => void;
  onStartDrag?: (shape: BlockShape, e: React.PointerEvent<HTMLDivElement>) => void;
}

export const PieceDeck: React.FC<PieceDeckProps> = ({
  hand,
  selectedShapeId,
  draggedShapeId,
  grid,
  onSelectShape,
  onStartDrag,
}) => {
  // Helper to check if a shape can fit anywhere on current grid
  const checkCanFitOnGrid = (shape: BlockShape) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (canPlaceShape(grid, shape, r, c)) {
          return true;
        }
      }
    }
    return false;
  };

  return (
    <div className="w-full mx-auto">
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-4 rounded-3xl shadow-sm min-h-[110px] flex items-center justify-around gap-2">
        {hand.map((shape, idx) => {
          if (!shape) {
            return (
              <div
                key={`empty-${idx}`}
                className="flex-1 max-w-[120px] h-[78px] border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-slate-300 dark:text-zinc-700 text-xs font-bold tracking-wider uppercase"
              >
                Kosong
              </div>
            );
          }

          const canFit = checkCanFitOnGrid(shape);
          const isSelected = selectedShapeId === shape.id;
          const isDragging = draggedShapeId === shape.id;

          return (
            <div key={shape.id} className="flex-1 max-w-[130px] flex justify-center">
              <PiecePreview
                shape={shape}
                size="md"
                isSelected={isSelected}
                isDisabled={!canFit}
                isDragging={isDragging}
                onClick={() => onSelectShape(shape)}
                onPointerDown={(e) => onStartDrag && onStartDrag(shape, e)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
