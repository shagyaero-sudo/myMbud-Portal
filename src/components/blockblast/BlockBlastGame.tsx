/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { Trophy } from 'lucide-react';
import { GameBoard } from './components/GameBoard';
import { PieceDeck } from './components/PieceDeck';
import { GameOverModal } from './components/GameOverModal';
import { DragOverlay } from './components/DragOverlay';
import { BlockShape, Grid, FloatingText, GameStats, DragState, Position } from './types';
import { generateHand, GRID_SIZE } from './constants/shapes';
import {
  createEmptyGrid,
  canPlaceShape,
  placeShapeOnGrid,
  checkAndClearLines,
  checkCanAnyShapeFit,
  calculateScore,
} from './utils/gameLogic';
import { soundFX } from './utils/audio';

const HIGH_SCORE_KEY = 'block_blast_highscore';

export const BlockBlastGame: React.FC = () => {
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [hand, setHand] = useState<(BlockShape | null)[]>(generateHand);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [streak, setStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);
  const [linesClearedTotal, setLinesClearedTotal] = useState<number>(0);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [clearingCols, setClearingCols] = useState<number[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  const addFloatingText = (text: string, subtext?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newFt: FloatingText = { id, text, subtext, x: 50, y: 40 };
    setFloatingTexts((prev) => [...prev, newFt]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((ft) => ft.id !== id));
    }, 1000);
  };

  const startNewGame = useCallback(() => {
    setGrid(createEmptyGrid());
    setHand(generateHand());
    setSelectedShapeId(null);
    setScore(0);
    setStreak(0);
    setHighestStreak(0);
    setLinesClearedTotal(0);
    setClearingRows([]);
    setClearingCols([]);
    setFloatingTexts([]);
    setIsGameOver(false);
    setIsNewHighScore(false);
    if (soundEnabled) soundFX.playSelect();
  }, [soundEnabled]);

  const handleSelectShape = (shape: BlockShape) => {
    if (selectedShapeId === shape.id) {
      setSelectedShapeId(null);
    } else {
      setSelectedShapeId(shape.id);
      if (soundEnabled) soundFX.playSelect();
    }
  };

  const handleStartDrag = (shape: BlockShape, e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const grabC = Math.min(shape.width - 1, Math.max(0, Math.floor((offsetX / rect.width) * shape.width)));
    const grabR = Math.min(shape.height - 1, Math.max(0, Math.floor((offsetY / rect.height) * shape.height)));

    setDragState({
      shape, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY,
      currentX: e.clientX, currentY: e.clientY, grabC, grabR, hoverPos: null, isValid: false,
    });
  };

  const executePlacement = (shapeToPlace: BlockShape, startRow: number, startCol: number) => {
    const selectedShapeIndex = hand.findIndex((s) => s?.id === shapeToPlace.id);
    if (selectedShapeIndex === -1) return;

    if (!canPlaceShape(grid, shapeToPlace, startRow, startCol)) {
      if (soundEnabled) soundFX.playInvalid();
      return;
    }

    const placedGrid = placeShapeOnGrid(grid, shapeToPlace, startRow, startCol);
    if (soundEnabled) soundFX.playPlace();

    const updatedHand = [...hand];
    updatedHand[selectedShapeIndex] = null;
    setHand(updatedHand);
    setSelectedShapeId(null);

    const placedTilesCount = shapeToPlace.matrix.flat().filter((cell) => cell === 1).length;
    const { newGrid, clearedRows, clearedCols, linesClearedCount } = checkAndClearLines(placedGrid);

    let newStreak = streak;
    if (linesClearedCount > 0) {
      newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > highestStreak) setHighestStreak(newStreak);
      setLinesClearedTotal((prev) => prev + linesClearedCount);
    } else {
      newStreak = 0;
      setStreak(0);
    }

    const { points, comboLabel } = calculateScore(placedTilesCount, linesClearedCount, newStreak);
    const newScore = score + points;
    setScore(newScore);

    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem(HIGH_SCORE_KEY, newScore.toString());
    }

    if (linesClearedCount > 0) {
      setClearingRows(clearedRows);
      setClearingCols(clearedCols);
      if (soundEnabled) {
        soundFX.playClear(linesClearedCount);
        if (newStreak > 1) soundFX.playCombo(newStreak);
      }
      if (comboLabel) addFloatingText(`+${points}`, comboLabel);

      setTimeout(() => {
        setGrid(newGrid);
        setClearingRows([]);
        setClearingCols([]);
        checkPostMoveState(newGrid, updatedHand, newScore);
      }, 350);
    } else {
      setGrid(newGrid);
      checkPostMoveState(newGrid, updatedHand, newScore);
    }
  };

  useEffect(() => {
    if (!dragState) return;
    const LIFT_Y = 75;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      const currentX = e.clientX;
      const currentY = e.clientY;
      let hoverPos: Position | null = null;
      let isValid = false;

      if (gridRef.current) {
        const gridRect = gridRef.current.getBoundingClientRect();
        const cellWidth = gridRect.width / GRID_SIZE;
        const cellHeight = gridRect.height / GRID_SIZE;
        const targetC = Math.floor((currentX - gridRect.left) / cellWidth);
        const targetR = Math.floor((currentY - LIFT_Y - gridRect.top) / cellHeight);
        const startCol = targetC - dragState.grabC;
        const startRow = targetR - dragState.grabR;

        if (startRow >= 0 && startRow <= GRID_SIZE - dragState.shape.height && startCol >= 0 && startCol <= GRID_SIZE - dragState.shape.width) {
          hoverPos = { row: startRow, col: startCol };
          isValid = canPlaceShape(grid, dragState.shape, startRow, startCol);
        }
      }
      setDragState((prev) => prev ? { ...prev, currentX, currentY, hoverPos, isValid } : null);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
      if (dist < 8) {
        handleSelectShape(dragState.shape);
      } else if (dragState.hoverPos && dragState.isValid) {
        executePlacement(dragState.shape, dragState.hoverPos.row, dragState.hoverPos.col);
      } else if (dist >= 8) {
        if (soundEnabled) soundFX.playInvalid();
      }
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState, grid, hand, score, highScore, streak, highestStreak, soundEnabled]);

  const handleCellClick = (startRow: number, startCol: number) => {
    if (!selectedShapeId) return;
    const selectedShape = hand.find((s) => s?.id === selectedShapeId);
    if (selectedShape) {
      executePlacement(selectedShape, startRow, startCol);
    }
  };

  const checkPostMoveState = (currentGrid: Grid, currentHand: (BlockShape | null)[], currentScore: number) => {
    let nextHand = currentHand;
    if (currentHand.every((s) => s === null)) {
      nextHand = generateHand();
      setHand(nextHand);
    }
    const canFit = checkCanAnyShapeFit(currentGrid, nextHand);
    if (!canFit) {
      setTimeout(() => {
        setIsGameOver(true);
        if (currentScore > highScore) setIsNewHighScore(true);
        if (soundEnabled) soundFX.playGameOver();
      }, 400);
    }
  };

  const gameStats: GameStats = {
    score, highScore, linesClearedTotal, combosCount: 0, highestStreak,
  };

  // Komponen Skor Ramping & Compact
  const ScoreCardUI = () => (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl px-4 py-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {/* Skor Saat Ini */}
        <div>
          <span className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase block">
            Skor Saat Ini
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
              {score.toLocaleString()}
            </span>
            {streak > 1 && (
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                x{streak}
              </span>
            )}
          </div>
        </div>

        {/* Rekor & Tombol Restart */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase block">
              Rekor
            </span>
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs sm:text-sm font-black text-amber-500 leading-none">
                {highScore.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            onClick={startNewGame}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-all active:scale-95 text-xs sm:text-sm"
            title="Mulai Ulang Game"
          >
            ↻
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section className="w-full h-full max-w-5xl mx-auto select-none flex flex-col lg:flex-row gap-4 lg:gap-6 items-center lg:items-start lg:justify-center">
      
      {/* KHUSUS MOBILE: Munculkan Skor di ATAS papan game biar hemat ruang vertical */}
      <div className="w-full max-w-md lg:hidden shrink-0">
        <ScoreCardUI />
      </div>

      {/* Kolom Kiri / Tengah: Papan Game */}
      <div className="w-full max-w-md lg:max-w-[480px] shrink-0 z-10">
        <GameBoard
          gridRef={gridRef}
          grid={grid}
          selectedShape={hand.find((s) => s?.id === selectedShapeId) || null}
          draggedShape={dragState?.shape || null}
          dragHoverPos={dragState ? dragState.hoverPos : undefined}
          onCellClick={handleCellClick}
          clearingRows={clearingRows}
          clearingCols={clearingCols}
          floatingTexts={floatingTexts}
        />
      </div>

      {/* Kolom Kanan / Bawah: Skor (Khusus PC) & Balok (Deck) */}
      <div className="w-full max-w-md lg:max-w-[360px] flex flex-col gap-4 lg:gap-5 shrink-0">
        
        {/* KHUSUS PC: Skor ditaruh di kolom kanan */}
        <div className="hidden lg:block">
          <ScoreCardUI />
        </div>

        {/* Deck Balok (Selalu di bawah kalau di HP) */}
        <div className="z-10">
          <PieceDeck
            hand={hand}
            selectedShapeId={selectedShapeId}
            draggedShapeId={dragState?.shape.id}
            grid={grid}
            onSelectShape={handleSelectShape}
            onStartDrag={handleStartDrag}
          />
        </div>
      </div>

      <AnimatePresence>
        {dragState && (
          <DragOverlay
            key={`drag-${dragState.shape.id}`}
            shape={dragState.shape}
            currentX={dragState.currentX}
            currentY={dragState.currentY}
            grabC={dragState.grabC}
            grabR={dragState.grabR}
            cellSize={
              gridRef.current
                ? gridRef.current.getBoundingClientRect().width / GRID_SIZE
                : 38
            }
            isValid={dragState.isValid}
            isHoveringGrid={dragState.hoverPos !== null}
          />
        )}
      </AnimatePresence>

      {isGameOver && (
        <GameOverModal
          stats={gameStats}
          isNewHighScore={isNewHighScore}
          onRestart={startNewGame}
        />
      )}
    </section>
  );
};