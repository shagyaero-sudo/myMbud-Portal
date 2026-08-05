import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BlockShape, Grid, Position, FloatingText } from '../types';
import { COLOR_CLASSES, GRID_SIZE } from '../constants/shapes';
import { canPlaceShape } from '../utils/gameLogic';

interface GameBoardProps {
  grid: Grid;
  selectedShape: BlockShape | null;
  draggedShape?: BlockShape | null;
  dragHoverPos?: Position | null;
  onCellClick: (row: number, col: number) => void;
  clearingRows: number[];
  clearingCols: number[];
  floatingTexts: FloatingText[];
  gridRef?: React.RefObject<HTMLDivElement | null>;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  selectedShape,
  draggedShape = null,
  dragHoverPos,
  onCellClick,
  clearingRows,
  clearingCols,
  floatingTexts,
  gridRef,
}) => {
  const [hoverPos, setHoverPos] = useState<Position | null>(null);

  const handleCellMouseEnter = (row: number, col: number) => {
    if (selectedShape) {
      setHoverPos({ row, col });
    }
  };

  const handleMouseLeaveGrid = () => {
    setHoverPos(null);
  };

  // Determine if a cell is covered by the current hover preview
  const getPreviewState = (row: number, col: number) => {
    const activeShape = draggedShape || selectedShape;
    const activeHoverPos = dragHoverPos !== undefined ? dragHoverPos : hoverPos;

    if (!activeShape || !activeHoverPos) {
      return { isGhost: false, isValid: false };
    }

    const isValidPlacement = canPlaceShape(grid, activeShape, activeHoverPos.row, activeHoverPos.col);

    // Check if cell is part of the shape at hoverPos
    const shapeR = row - activeHoverPos.row;
    const shapeC = col - activeHoverPos.col;

    if (
      shapeR >= 0 &&
      shapeR < activeShape.height &&
      shapeC >= 0 &&
      shapeC < activeShape.width
    ) {
      if (activeShape.matrix[shapeR][shapeC] === 1) {
        return { isGhost: true, isValid: isValidPlacement };
      }
    }

    return { isGhost: false, isValid: false };
  };

  return (
    <div className="w-full mx-auto flex justify-center select-none">
      <div
        onMouseLeave={handleMouseLeaveGrid}
        className="w-full aspect-square bg-white/60 dark:bg-zinc-900/80 backdrop-blur-sm p-3 sm:p-4 rounded-3xl border border-slate-200/60 dark:border-zinc-800 shadow-lg relative flex flex-col justify-between"
      >
        {/* Floating Animated Text (Scores, Combos, Streaks) */}
        <AnimatePresence>
          {floatingTexts.map((ft) => (
            <motion.div
              key={ft.id}
              initial={{ opacity: 0, scale: 0.5, y: ft.y }}
              animate={{ opacity: 1, scale: 1.2, y: ft.y - 40 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center"
              style={{ top: `${ft.y}%` }}
            >
              <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-300 drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)] dark:drop-shadow-[0_4px_12px_rgba(245,158,11,0.8)] tracking-tight">
                {ft.text}
              </span>
              {ft.subtext && (
                <span className="text-sm font-extrabold text-cyan-500 dark:text-cyan-300 drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)] dark:drop-shadow-[0_2px_8px_rgba(6,182,212,0.8)] uppercase tracking-wider">
                  {ft.subtext}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 8x8 Grid Canvas */}
        <div
          ref={gridRef}
          className="p-2 bg-slate-100/50 dark:bg-zinc-950/50 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 w-full h-full grid grid-cols-8 gap-1.5 sm:gap-2 touch-none"
        >
          {grid.map((rowArr, rIdx) =>
            rowArr.map((cellColor, cIdx) => {
              const isClearingRow = clearingRows.includes(rIdx);
              const isClearingCol = clearingCols.includes(cIdx);
              const isClearing = isClearingRow || isClearingCol;

              const { isGhost, isValid } = getPreviewState(rIdx, cIdx);
              const colorInfo = cellColor ? COLOR_CLASSES[cellColor] : null;

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  onMouseEnter={() => handleCellMouseEnter(rIdx, cIdx)}
                  onClick={() => onCellClick(rIdx, cIdx)}
                  // PERUBAHAN UTAMA: Warna cell kosong sekarang pakai slate-200 (terang) / zinc-900 (gelap)
                  className="w-full h-full aspect-square rounded-sm sm:rounded-md relative cursor-pointer overflow-hidden transition-all duration-100 flex items-center justify-center bg-slate-200/80 dark:bg-zinc-900 border border-slate-300/50 dark:border-zinc-800/40 hover:bg-slate-300/80 dark:hover:bg-zinc-800/40"
                >
                  {/* Actual Placed Block Tile */}
                  {cellColor && !isClearing && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      className={`w-full h-full rounded-sm sm:rounded-md bg-gradient-to-b ${colorInfo?.gradient} border-t border-white/40 shadow-[inset_0_0_10px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_0_10px_rgba(0,0,0,0.35)] shadow-sm relative overflow-hidden`}
                    >
                      {/* Top Gloss Shine */}
                      <div className="absolute top-0 left-0 right-0 h-[38%] bg-white/30 rounded-t-xs"></div>
                      {/* Inner Bottom Shadow */}
                      <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-black/20 rounded-b-xs"></div>
                    </motion.div>
                  )}

                  {/* Clearing Line Animation */}
                  {isClearing && (
                    <motion.div
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: [1, 1.2, 0], opacity: [1, 1, 0] }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      className="w-full h-full rounded-sm sm:rounded-md bg-white shadow-[0_0_15px_#ffffff] z-20 flex items-center justify-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    </motion.div>
                  )}

                  {/* Ghost Placement Hover Preview */}
                  {isGhost && !cellColor && (
                    <div
                      className={`w-full h-full rounded-sm sm:rounded-md border-2 z-10 transition-colors ${
                        isValid
                          ? 'bg-emerald-400/40 border-emerald-400 dark:border-emerald-300 animate-pulse'
                          : 'bg-rose-500/30 border-rose-500/80 dark:border-rose-400/80'
                      }`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};