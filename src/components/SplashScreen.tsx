import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Tampil 800ms lalu langsung cabut
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
        scale: 1.03,
        transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
      }}
      className="fixed inset-0 z-[99999999] flex items-center justify-center bg-[#07080b] select-none overflow-hidden overscroll-none touch-none pointer-events-none p-6"
    >
      {/* Subtle Ambient Backlight Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      {/* BIG LOGO */}
      <div className="relative z-10 w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 flex items-center justify-center">
        <img
          src="/logombud.png"
          alt="myMbud Logo"
          className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.5)] select-none"
        />
      </div>
    </motion.div>
  );
};