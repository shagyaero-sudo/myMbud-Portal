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
    transition: { type: 'spring', stiffness: 380, damping: 30 },
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

  // Setup Default Pure White Light iOS Mode
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>('blue');
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  const accentOptions = [
    { id: 'blue' as ThemeAccent, color: '#007AFF', label: 'Blue' },
    { id: 'purple' as ThemeAccent, color: '#5856D6', label: 'Purple' },
    { id: 'pink' as ThemeAccent, color: '#FF2D55', label: 'Pink' },
    { id: 'orange' as ThemeAccent, color: '#FF9500', label: 'Orange' },
    { id: 'green' as ThemeAccent, color: '#34C759', label: 'Green' },
  ];

  useEffect(() => {
    // Terapkan default light & blue saat onboarding pertama kali
    handleApplyTheme('light', 'blue');
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
    { label: 'Jadwal Kuliah', icon: CalendarDays, color: 'text-[#007AFF] bg-[#007AFF]/10' },
    { label: 'Manajemen Tugas', icon: FolderKanban, color: 'text-[#FF2D55] bg-[#FF2D55]/10' },
    { label: 'Bank Materi PDF', icon: FileText, color: 'text-[#FF9500] bg-[#FF9500]/10' },
    { label: 'Pengumuman Kelas', icon: Megaphone, color: 'text-[#34C759] bg-[#34C759]/10' },
    { label: 'Notifikasi Realtime', icon: Bell, color: 'text-[#5856D6] bg-[#5856D6]/10' },
    { label: 'Catatan Mbudiary', icon: BookOpen, color: 'text-[#AF52DE] bg-[#AF52DE]/10' },
  ];

  return (
    <div className="fixed inset-0 z-[999999] bg-[#000000]/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans">
      {/* KARTU UTAMA MODAL PUTIH BERSIH */}
      <div className="relative w-full max-w-[420px] bg-[#ffffff] text-[#1c1c1e] rounded-[38px] shadow-[0_25px_60px_rgba(0,0,0,0.35)] p-7 sm:p-8 min-h-[570px] flex flex-col justify-between overflow-hidden border border-[#e5e5ea]/80">
        
        {/* HEADER & STEP INDICATOR */}
        <div className="h-8 flex items-center justify-between shrink-0">
          {step > 1 && step < 5 ? (
            <button
              onClick={prevStep}
              className="p-1 -ml-2 text-[#007AFF] hover:opacity-75 transition-opacity cursor-pointer flex items-center gap-0.5 text-sm font-semibold"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
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
                  s === step ? 'w-5 bg-[#007AFF]' : 'w-1.5 bg-[#e5e5ea]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CONTENT SLIDES */}
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
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#007AFF] block">
                    Hello, {userName.split(' ')[0]}!
                  </span>
                  <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#1c1c1e] leading-tight">
                    Selamat datang di myMbud.
                  </h1>
                  <p className="text-xs sm:text-[13px] text-[#8e8e93] leading-relaxed max-w-xs mx-auto">
                    Ruang digital yang dibuat khusus untuk menemani perjalanan akademikmu di Kelas A.
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
                className="space-y-4 text-center py-2"
              >
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1c1e] leading-snug">
                    Semua yang kamu butuhkan, <br /> ada di satu tempat.
                  </h2>
                  <p className="text-xs text-[#8e8e93]">
                    Tidak perlu lagi mencari informasi dari satu tempat ke tempat lain.
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
                        transition={{ delay: idx * 0.05 + 0.05 }}
                        className="p-3 rounded-2xl bg-[#f2f2f7] flex items-center gap-2.5 border border-[#e5e5ea]/50"
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-semibold text-[#1c1c1e] leading-tight">
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
                className="space-y-4 py-2 text-left"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1c1e]">
                    Mari siapkan myMbud untukmu.
                  </h2>
                  <p className="text-xs text-[#8e8e93]">
                    Pilih tampilan dan warna aksen yang paling kamu sukai.
                  </p>
                </div>

                <div className="space-y-3.5 pt-1">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wider block">
                      Mode Tampilan
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyTheme('light', themeAccent)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          themeMode === 'light'
                            ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] shadow-xs'
                            : 'border-[#e5e5ea] bg-[#f2f2f7] text-[#8e8e93]'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        <span>Terang</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyTheme('dark', themeAccent)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          themeMode === 'dark'
                            ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] shadow-xs'
                            : 'border-[#e5e5ea] bg-[#f2f2f7] text-[#8e8e93]'
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        <span>Gelap</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wider block">
                      Warna Aksen
                    </span>
                    <div className="flex items-center justify-between p-2.5 bg-[#f2f2f7] rounded-2xl border border-[#e5e5ea]/70">
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
                            {isSelected && <Check className="w-4 h-4 text-white stroke-[3.5]" />}
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
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1c1e]">
                    Jangan sampai ketinggalan.
                  </h2>
                  <p className="text-xs text-[#8e8e93] max-w-xs mx-auto leading-relaxed">
                    myMbud dapat memberitahumu secara instan ketika ada pengumuman penting atau tugas baru dari kelas.
                  </p>
                </div>

                {/* iOS NOTIFICATION BANNER MOCKUP */}
                <div className="p-4 rounded-3xl bg-[#f2f2f7] border border-[#e5e5ea] text-left space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-[#007AFF] flex items-center justify-center text-white">
                        <Bell className="w-3 h-3" />
                      </div>
                      <span className="text-[11px] font-bold text-[#1c1c1e] uppercase tracking-wider">
                        myMbud
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8e8e93]">Baru saja</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1c1c1e]">
                      Pengumuman baru telah diposting!
                    </h3>
                    <p className="text-[11px] text-[#636366] leading-snug mt-0.5">
                      "Info perubahan jadwal kuliah dan pembagian kelompok tugas besar..."
                    </p>
                  </div>
                </div>
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
                {/* CENTANG HIJAU BULAT APPLE */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="mx-auto w-20 h-20 rounded-full bg-[#34C759] text-white flex items-center justify-center shadow-lg shadow-[#34C759]/30"
                >
                  <Check className="w-10 h-10 stroke-[3]" />
                </motion.div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#1c1c1e]">
                    myMbud siap digunakan.
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8e8e93]">
                    Selamat datang di ruang digital Kelas A.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM ACTION BUTTON */}
        <div className="pt-4 shrink-0">
          {step === 4 ? (
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePushActivation}
              disabled={isEnablingPush}
              className="w-full py-4 rounded-2xl bg-[#007AFF] hover:bg-[#0071eb] text-white font-bold text-sm shadow-md shadow-[#007AFF]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <BellRing className="w-4 h-4" />
              <span>{isEnablingPush ? 'Mengaktifkan...' : 'Aktifkan Notifikasi'}</span>
            </motion.button>
          ) : step === 5 ? (
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              className="w-full py-4 rounded-2xl bg-[#007AFF] hover:bg-[#0071eb] text-white font-bold text-sm shadow-md shadow-[#007AFF]/25 transition-all cursor-pointer"
            >
              Mulai Menggunakan myMbud
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={nextStep}
              className="w-full py-4 rounded-2xl bg-[#007AFF] hover:bg-[#0071eb] text-white font-bold text-sm shadow-md shadow-[#007AFF]/25 transition-all cursor-pointer"
            >
              Lanjutkan
            </motion.button>
          )}
        </div>

      </div>
    </div>
  );
};