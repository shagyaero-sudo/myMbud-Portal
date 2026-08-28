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
        console.warn('[SplashScreen] Gagal memutar audio:', e);
      }
    }

    // Durasi total sebelum unmount: 900ms (cepat & snappy)
    const timer = setTimeout(() => {
      onComplete?.();
    }, 900);

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
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.35, delay: 0.15, ease: 'easeOut' },
      }}
      className="fixed inset-0 z-[99999999] flex items-center justify-center bg-[#090a0f] select-none overflow-hidden overscroll-none touch-none pointer-events-none"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] rounded-full bg-blue-600/15 blur-[100px]" />
      </div>

      {/* Twitter-style Zoom Through Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: [0.8, 1, 0.88, 38],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 0.85,
          times: [0, 0.35, 0.55, 1],
          ease: [0.7, 0, 0.3, 1],
        }}
        className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center origin-center"
      >
        <img
          src="/logombud.png"
          alt="myMbud Logo"
          className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.45)]"
        />
      </motion.div>
    </motion.div>
  );
};