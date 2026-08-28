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
    }, 1100);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.04,
        filter: 'blur(10px)',
        transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-[99999999] flex items-center justify-center bg-[#07080b] select-none overflow-hidden overscroll-none touch-none pointer-events-none p-6"
    >
      {/* Dynamic Ambient Backlight Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.45, scale: 1.15 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full bg-blue-600/25 blur-[120px]"
        />
      </div>

      {/* BIG LOGO CONTAINER */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{
          duration: 0.55,
          delay: 0.1,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-10 w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 flex items-center justify-center"
      >
        <img
          src="/logombud.png"
          alt="myMbud Logo"
          className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.55)] select-none"
        />
      </motion.div>
    </motion.div>
  );
};