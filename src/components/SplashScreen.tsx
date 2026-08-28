import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  soundUrl?: string;
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  soundUrl = '/splash-sound.mp3',
  onComplete,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (soundUrl) {
      try {
        const audio = new Audio(soundUrl);
        audioRef.current = audio;
        audio.volume = 0.75;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[SplashScreen] Audio autoplay dicegah browser:', err);
          });
        }
      } catch (e) {
        console.warn('[SplashScreen] Gagal memuat file audio:', e);
      }
    }

    const timer = setTimeout(() => {
      onComplete?.();
    }, 1200);

    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundUrl, onComplete]);

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

      {/* BIG LOGO (FADE IN + SUBTLE SCALE-UP) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.65,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="relative z-10 w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 flex items-center justify-center"
      >
        <img
          src="/logombud.png"
          alt="myMbud Logo"
          className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.55)] select-none"
        />
      </motion.div>

      {/* FOOTER: myITS INTEGRATED */}
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