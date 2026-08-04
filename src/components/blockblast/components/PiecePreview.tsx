import React from 'react';
import { motion } from 'motion/react';
import { BlockShape } from '../types';
import { COLOR_CLASSES } from '../constants/shapes';

interface PiecePreviewProps {
  shape: BlockShape;
  size?: 'sm' | 'md' | 'lg';
  isSelected?: boolean;
  isDisabled?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  className?: string;
}

export const PiecePreview: React.FC<PiecePreviewProps> = ({
  shape,
  size = 'md',
  isSelected = false,
  isDisabled = false,
  isDragging = false,
  onClick,
  onPointerDown,
  className = '',
}) => {
  // Tile dimensions based on scale
  const cellSizeClass =
    size === 'sm' ? 'w-5 h-5 rounded-xs' :
    size === 'lg' ? 'w-9 h-9 rounded-md' : 'w-7 h-7 rounded-md';

  const gapClass = size === 'sm' ? 'gap-[1.5px]' : 'gap-1';
  const colorStyle = COLOR_CLASSES[shape.color];

  return (
    <motion.div
      onClick={isDisabled ? undefined : onClick}
      onPointerDown={isDisabled ? undefined : onPointerDown}
      whileHover={isDisabled ? undefined : { scale: 1.04 }}
      whileTap={isDisabled ? undefined : { scale: 0.94 }}
      animate={{
        scale: isDragging ? 0.9 : isSelected ? 1.05 : 1,
        opacity: isDragging ? 0.25 : isDisabled ? 0.35 : 1,
      }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      className={`relative p-2.5 rounded-xl select-none touch-none cursor-grab active:cursor-grabbing flex items-center justify-center ${
        isSelected
          ? 'bg-zinc-800 ring-2 ring-zinc-400 shadow-xl shadow-black/50'
          : 'hover:bg-zinc-800/60'
      } ${
        isDisabled ? 'grayscale cursor-not-allowed' : ''
      } ${className}`}
    >
      <div
        className={`grid ${gapClass}`}
        style={{
          gridTemplateColumns: `repeat(${shape.width}, minmax(0, 1fr))`,
        }}
      >
        {shape.matrix.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <div key={`${rIdx}-${cIdx}`} className={`${cellSizeClass} flex items-center justify-center`}>
              {cell === 1 ? (
                <div
                  className={`w-full h-full rounded-[3px] bg-gradient-to-b ${colorStyle.gradient} border-t border-white/20 shadow-[inset_0_0_6px_rgba(0,0,0,0.3)] shadow-xs relative overflow-hidden`}
                >
                  {/* Top-left gloss shine highlight */}
                  <div className="absolute top-0 left-0 right-0 h-[35%] bg-white/20 rounded-t-[2px]"></div>
                  {/* Inner bevel bottom shadow */}
                  <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-black/25 rounded-b-[2px]"></div>
                </div>
              ) : (
                <div className="w-full h-full opacity-0" />
              )}
            </div>
          ))
        )}
      </div>

      {isDisabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 rounded-xl">
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
            Tak Muat
          </span>
        </div>
      )}
    </motion.div>
  );
};
