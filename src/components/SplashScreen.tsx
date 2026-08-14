import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  soundUrl?: string;
  onAnimationComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  soundUrl = '/splash-sound.mp3' 
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Memutar sound effect splash secara otomatis
    if (soundUrl) {
      try {
        const audio = new Audio(soundUrl);
        audioRef.current = audio;
        audio.volume = 0.8;
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

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundUrl]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.05,
        filter: 'blur(12px)',
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      }}
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999999] min-h-[100dvh] h-screen w-screen bg-[#070709] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none overscroll-none touch-none"
    >
      {/* --- AMBIENT WEB3 GLOW MESH --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.6, 0.35],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-[10%] -left-[10%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-tr from-blue-600/40 via-indigo-500/30 to-cyan-400/20 blur-[110px] mix-blend-screen"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-[15%] -right-[15%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-indigo-600/40 via-purple-600/30 to-blue-500/20 blur-[130px] mix-blend-screen"
        />
      </div>

      {/* --- CENTER FLOATING GLASS CARD --- */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 30, rotateX: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 22,
            mass: 0.8,
          }}
          className="relative group"
        >
          {/* Neon Glow Layer di Belakang Kaca */}
          <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-blue-500 to-indigo-600 opacity-60 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />

          {/* Frosted Glass Container */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-white/[0.08] backdrop-blur-2xl border border-white/25 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex items-center justify-center p-5 overflow-hidden">
            {/* Shimmer Light Reflection Sweep */}
            <motion.div
              initial={{ x: '-150%' }}
              animate={{ x: '150%' }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: 'easeInOut',
                repeatDelay: 0.8,
              }}
              className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
            />

            {/* Logo myMbud */}
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              src="/logombud.png"
              alt="myMbud Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10"
            />
          </div>
        </motion.div>

        {/* --- BRAND TITLE & TYPOGRAPHY SENADA --- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-6 text-center space-y-1"
        >
          <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-white">
            my<strong className="font-black">Mbud</strong> Portal
          </h1>
          <p className="text-xs sm:text-sm font-light tracking-wide text-slate-400">
            #SemakinMudah
          </p>
        </motion.div>
      </div>

      {/* --- FOOTER VERSION LABEL (SAFE AREA ADJUSTED) --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="absolute bottom-6 sm:bottom-8 mb-[env(safe-area-inset-bottom)] text-[11px] font-mono text-slate-400 tracking-wider"
      >
        v2.5
      </motion.div>
    </motion.div>
  );
};