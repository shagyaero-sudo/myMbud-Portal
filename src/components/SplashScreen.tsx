import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
}) => {
  const [phase, setPhase] = useState<
    'logo' | 'collapse' | 'expand' | 'done'
  >('logo');

  useEffect(() => {
    // Logo tampil terlebih dahulu
    const collapseTimer = window.setTimeout(() => {
      setPhase('collapse');
    }, 900);

    // Logo mengecil menjadi titik
    const expandTimer = window.setTimeout(() => {
      setPhase('expand');
    }, 1250);

    // Tunggu transisi selesai lalu masuk aplikasi
    const completeTimer = window.setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 1950);

    return () => {
      window.clearTimeout(collapseTimer);
      window.clearTimeout(expandTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'expand' ? 1 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[99999] overflow-hidden bg-[#ff321f] flex items-center justify-center"
          style={{
            width: '100vw',
            height: '100dvh',
            minHeight: '-webkit-fill-available',
          }}
        >
          {/* LOGO */}
          <motion.img
            src="/logombud.png"
            alt="myMbud"
            draggable={false}
            initial={{
              opacity: 0,
              scale: 0.72,
            }}
            animate={
              phase === 'logo'
                ? {
                    opacity: 1,
                    scale: 1,
                  }
                : phase === 'collapse'
                ? {
                    opacity: 1,
                    scale: 0.18,
                  }
                : {
                    opacity: 0,
                    scale: 0.04,
                  }
            }
            transition={
              phase === 'logo'
                ? {
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }
                : {
                    duration: 0.28,
                    ease: [0.4, 0, 1, 1],
                  }
            }
            className="absolute z-20 w-auto h-16 sm:h-20 object-contain"
            style={{
              filter: 'brightness(0) invert(1)',
            }}
          />

          {/* TITIK TRANSISI */}
          <motion.div
            initial={{
              scale: 0,
              opacity: 0,
            }}
            animate={
              phase === 'expand'
                ? {
                    scale: 35,
                    opacity: 1,
                  }
                : {
                    scale: 0,
                    opacity: 0,
                  }
            }
            transition={{
              duration: 0.65,
              ease: [0.76, 0, 0.24, 1],
            }}
            className="absolute z-10 w-6 h-6 rounded-full bg-white"
          />

          {/* Sedikit aksen titik putih sebelum transisi */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0,
            }}
            animate={
              phase === 'collapse'
                ? {
                    opacity: 1,
                    scale: 1,
                  }
                : {
                    opacity: 0,
                    scale: 0,
                  }
            }
            transition={{
              duration: 0.15,
            }}
            className="absolute z-30 w-2 h-2 rounded-full bg-white"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};