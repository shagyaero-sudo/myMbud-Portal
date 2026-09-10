import React, { useEffect } from 'react';
import { motion, useTime, useTransform } from 'framer-motion';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={false}
      exit={{
        opacity: 0,
        scale: 1.02,
        transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
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

      {/* AMBIENT BLUE GLOW */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.35, scale: 1.1 }}
          transition={{
            duration: 1,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full bg-blue-600/20 blur-[130px]"
        />
      </div>

      {/* LOGO CONTAINER WITH SOFT LIQUID FILL REVEAL */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 flex items-center justify-center filter drop-shadow-[0_0_35px_rgba(59,130,246,0.65)]"
      >
        {/* 1. LOGO BASE (GREYSCALE / ABU-ABU CLEARLY VISIBLE) */}
        <img
          src="/logombud.png"
          alt="myMbud Logo Base"
          className="w-full h-full object-contain filter grayscale opacity-40 select-none"
        />

        {/* 2. LOGO COVER (ANIMASI TERISI WARNA DARI BAWAH KE ATAS DENGAN MASKING HALUS) */}
        <motion.div
          initial={{
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 0%)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 0%)',
          }}
          animate={{
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 120%, rgba(0,0,0,0) 140%)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 120%, rgba(0,0,0,0) 140%)',
          }}
          transition={{
            duration: 1.1,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.15,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <img
            src="/logombud.png"
            alt="myMbud Logo Color"
            className="w-full h-full object-contain select-none"
          />
        </motion.div>
      </motion.div>

      {/* FOOTER: myITS INTEGRATED */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{
          duration: 0.55,
          delay: 0.3,
          ease: 'easeInOut',
        }}
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