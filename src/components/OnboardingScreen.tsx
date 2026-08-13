import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  CheckCircle2,
  Blocks,
  MessageSquareText,
  FileText,
  BellRing,
  ArrowRight
} from 'lucide-react';
import { initOneSignal } from '../services/oneSignal';

interface OnboardingScreenProps {
  userName: string;
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  userName,
  onComplete,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: `Selamat Datang, ${userName}! ✨`,
      desc: 'myMbud Portal siap menemani perjalanan akademik kamu! Sudah siap memulai petualangan?',
      isLogo: true, // Menggunakan /logombud.png
      gradient: 'from-indigo-400 via-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/60',
      glow: 'bg-blue-500/30',
      elements: ['bg-indigo-500/30', 'bg-blue-600/30']
    },
    {
      id: 2,
      title: '#AllInOne!',
      desc: 'Hal yang kamu butuhkan selama perkuliahan ada di myMbud Portal, say goodbye to myITS karena di myMbud sudah terintegrasi!',
      icon: CalendarDays,
      gradient: 'from-cyan-400 to-blue-600',
      shadow: 'shadow-cyan-500/50',
      glow: 'bg-cyan-600/20',
      elements: ['bg-cyan-500/20', 'bg-blue-600/20']
    },
    {
      id: 3,
      title: 'Tracker Tugas #AntiDeadliner!',
      desc: 'Kelewat tugas? No Way! sekarang kamu bisa memantau tugas secara real-time dan nandain #SELESAI. Tugas Beres, No Overthinking!',
      icon: CheckCircle2,
      gradient: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-500/50',
      glow: 'bg-emerald-500/20',
      elements: ['bg-emerald-400/20', 'bg-teal-500/20']
    },
    {
      id: 4,
      title: 'Menu dan Tools Sakti!',
      desc: 'Mulai dari bikin surat turlap otomatis, ngitung prediksi Nilai matkul dan IP Semester, Spinwheel buat nentuin kelompok, sampai main minigame seru.',
      icon: Blocks,
      gradient: 'from-fuchsia-500 to-purple-600',
      shadow: 'shadow-purple-500/50',
      glow: 'bg-purple-600/20',
      elements: ['bg-fuchsia-500/20', 'bg-purple-600/20']
    },
    {
      id: 5,
      title: 'Chat Dosen? Anti Ribet & Belibet!',
      desc: 'Udah ga perlu lagi minta-minta temen nomer WA Dosen karena di myMbud ada solusinya, tinggal pakai fitur template biar chat ke Dosen rapi dan sopan.',
      icon: MessageSquareText,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-500/50',
      glow: 'bg-amber-500/20',
      elements: ['bg-amber-400/20', 'bg-orange-500/20']
    },
    {
      id: 6,
      title: 'Bank Materi PDF Terintegrasi',
      desc: 'H-1 Kuis/ETS/EAS belum belajar? Tinggal Buka, baca, beres! Akses arsip PPT dan materi kuliah langsung di myMbud tanpa perlu download.',
      icon: FileText,
      gradient: 'from-green-400 to-emerald-600',
      shadow: 'shadow-green-500/50',
      glow: 'bg-green-600/20',
      elements: ['bg-green-400/20', 'bg-emerald-600/20']
    },
    {
      id: 7,
      title: 'Jangan Ketinggalan Info!',
      desc: 'Dapatkan notifikasi real-time tentang tugas dan info penting lainya di HP-mu meskipun myMbud sedang tidak dibuka.',
      icon: BellRing,
      gradient: 'from-rose-400 to-red-600',
      shadow: 'shadow-rose-500/50',
      glow: 'bg-rose-600/20',
      elements: ['bg-rose-400/20', 'bg-red-600/20']
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    localStorage.setItem('mymbud_onboarded', 'true');

    try {
      await initOneSignal();

      if (typeof window !== 'undefined' && (window as any).OneSignal) {
        await (window as any).OneSignal.Notifications.requestPermission();
      } else if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (err) {
      console.error('Gagal meminta izin notifikasi:', err);
    } finally {
      onComplete();
    }
  };

  const current = slides[currentSlide];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0a0a0a] text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* --- BACKGROUND GLOW MESH --- */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          <div className={`absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[100px] ${current.elements[0]} mix-blend-screen opacity-60 animate-pulse`} />
          <div className={`absolute top-[40%] -right-[20%] w-[80vw] h-[80vw] rounded-full blur-[120px] ${current.elements[1]} mix-blend-screen opacity-50`} />
        </motion.div>
      </AnimatePresence>

      {/* --- HEADER (SKIP BUTTON) --- */}
      <div className="relative z-20 flex justify-end p-6 sm:p-8">
        {currentSlide < slides.length - 1 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={finishOnboarding}
            className="text-xs font-bold tracking-widest text-slate-400 hover:text-white uppercase transition-colors px-4 py-2 rounded-full border border-white/5 hover:bg-white/10 backdrop-blur-md cursor-pointer"
          >
            Skip
          </motion.button>
        )}
      </div>

      {/* --- MAIN CONTENT (ILLUSTRATION & TEXT) --- */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 sm:px-12 w-full max-w-md mx-auto -mt-10">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full flex flex-col items-center text-center space-y-10"
          >
            {/* ABSTRACT 3D-LIKE GLASS CARD VISUAL */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Floating Decorative Elements */}
              <motion.div
                animate={{ y: [-10, 10, -10], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute top-0 right-10 w-16 h-16 rounded-2xl bg-gradient-to-tr ${current.gradient} opacity-40 blur-xl`}
              />
              <motion.div
                animate={{ y: [10, -10, 10], rotate: [0, -10, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-4 left-4 w-20 h-20 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm z-20"
              />

              {/* Main Glass Centerpiece */}
              <motion.div
                whileHover={{ scale: 1.05, rotateY: 10, rotateX: -10 }}
                className={`relative z-10 w-48 h-48 sm:w-56 sm:h-56 rounded-[2rem] bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl ${current.shadow} flex items-center justify-center transform perspective-1000 p-6`}
              >
                {/* Inner Glow */}
                <div className={`absolute inset-0 rounded-[2rem] ${current.glow} blur-2xl opacity-60`} />
                
                {current.isLogo ? (
                  <motion.img
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    src="/logombud.png"
                    alt="myMbud Logo"
                    className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10"
                  />
                ) : (
                  Icon && <Icon className="w-24 h-24 sm:w-28 sm:h-28 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] z-10" />
                )}
              </motion.div>
            </div>

            {/* TYPOGRAPHY */}
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                {current.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-sm mx-auto">
                {current.desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>

      {/* --- FOOTER (PAGINATION & BUTTON) --- */}
      <div className="relative z-20 px-6 pb-12 sm:pb-16 w-full max-w-md mx-auto flex flex-col items-center gap-8">
        
        {/* Dot Indicators */}
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <motion.div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? `w-6 bg-gradient-to-r ${current.gradient}` : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold text-white shadow-xl cursor-pointer ${
            currentSlide === slides.length - 1 
              ? `bg-gradient-to-r ${current.gradient} ${current.shadow}` 
              : 'bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/15'
          } transition-all`}
        >
          {currentSlide === slides.length - 1 ? (
            <>
              <span>Aktifkan Notifikasi & Masuk</span>
              <BellRing className="w-4 h-4 animate-bounce" />
            </>
          ) : (
            <>
              <span>Lanjut</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>

    </div>
  );
};