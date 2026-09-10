import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // 1400ms untuk memberikan waktu animasi lingkaran berputar penuh secara elegan
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1400);

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

      {/* AMBIENT BLUE GLOW (FADE IN SUPER LEMBUT) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.4, scale: 1.1 }}
          transition={{
            duration: 0.75,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full bg-blue-600/25 blur-[120px]"
        />
      </div>

      {/* BIG LOGO + CIRCULAR OUTLINE ANIMATION */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.65,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="relative z-10 w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 flex items-center justify-center"
      >
        {/* SVG CIRCLE ORBIT ANIMATION (MUTER DARI BAWAH KEMBALI KE BAWAH) */}
        <div className="absolute -inset-4 sm:-inset-6 md:-inset-8 pointer-events-none flex items-center justify-center">
          <svg
            className="w-full h-full rotate-90"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="splashCircleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
              <filter id="glowCircle" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* TRACK BASE SUBTLE OUTLINE */}
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke="#1e293b"
              strokeWidth="0.8"
              strokeOpacity="0.4"
            />

            {/* ANIMATED TRACE CIRCLE */}
            <motion.circle
              cx="50"
              cy="50"
              r="46"
              stroke="url(#splashCircleGradient)"
              strokeWidth="1.6"
              strokeLinecap="round"
              filter="url(#glowCircle)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1.1,
                ease: [0.4, 0, 0.2, 1],
                delay: 0.1,
              }}
              style={{
                pathLength: 1,
                rotate: 0,
              }}
            />
          </svg>
        </div>

        {/* LOGO MBUD */}
        <img
          src="/logombud.png"
          alt="myMbud Logo"
          className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.55)] select-none relative z-10"
        />
      </motion.div>

      {/* FOOTER: myITS INTEGRATED (MENYUSUL LEMBUT) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{
          duration: 0.55,
          delay: 0.2,
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