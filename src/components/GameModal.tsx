import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ArcadeGame } from './ArcadeView';

interface GameModalProps {
  game: ArcadeGame | null;
  onClose: () => void;
}

const aspectClass: Record<NonNullable<ArcadeGame['aspect']>, string> = {
  square: 'aspect-square max-w-[520px]',
  portrait: 'aspect-[3/4] max-w-[420px]',
  wide: 'aspect-video max-w-[720px]',
};

export const GameModal: React.FC<GameModalProps> = ({ game, onClose }) => {
  // isLoaded tracks the iframe's own onLoad so we can show a spinner
  // without blocking the rest of the app from staying light/idle.
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset loading state whenever a different game is opened.
  useEffect(() => {
    setIsLoaded(false);
  }, [game?.id]);

  // Lock background scroll while a game is open, same pattern as your
  // other modals (Pdf/Gpa) likely already do.
  useEffect(() => {
    if (game) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [game]);

  return (
    <AnimatePresence>
      {game && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
            style={{ maxWidth: game.aspect === 'wide' ? 720 : game.aspect === 'portrait' ? 420 : 520 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">{game.emoji}</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-100">
                  {game.title}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Game surface */}
            <div className={`relative w-full ${aspectClass[game.aspect || 'square']}`}>
              {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-zinc-800/60 animate-pulse">
                  <span className="text-sm text-slate-500 dark:text-zinc-400">
                    Memuat game...
                  </span>
                </div>
              )}

              {/*
                Lazy mount: the <iframe> only exists in the DOM while the
                modal is open (this component only renders when `game` is
                set, and React unmounts it entirely on close). So closing
                a game fully frees its memory/CPU instead of running in
                the background.
              */}
              <iframe
                key={game.id}
                src={game.src}
                title={game.title}
                loading="lazy"
                onLoad={() => setIsLoaded(true)}
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
