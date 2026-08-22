import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  FolderKanban,
  FileText,
  Megaphone,
  Bell,
  BookOpen,
  Sparkles,
  Sun,
  Moon,
  Check,
  BellRing,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import { initOneSignal, requestOneSignalPermission } from '../services/oneSignal';
import { ThemeMode, ThemeAccent } from './Header';

interface OnboardingScreenProps {
  userName: string;
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  userName,
  onComplete,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Personalisasi Theme State (Screen 3)
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

  // Inisialisasi Audio Backsound
  useEffect(() => {
    const audio = new Audio('/backsound.mp3');
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch((error) => {
        console.log('Autoplay fallback:', error);
      });
    }

    const savedMode = (localStorage.getItem('mymbud_theme_mode') as ThemeMode) || 'dark';
    const savedAccent = (localStorage.getItem('mymbud_theme_accent') as ThemeAccent) || 'blue';
    setThemeMode(savedMode);
    setThemeAccent(savedAccent);

    return () => {
      audio.pause();
      audioRef.current = null;
    };
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

  const slidesConfig = [
    {
      id: 1,
      gradient: 'from-indigo-400 via-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/50',
      glow: 'bg-blue-500/30',
      elements: ['bg-indigo-500/30', 'bg-blue-600/30'],
    },
    {
      id: 2,
      gradient: 'from-cyan-400 to-blue-600',
      shadow: 'shadow-cyan-500/50',
      glow: 'bg-cyan-600/20',
      elements: ['bg-cyan-500/20', 'bg-blue-600/20'],
    },
    {
      id: 3,
      gradient: 'from-fuchsia-500 via-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/50',
      glow: 'bg-purple-600/20',
      elements: ['bg-fuchsia-500/20', 'bg-purple-600/20'],
    },
    {
      id: 4,
      gradient: 'from-rose-400 to-red-600',
      shadow: 'shadow-rose-500/50',
      glow: 'bg-rose-600/20',
      elements: ['bg-rose-400/20', 'bg-red-600/20'],
    },
    {
      id: 5,
      gradient: 'from-emerald-400 via-teal-500 to-blue-500',
      shadow: 'shadow-emerald-500/50',
      glow: 'bg-emerald-500/25',
      elements: ['bg-emerald-400/20', 'bg-teal-600/20'],
    },
  ];

  const currentTheme = slidesConfig[currentSlide];

  const handleNext = () => {
    if (currentSlide < 4) {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleNotificationActivation = async () => {
    setIsEnablingPush(true);
    try {
      await initOneSignal();
      await requestOneSignalPermission();
    } catch (err) {
      console.warn('[Onboarding] Error push notif:', err);
    } finally {
      setIsEnablingPush(false);
      handleNext();
    }
  };

  const finishOnboarding = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    localStorage.setItem('mymbud_onboarded', 'true');
    localStorage.setItem('mymbud_onboarding_completed_v2', 'true');
    onComplete();
  };

  const featuresList = [
    { label: 'Jadwal Kuliah', icon: CalendarDays, color: 'text-blue-400 bg-blue-500/20' },
    { label: 'Tracker Tugas', icon: FolderKanban, color: 'text-rose-400 bg-rose-500/20' },
    { label: 'Bank Materi PDF', icon: FileText, color: 'text-amber-400 bg-amber-500/20' },
    { label: 'Pengumuman Kelas', icon: Megaphone, color: 'text-emerald-400 bg-emerald-500/20' },
    { label: 'Notifikasi Realtime', icon: Bell, color: 'text-indigo-400 bg-indigo-500/20' },
    { label: 'Catatan Mbudiary', icon: BookOpen, color: 'text-fuchsia-400 bg-fuchsia-500/20' },
  ];

  return (
    <div className="fixed inset-0 min-h-[100dvh] w-screen z-[99999] bg-[#0a0a0a] text-slate-100 flex flex-col justify-between items-center font-sans overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] select-none">
      
      {/* --- BACKGROUND GLOW MESH --- */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentTheme.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 overflow-hidden pointer-events-none -z-10"
        >
          <div className={`absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[100px] ${currentTheme.elements[0]} mix-blend-screen opacity-60 animate-pulse`} />
          <div className={`absolute top-[40%] -right-[20%] w-[80vw] h-[80vw] rounded-full blur-[120px] ${currentTheme.elements[1]} mix-blend-screen opacity-50`} />
        </motion.div>
      </AnimatePresence>

      {/* --- TOP BACK BUTTON --- */}
      <div className="w-full max-w-md h-8 flex items-center justify-between shrink-0">
        {currentSlide > 0 && currentSlide < 4 ? (
          <button
            onClick={handlePrev}
            className="p-1.5 -ml-2 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* --- MAIN INTERACTIVE CONTAINER --- */}
      <div className="relative z-10 my-auto py-4 w-full max-w-md flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: WELCOME */}
          {currentSlide === 0 && (
            <motion.div
              key="slide-1"
              initial={{ opacity: 0, x: direction > 0 ? 30 : -30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: direction > 0 ? -30 : 30, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full flex flex-col items-center text-center space-y-5"
            >
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
                <motion.div
                  animate={{ y: [-8, 8, -8], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className={`absolute top-0 right-4 w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentTheme.gradient} opacity-40 blur-xl pointer-events-none`}
                />
                <motion.div
                  whileHover={{ scale: 1.04, rotateY: 8, rotateX: -8 }}
                  className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-[2rem] bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl ${currentTheme.shadow} flex items-center justify-center p-5`}
                >
                  <div className={`absolute inset-0 rounded-[2rem] ${currentTheme.glow} blur-2xl opacity-60 pointer-events-none`} />
                  <img
                    src="/logombud.png"
                    alt="myMbud Logo"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10"
                  />
                </motion.div>
              </div>

              <div className="space-y-2 px-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400 block">
                  Hello, {userName.split(' ')[0]}!
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  Selamat datang di myMbud.
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs sm:max-w-sm mx-auto">
                  Ruang digital yang dibuat khusus untuk menemani perjalanan akademikmu di Kelas A.
                </p>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: WHAT IS MYMBUD? */}
          {currentSlide === 1 && (
            <motion.div
              key="slide-2"
              initial={{ opacity: 0, x: direction > 0 ? 30 : -30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: direction > 0 ? -30 : 30, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full flex flex-col items-center text-center space-y-4"
            >
              <div className="space-y-1.5 px-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                  Semua yang kamu butuhkan, <br /> ada di satu tempat.
                </h2>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Tidak perlu lagi mencari informasi dari satu tempat ke tempat lain.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 w-full pt-2 text-left">
                {featuresList.map((item, idx) => {
                  const FIcon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 + 0.1 }}
                      className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg flex items-center gap-2.5"
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                        <FIcon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 leading-tight">
                        {item.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: MAKE IT YOURS */}
          {currentSlide === 2 && (
            <motion.div
              key="slide-3"
              initial={{ opacity: 0, x: direction > 0 ? 30 : -30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: direction > 0 ? -30 : 30, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full flex flex-col items-center text-center space-y-4"
            >
              <div className="space-y-1 px-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                  Mari siapkan myMbud untukmu.
                </h2>
                <p className="text-xs text-slate-400">
                  Pilih tampilan dan suasana warna yang paling nyaman untukmu.
                </p>
              </div>

              <div className="w-full space-y-3.5 pt-1 text-left">
                {/* Mode Selector */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Mode Tampilan
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyTheme('light', themeAccent)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        themeMode === 'light'
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-md'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyTheme('dark', themeAccent)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        themeMode === 'dark'
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-md'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                {/* Accent Colors */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Warna Aksen
                  </span>
                  <div className="flex items-center justify-between p-2.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                    {accentOptions.map((item) => {
                      const isSelected = themeAccent === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleApplyTheme(themeMode, item.id)}
                          style={{ backgroundColor: item.color }}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-md cursor-pointer relative"
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
          {currentSlide === 3 && (
            <motion.div
              key="slide-4"
              initial={{ opacity: 0, x: direction > 0 ? 30 : -30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: direction > 0 ? -30 : 30, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full flex flex-col items-center text-center space-y-5"
            >
              <div className="space-y-1.5 px-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                  Jangan sampai ketinggalan.
                </h2>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  myMbud dapat memberitahumu saat ada pengumuman mendesak atau tugas baru dari kelasmu.
                </p>
              </div>

              {/* Mockup Notifikasi iOS Glass Card */}
              <motion.div
                initial={{ scale: 0.9, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full p-4 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/15 shadow-xl text-left space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                      <Bell className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      myMbud
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Baru saja</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Pengumuman baru telah diposting.
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                    "Info perkuliahan besok dan update materi presentasi kelompok..."
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* SCREEN 5: YOUR SPACE IS READY */}
          {currentSlide === 4 && (
            <motion.div
              key="slide-5"
              initial={{ opacity: 0, x: direction > 0 ? 30 : -30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: direction > 0 ? -30 : 30, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full flex flex-col items-center text-center space-y-5"
            >
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  className={`absolute inset-4 rounded-full ${currentTheme.glow} blur-2xl opacity-60 pointer-events-none`}
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-[2rem] bg-gradient-to-tr from-blue-600/40 via-teal-500/30 to-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl ${currentTheme.shadow} flex items-center justify-center p-5`}
                >
                  <Sparkles className="w-16 h-16 sm:w-20 sm:h-20 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]" />
                </motion.div>
              </div>

              <div className="space-y-2 px-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  myMbud siap digunakan.
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Selamat datang di ruang digital Kelas A.
                </p>
                <p className="text-[11px] font-extrabold tracking-widest uppercase text-emerald-400 pt-1">
                  Satu kelas. Satu ruang.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* --- FOOTER: DOT INDICATOR & ACTION BUTTON --- */}
      <div className="relative z-20 w-full max-w-xs sm:max-w-sm flex flex-col items-center gap-3 shrink-0 pt-2">
        
        {/* Dot Indicators */}
        <div className="flex items-center gap-1.5 mb-1">
          {slidesConfig.map((_, index) => (
            <motion.div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? `w-6 bg-gradient-to-r ${currentTheme.gradient}` : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        {currentSlide === 3 ? (
          <div className="w-full space-y-1.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNotificationActivation}
              disabled={isEnablingPush}
              className={`w-full py-3.5 sm:py-4 rounded-2xl flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold text-white shadow-xl cursor-pointer bg-gradient-to-r ${currentTheme.gradient} ${currentTheme.shadow} transition-all disabled:opacity-50`}
            >
              <BellRing className="w-4 h-4" />
              <span>{isEnablingPush ? 'Mengaktifkan...' : 'Aktifkan Notifikasi'}</span>
            </motion.button>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Nanti saja
            </button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className={`w-full py-3.5 sm:py-4 rounded-2xl flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold text-white shadow-xl cursor-pointer ${
              currentSlide === 4
                ? `bg-gradient-to-r ${currentTheme.gradient} ${currentTheme.shadow}`
                : 'bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/15'
            } transition-all`}
          >
            {currentSlide === 4 ? (
              <span>Mulai Menggunakan myMbud</span>
            ) : (
              <>
                <span>Lanjutkan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        )}
      </div>

    </div>
  );
};