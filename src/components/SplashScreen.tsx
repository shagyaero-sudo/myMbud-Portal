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
            console.warn('[SplashScreen] Autoplay audio dicegah browser:', err);
          });
        }
      } catch (e) {
        console.warn('[SplashScreen] Gagal memuat audio:', e);
      }
    }

    const timer = setTimeout(() => {
      onComplete?.();
    }, 950);

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
        scale: 1.02,
        transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
      }}
      className="fixed inset-0 z-[99999999] flex flex-col items-center justify-between bg-[#090a0f] text-white select-none overflow-hidden p-6 sm:p-10 pointer-events-none"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[320px] h-[320px] rounded-full bg-blue-600/10 blur-[90px]" />
      </div>

      <div className="w-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-4"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          <img
            src="/logombud.png"
            alt="myMbud Logo"
            className="w-full h-full object-contain drop-shadow-[0_0_24px_rgba(59,130,246,0.35)]"
          />
        </div>

        <div className="text-center space-y-0.5">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white/90">
            <span className="font-light text-white/60">my</span>Mbud
            <span className="font-light text-white/60"> Portal</span>
          </h1>
          <p className="text-[11px] font-medium tracking-wide text-zinc-500">
            v2.5
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="relative z-10 flex flex-col items-center gap-1 mb-[env(safe-area-inset-bottom)]"
      >
        <img
          src="/myits-logo.svg"
          alt="myITS Logo"
          className="h-3 w-auto object-contain brightness-0 invert opacity-80"
        />
        <span className="text-[8.5px] uppercase tracking-widest text-zinc-500 font-semibold">
          Integrated
        </span>
      </motion.div>
    </motion.div>
  );
};