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
      initial={false}
      exit={{
        opacity: 0,
        scale: 1.05,
        filter: 'blur(12px)',
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      }}
      className="fixed -inset-10 z-[9999999] bg-[#070709] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none overscroll-none touch-none p-10"
      style={{
        width: 'calc(100vw + 80px)',
        minHeight: 'calc(100dvh + 80px)',
        height: 'calc(100vh + 80px)',
        backgroundColor: '#070709',
      }}
    >
      {/* --- AMBIENT WEB3 GLOW MESH --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.6, 0.35],
          }}
          transition={{
            opacity: { duration: 0.8, ease: 'easeOut' },
            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute -top-[10%] -left-[10%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-tr from-blue-600/40 via-indigo-500/30 to-cyan-400/20 blur-[110px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            opacity: { duration: 0.8, ease: 'easeOut', delay: 0.1 },
            scale: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute -bottom-[15%] -right-[15%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-indigo-600/40 via-purple-600/30 to-blue-500/20 blur-[130px]"
        />
      </div>

      {/* --- CENTER FLOATING GLASS CARD --- */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 24, filter: 'blur(10px)' }}
          animate={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.85,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative group"
        >
          {/* Neon Glow Layer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" 
          />

          {/* --- CINEMATIC RIM LIGHT FLASH (BACKLIGHT) --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.9, 0], scale: [0.8, 1.7] }}
            transition={{ duration: 0.95, delay: 0.15, ease: 'easeOut' }}
            className="absolute inset-0 bg-white rounded-[2.5rem] blur-[35px] pointer-events-none"
          />

          {/* Frosted Glass Container */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-white/[0.08] backdrop-blur-2xl border border-white/25 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex items-center justify-center p-5 overflow-hidden">
            {/* Shimmer Reflection */}
            <motion.div
              initial={{ x: '-150%' }}
              animate={{ x: '150%' }}
              transition={{
                repeat: Infinity,
                duration: 2.4,
                ease: 'easeInOut',
                repeatDelay: 0.6,
                delay: 0.4,
              }}
              className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
            />

            {/* Logo myMbud */}
            <motion.img
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              src="/logombud.png"
              alt="myMbud Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10"
            />
          </div>
        </motion.div>

        {/* --- BRAND TITLE & TYPOGRAPHY SENADA --- */}
        <motion.div
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.75,
            delay: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mt-6 text-center space-y-1"
        >
          <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-white">
            my<strong className="font-black">Mbud</strong> Portal
          </h1>
          <p className="text-xs sm:text-sm font-light tracking-wide text-slate-400">
            #RuangBertumbuh
          </p>
        </motion.div>
      </div>

      {/* --- FOOTER: INTEGRATED WITH MYITS & VERSION LABEL --- */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
        className="absolute bottom-12 sm:bottom-14 mb-[env(safe-area-inset-bottom)] flex flex-col items-center gap-2 select-none"
      >
        {/* Integrated With myITS */}
        <div className="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
          <span className="text-[9.5px] uppercase tracking-widest text-slate-400 font-medium">
            Integrated with
          </span>
          <img
            src="/myits-logo.svg"
            alt="myITS Logo"
            className="h-3.5 sm:h-4 w-auto object-contain brightness-0 invert opacity-90"
          />
        </div>

        {/* Version Label */}
        <span className="text-[10px] font-mono text-slate-500 tracking-wider">
          ©2026
        </span>
      </motion.div>
    </motion.div>
  );
};