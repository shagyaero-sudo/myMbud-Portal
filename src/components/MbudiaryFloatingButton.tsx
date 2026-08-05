import React from 'react';
import { motion } from 'framer-motion';
import { BookHeart } from 'lucide-react';

export const MbudiaryFloatingButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ opacity: 0, scale: 0.85, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    whileHover={{ scale: 1.04, y: -2 }}
    whileTap={{ scale: 0.94 }}
    className="fixed right-4 bottom-24 lg:right-8 lg:bottom-8 z-40 group"
    aria-label="Buka mbudiary"
  >
    <span className="absolute inset-0 rounded-[1.35rem] bg-indigo-500/15 blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
    <span className="relative flex items-center gap-2 px-4 py-3 rounded-[1.35rem] bg-white/95 dark:bg-zinc-900/95 border border-indigo-100 dark:border-indigo-900/60 shadow-xl shadow-indigo-500/10 backdrop-blur-md">
      <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center rotate-[-5deg] group-hover:rotate-0 transition-transform">
        <BookHeart className="w-5 h-5" />
      </span>
      <span className="text-left leading-none">
        <span className="block text-[10px] font-black tracking-[0.16em] uppercase text-indigo-500 dark:text-indigo-400">ruang aman</span>
        <span className="block mt-1 text-sm font-extrabold text-slate-800 dark:text-zinc-100">mbudiary.</span>
      </span>
    </span>
  </motion.button>
);
