import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Tampil 800ms lalu selesai
    const timer = setTimeout(() => {
      onComplete?.();
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={false}
      exit={{
        opacity: 0,
        scale: 1.02,
        transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
      }}
      className="fixed -inset-10 z-[99999999] flex flex-col items-center justify-between select-none overflow-hidden overscroll-none touch-none pointer-events-none p-10"
      style={{
        width: 'calc(100vw + 80px)',
        minHeight: 'calc(100dvh + 80px)',
        height: 'calc(100vh + 80px)',
        backgroundColor: '#07080b',
      }}
    >
      {/* Spacer Atas untuk menjaga Logo tetap presisi di Center */}
      <div className="w-full" />

      {/* Subtle Ambient Backlight Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      {/* BIG LOGO CENTER */}
      <div className="relative z-10 w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 flex items-center justify-center">
        <img
          src="/logombud.png"
          alt="myMbud Logo"
          className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.5)] select-none"
        />
      </div>

      {/* FOOTER: myITS INTEGRATED (TENGAH BAWAH) */}
      <div className="relative z-10 flex flex-col items-center gap-1 mb-6 sm:mb-8 select-none">
        <img
          src="/myits-logo.svg"
          alt="myITS Logo"
          className="h-3.5 sm:h-4 w-auto object-contain brightness-0 invert opacity-80"
        />
        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-medium">
          Integrated
        </span>
      </div>
    </motion.div>
  );
};