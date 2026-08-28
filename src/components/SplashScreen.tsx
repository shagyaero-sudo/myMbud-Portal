import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  soundUrl?: string;
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  soundUrl = '/splash-sound.mp3',
  onComplete,
}) => {
  // Step urutan animasi: 'icon' -> 'wordmark' -> 'dot' -> 'reveal'
  const [step, setStep] = useState<'icon' | 'wordmark' | 'dot' | 'reveal'>('icon');
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

    // Timeline Cepat & Presisi ala GetYourGuide (Total ~1.5s):
    // 1. Icon Logo tampil selama 450ms
    const t1 = setTimeout(() => setStep('wordmark'), 450);
    // 2. Wordmark Teks tampil selama 450ms
    const t2 = setTimeout(() => setStep('dot'), 900);
    // 3. Titik putih meledak secara circular mask membuka dashboard
    const t3 = setTimeout(() => setStep('reveal'), 1150);
    // 4. Selesai & Trigger Unmount
    const t4 = setTimeout(() => onComplete?.(), 1550);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundUrl, onComplete]);

  return (
    <AnimatePresence>
      {step !== 'reveal' && (
        <motion.div
          key="splash-overlay"
          initial={{ opacity: 1 }}
          exit={{
            clipPath: 'circle(160% at 50% 50%)',
            opacity: 0,
            transition: { duration: 0.45, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-[99999999] flex items-center justify-center bg-blue-600 dark:bg-zinc-950 select-none overflow-hidden overscroll-none touch-none"
          style={{
            clipPath: step === 'reveal' ? 'circle(160% at 50% 50%)' : 'circle(100% at 50% 50%)',
          }}
        >
          {/* FASE 1: LOGO ICON */}
          {step === 'icon' && (
            <motion.div
              key="icon"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex items-center justify-center p-4"
            >
              <img
                src="/logombud.png"
                alt="myMbud Logo"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xl brightness-0 invert"
              />
            </motion.div>
          )}

          {/* FASE 2: WORDMARK TEKS & COPYRIGHT */}
          {step === 'wordmark' && (
            <motion.div
              key="wordmark"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="text-center px-4 space-y-1"
            >
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase">
                myMbud <span className="font-light opacity-80">Portal</span>
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-blue-100 dark:text-zinc-400 tracking-wider">
                Ruang Digital Mahasiswa
              </p>
            </motion.div>
          )}

          {/* FASE 3: TITIK PUTIH SEBELUM MELEDAK / EXPAND */}
          {step === 'dot' && (
            <motion.div
              key="dot"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 45, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
              className="w-3.5 h-3.5 rounded-full bg-white shadow-2xl"
            />
          )}

          {/* WATERMARK INTEGRATED DI BAWAH */}
          <div className="absolute bottom-10 sm:bottom-12 flex flex-col items-center gap-1 opacity-70">
            <img
              src="/myits-logo.svg"
              alt="myITS Logo"
              className="h-3.5 w-auto object-contain brightness-0 invert opacity-90"
            />
            <span className="text-[9px] uppercase tracking-widest text-white/80 font-medium">
              Integrated
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};