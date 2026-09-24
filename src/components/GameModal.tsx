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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [game?.id]);

  useEffect(() => {
    if (game) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [game]);

  // PERBAIKAN MOBILE: Deteksi game yang butuh penyesuaian tinggi khusus
  const is2048 = game?.id === '2048' || game?.title.toLowerCase().includes('2048');
  const isEmojiCrush = game?.id === 'match3' || game?.id === 'emojicrush' || game?.title.toLowerCase().includes('match');
  const isSpaceHunter = game?.id === 'spacehunter' || game?.title.toLowerCase().includes('space');

  return (
    <AnimatePresence>
      {game && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            style={{ maxWidth: game.aspect === 'wide' && !isSpaceHunter ? 720 : game.aspect === 'portrait' ? 420 : 520 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-zinc-800 shrink-0">
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
            <div 
              className={`relative w-full ${
                is2048 
                  ? 'h-[72vh] sm:h-auto sm:aspect-square max-w-[520px]' 
                  : isEmojiCrush
                  ? 'aspect-[3/4.2] max-w-[480px]'
                  : isSpaceHunter
                  ? 'h-[75vh] sm:h-auto sm:aspect-[3/4] max-w-[460px]'
                  : aspectClass[game.aspect || 'square']
              }`}
            >
              {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-zinc-800/60 animate-pulse">
                  <span className="text-sm text-slate-500 dark:text-zinc-400">
                    Memuat game...
                  </span>
                </div>
              )}

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