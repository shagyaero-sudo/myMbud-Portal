import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Total durasi sangat snappy (850ms)
    const timer = setTimeout(() => {
      onComplete?.();
    }, 850);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        filter: 'blur(16px)',
        transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
      }}
      className="fixed inset-0 z-[99999999] flex flex-col items-center justify-center bg-[#07080b] select-none overflow-hidden overscroll-none touch-none pointer-events-none"
    >
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.35, scale: 1.1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-[280px] h-[280px] rounded-full bg-blue-600/20 blur-[90px]"
        />
      </div>

      {/* Floating Dynamic Pill Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex items-center gap-3 px-5 py-3 rounded-full bg-white/[0.04] dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      >
        {/* Logo with Soft Pulse */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0"
        >
          <img
            src="/logombud.png"
            alt="Logo"
            className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
          />
        </motion.div>

        {/* Brand Text Emerge */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'auto', opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden whitespace-nowrap pr-1"
        >
          <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
            my<span className="text-blue-500 font-black">Mbud</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono ml-2 font-normal">
            v2.5
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};