import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  FolderKanban,
  FileText,
  Megaphone,
  Bell,
  BookOpen,
  Sun,
  Moon,
  ChevronLeft,
  Check,
  BellRing,
} from 'lucide-react';
import { initOneSignal, requestOneSignalPermission } from '../services/oneSignal';
import { ThemeMode, ThemeAccent } from './Header';

interface OnboardingScreenProps {
  userName: string;
  onComplete: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 350, damping: 30 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.2 },
  }),
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  userName,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>('blue');
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  const accentOptions = [
    { id: 'blue' as ThemeAccent, color: '#0284C7', label: 'Blue' },
    { id: 'purple' as ThemeAccent, color: '#7C3AED', label: 'Purple' },
    { id: 'pink' as ThemeAccent, color: '#DB2777', label: 'Pink' },
    { id: 'orange' as ThemeAccent, color: '#EA580C', label: 'Orange' },
    { id: 'green' as ThemeAccent, color: '#16A34A', label: 'Green' },
  ];

  useEffect(() => {
    const savedMode = (localStorage.getItem('mymbud_theme_mode') as ThemeMode) || 'dark';
    const savedAccent = (localStorage.getItem('mymbud_theme_accent') as ThemeAccent) || 'blue';
    setThemeMode(savedMode);
    setThemeAccent(savedAccent);
  }, []);

  const handleApplyTheme = (mode: ThemeMode, accent: ThemeAccent) => {
    setThemeMode(mode);
    setThemeAccent(accent);
    localStorage.setItem('mymbud_theme_mode', mode);
    localStorage.setItem('mymbud_theme_accent', accent);

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-mode', mode);
      document.documentElement.setAttribute('data-accent', accent);
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const nextStep = () => {
    setDirection(1);
    setStep((prev) => Math.min(5, prev + 1));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handlePushActivation = async () => {
    setIsEnablingPush(true);
    try {
      await initOneSignal();
      await requestOneSignalPermission();
    } catch (err) {
      console.warn('[Onboarding] Push error:', err);
    } finally {
      setIsEnablingPush(false);
      nextStep();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('mymbud_onboarded', 'true');
    onComplete();
  };

  const featuresList = [
    { label: 'Jadwal Kuliah', icon: CalendarDays, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Manajemen Tugas', icon: FolderKanban, color: 'text-rose-500 bg-rose-500/10' },
    { label: 'Bank Materi PDF', icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Info Kelas', icon: Megaphone, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Notifikasi In-App', icon: Bell, color: 'text-indigo-500 bg-indigo-500/10' },
    { label: 'Mbudiary', icon: BookOpen, color: 'text-fuchsia-500 bg-fuchsia-500/10' },
  ];

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      <div className="relative w-full max-w-md bg-white/95 dark:bg-zinc-900/90 border border-white/60 dark:border-white/10 rounded-[36px] shadow-2xl p-7 sm:p-9 min-h-[580px] flex flex-col justify-between overflow-hidden">
        
        {/* Navigation Back */}
        <div className="h-8 flex items-center justify-between shrink-0">
          {step > 1 && step < 5 ? (
            <button
              onClick={prevStep}
              className="p-1.5 -ml-2 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-1.5 items-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-6 bg-blue-600 dark:bg-blue-500'
                    : 'w-1.5 bg-slate-200 dark:bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Slides */}
        <div className="flex-1 flex flex-col justify-center my-auto overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            
            {/* SCREEN 1: WELCOME */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6 text-center py-4"
              >
                <div className="mx-auto w-24 h-24 flex items-center justify-center">
                  <img
                    src="/logombud.png"
                    alt="myMbud Logo"
                    className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 block">
                    Halo, {userName.split(' ')[0]}!
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Selamat datang di myMbud.
                  </h1>
                  <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                    Ruang digital khusus untuk menemani perjalanan akademikmu di Kelas A.
                  </p>
                </div>
              </motion.div>
            )}

            {/* SCREEN 2: WHAT IS MYMBUD? */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5 text-center py-2"
              >
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Semua kebutuhanmu, <br /> ada di satu tempat.
                  </h2>
                  <p className="text-xs font-normal text-slate-500 dark:text-zinc-400">
                    Tidak perlu lagi mencari informasi dari berbagai tempat.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 text-left">
                  {featuresList.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 + 0.1 }}
                        className="p-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-200/50 dark:border-white/5 flex items-center gap-2.5 shadow-xs"
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-tight">
                          {item.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* SCREEN 3: MAKE IT YOURS */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5 py-2 text-left"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Mari siapkan myMbud untukmu.
                  </h2>
                  <p className="text-xs font-normal text-slate-500 dark:text-zinc-400">
                    Pilih preferensi tema visual yang paling nyaman di matamu.
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Mode Tampilan
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyTheme('light', themeAccent)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          themeMode === 'light'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        <span>Light Mode</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyTheme('dark', themeAccent)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          themeMode === 'dark'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400'
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        <span>Dark Mode</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Warna Favoritmu
                    </span>
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-200/50 dark:border-zinc-800">
                      {accentOptions.map((item) => {
                        const isSelected = themeAccent === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleApplyTheme(themeMode, item.id)}
                            style={{ backgroundColor: item.color }}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-xs cursor-pointer relative"
                            title={item.label}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN 4: STAY IN THE LOOP */}
            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5 py-2 text-center"
              >
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Jangan sampai ketinggalan.
                  </h2>
                  <p className="text-xs font-normal text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    myMbud dapat memberitahumu ketika ada pengumuman mendesak atau tugas baru.
                  </p>
                </div>

                <motion.div
                  initial={{ scale: 0.9, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  className="p-4 rounded-3xl bg-white/80 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-white/10 shadow-lg text-left space-y-2 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                        <Bell className="w-3 h-3" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        myMbud
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">Baru saja</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Pengumuman baru telah diposting!
                    </h3>
                    <p className="text-[11px] font-normal text-slate-500 dark:text-zinc-400 leading-snug mt-0.5">
                      "Info perubahan jadwal kuliah hari ini..."
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* SCREEN 5: READY */}
            {step === 5 && (
              <motion.div
                key="step5"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6 text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="mx-auto w-20 h-20 rounded-full bg-[#34C759] text-white flex items-center justify-center shadow-lg shadow-[#34C759]/30"
                >
                  <Check className="w-10 h-10 stroke-[2.8]" />
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    myMbud siap digunakan.
                  </h2>
                  <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-zinc-400">
                    Siap eksplorasi dan bertumbuh di Kelas A?
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Footer Button */}
        <div className="pt-4 shrink-0">
          {step === 4 ? (
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePushActivation}
              disabled={isEnablingPush}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <BellRing className="w-4 h-4" />
              <span>{isEnablingPush ? 'Mengaktifkan...' : 'Aktifkan Notifikasi'}</span>
            </motion.button>
          ) : step === 5 ? (
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              Siap, Mari Mulai
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={nextStep}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              Lanjutkan
            </motion.button>
          )}
        </div>

      </div>
    </div>
  );
};