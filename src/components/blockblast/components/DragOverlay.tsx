import React from 'react';
import { motion } from 'motion/react';
import { BlockShape } from '../types';
import { COLOR_CLASSES } from '../constants/shapes';

interface DragOverlayProps {
  shape: BlockShape;
  currentX: number;
  currentY: number;
  grabC: number;
  grabR: number;
  cellSize: number;
  isValid: boolean;
  isHoveringGrid: boolean;
}

export const DragOverlay: React.FC<DragOverlayProps> = ({
  shape,
  currentX,
  currentY,
  grabC,
  grabR,
  cellSize,
  isValid,
  isHoveringGrid,
}) => {
  const LIFT_Y = 75;
  // Compact cell size so the preview piece doesn't obscure the screen/grid
  const overlayCellSize = Math.min(30, Math.max(24, cellSize * 0.7));
  const colorInfo = COLOR_CLASSES[shape.color];

  // Direct transform target coordinates aligned with grab anchor
  const targetX = currentX - (grabC + 0.5) * overlayCellSize;
  const targetY = currentY - LIFT_Y - (grabR + 0.5) * overlayCellSize;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, x: targetX, y: targetY + 10 }}
      animate={{
        x: targetX,
        y: targetY,
        scale: isHoveringGrid ? (isValid ? 1.05 : 0.96) : 1.08,
        opacity: isHoveringGrid && !isValid ? 0.8 : 0.98,
      }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{
        x: { type: 'just' },
        y: { type: 'just' },
        scale: { type: 'spring', stiffness: 500, damping: 30 },
        opacity: { duration: 0.1 },
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform',
      }}
      className="select-none touch-none filter drop-shadow-2xl"
    >
      <motion.div
        animate={isHoveringGrid && !isValid ? { x: [-2, 2, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.2 }}
        className={`grid gap-0.5 p-1.5 bg-zinc-950/90 backdrop-blur-md rounded-xl border shadow-2xl transition-colors duration-150 ${
          isHoveringGrid
            ? isValid
              ? 'border-emerald-500/80 ring-2 ring-emerald-500/40 shadow-emerald-500/20'
              : 'border-rose-500/80 ring-2 ring-rose-500/40 shadow-rose-500/20'
            : 'border-zinc-700/80 ring-1 ring-white/10'
        }`}
        style={{
          gridTemplateColumns: `repeat(${shape.width}, minmax(0, 1fr))`,
        }}
      >
        {shape.matrix.map((rowArr, rIdx) =>
          rowArr.map((cell, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              style={{ width: `${overlayCellSize}px`, height: `${overlayCellSize}px` }}
              className="flex items-center justify-center"
            >
              {cell === 1 ? (
                <div
                  className={`w-full h-full rounded-[4px] bg-gradient-to-b ${
                    colorInfo?.gradient
                  } border-t border-white/40 shadow-md relative overflow-hidden transition-all ${
                    isHoveringGrid && !isValid ? 'brightness-75 saturate-50' : ''
                  }`}
                >
                  {/* Top Gloss Shine */}
                  <div className="absolute top-0 left-0 right-0 h-[38%] bg-white/25 rounded-t-[3px]"></div>
                  {/* Inner Bottom Shadow */}
                  <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-black/30 rounded-b-[3px]"></div>
                </div>
              ) : (
                <div className="w-full h-full opacity-0" />
              )}
            </div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
};
