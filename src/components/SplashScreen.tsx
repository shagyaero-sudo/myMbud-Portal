import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // 850ms total waktu tampil sebelum fade-out mulus ke dashboard
    const timer = setTimeout(() => {
      onComplete?.();
    }, 850);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={false}
      exit={{
        opacity: 0,
        scale: 1.02,
        transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
      }}
      className="fixed -inset-10 z-[99999999] flex flex-col items-center justify-between select-none overflow-hidden overscroll-none touch-none pointer-events-none p-10"
      style={{
        width: 'calc(100vw + 80px)',
        minHeight: 'calc(100dvh + 80px)',
        height: 'calc(100vh + 80px)',
        backgroundColor: '#07080b',
      }}
    >
      {/* Spacer Penyeimbang Atas */}
      <div className="w-full" />

      {/* Subtle Ambient Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.35 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full bg-blue-600/20 blur-[120px]"
        />
      </div>

      {/* BIG LOGO DENGAN POP-IN HALUS (APPLE SPRING) */}
      <motion.div
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 32,
          mass: 0.8,
        }}
        className="relative z-10 w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 flex items-center justify-center"
      >
        <img
          src="/logombud.png"
          alt="myMbud Logo"
          className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.5)] select-none"
        />
      </motion.div>

      {/* FOOTER: myITS INTEGRATED */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center gap-1 mb-6 sm:mb-8 select-none"
      >
        <img
          src="/myits-logo.svg"
          alt="myITS Logo"
          className="h-3.5 sm:h-4 w-auto object-contain brightness-0 invert opacity-90"
        />
        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-medium">
          Integrated
        </span>
      </motion.div>
    </motion.div>
  );
};