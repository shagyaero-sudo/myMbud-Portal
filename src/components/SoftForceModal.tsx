import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SoftForceModal: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [hasInstalled, setHasInstalled] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();

    const checkIsMobile = () => {
      // Deteksi murni Mobile / Tablet OS (Bukan berdasarkan lebar resolusi split-screen di PC)
      const isAndroid = /android/i.test(userAgent);
      const isIOSReal = /iphone|ipod/.test(userAgent);
      const isIPad = /ipad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && !window.MSStream);

      // Hanya aktif jika benar-benar dibuka dari perangkat Android, iPhone, atau iPad
      const isRealMobileOrTablet = isAndroid || isIOSReal || isIPad;

      setIsMobileDevice(isRealMobileOrTablet);
      setIsIOS(isIOSReal || isIPad);
    };

    checkIsMobile();

    const isAppMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isAppMode);

    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && !(window as any).MSStream);

    const savedPWA = localStorage.getItem('mymbud_pwa_installed');
    if (savedPWA === 'true') {
      setHasInstalled(true);
    }

    if (isIOSDevice) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          localStorage.setItem('mymbud_pwa_installed', 'true');
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (installStatus === 'installing') {
      setProgress(0);

      interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(interval);
            setInstallStatus('success');
            localStorage.setItem('mymbud_pwa_installed', 'true');
            return 100;
          }

          let increment = 1;
          if (prevProgress < 40) {
            increment = Math.floor(Math.random() * 3) + 2; 
          } else if (prevProgress < 75) {
            increment = Math.floor(Math.random() * 2) + 1; 
          } else if (prevProgress < 95) {
            increment = Math.random() > 0.5 ? 1 : 0; 
          } else {
            increment = 1;
          }

          return Math.min(prevProgress + increment, 100);
        });
      }, 200); 
    }

    return () => clearInterval(interval);
  }, [installStatus]);

  const handleInstallAndroid = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setInstallStatus('installing');
      }
    }
  };

  const handleResetIOS = () => {
    localStorage.removeItem('mymbud_pwa_installed');
    setHasInstalled(false);
  };

  // Jangan tampilkan jika bukan perangkat mobile sungguhan atau sudah dalam mode standalone
  if (!isMobileDevice || isStandalone) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6 my-auto"
        >
          <div className="mx-auto w-20 h-20 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center p-3 border border-blue-500/30">
            <img src="/logombud.png" alt="myMbud Logo" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Install myMbud Portal
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Untuk mengakses jadwal kuliah, tugas, dan fitur portal di HP/Tablet, kamu wajib menginstal aplikasi ini ke Home Screen terlebih dahulu.
            </p>
          </div>

          {hasInstalled ? (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl p-5 text-center space-y-3">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-900 dark:text-red-300 font-bold text-sm uppercase tracking-wide">
                  Akses Browser Ditolak
                </h3>
                <p className="text-[13px] text-red-700/90 dark:text-red-400 mt-2 leading-relaxed">
                  Portal ini terdeteksi sudah terpasang di HP-mu. <strong className="font-bold underline">Tutup browser ini</strong> dan buka <strong className="font-bold">myMbud</strong> langsung melalui ikon di <strong className="font-bold">Home Screen</strong>.
                </p>
              </div>

              {isIOS && (
                <button
                  onClick={handleResetIOS}
                  className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 underline pt-2 block mx-auto font-medium"
                >
                  Belum terinstal / Ingin tampilkan opsi install lagi?
                </button>
              )}
            </div>
          ) : isIOS ? (
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-left space-y-3">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-center">
                Cara Install di iPhone / iPad:
              </p>
              
              <div className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-300">
                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Tap tombol <strong className="text-blue-500">Share (Bagikan)</strong> <span className="inline-block px-1.5 py-0.5 bg-slate-200 dark:bg-zinc-800 rounded text-[10px]">⎋ / ⇧</span> di menu Safari bawah/atas.</span>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Gulir ke bawah dan pilih opsi <strong className="text-slate-900 dark:text-white">"Add to Home Screen"</strong> <span className="inline-block px-1.5 py-0.5 bg-slate-200 dark:bg-zinc-800 rounded text-[10px]">➕</span>.</span>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Klik <strong className="text-blue-500">"Add"</strong> di pojok kanan atas. Buka aplikasi dari Home Screen-mu!</span>
                </div>
              </div>
            </div>
          ) : installStatus === 'installing' ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 text-center space-y-4">
               <div className="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-400">
                 <span>Mengunduh & Memasang...</span>
                 <span className="font-mono text-sm">{progress}%</span>
               </div>

               <div className="w-full bg-blue-200 dark:bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5">
                 <motion.div 
                   className="bg-blue-600 dark:bg-blue-500 h-full rounded-full"
                   animate={{ width: `${progress}%` }}
                   transition={{ ease: "easeInOut" }}
                 />
               </div>

               <p className="text-[12px] text-blue-700/80 dark:text-blue-400 leading-relaxed">
                 Mohon tunggu hingga loading selesai...
               </p>
            </div>
          ) : installStatus === 'success' ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 text-center space-y-3">
               <div className="w-14 h-14 bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-2">
                 <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                 </svg>
               </div>
               <div>
                 <h3 className="text-green-800 dark:text-green-400 font-bold text-sm">Instalasi Berhasil!</h3>
                 <p className="text-[13px] text-green-700/80 dark:text-green-500 mt-1.5 leading-relaxed">
                   Silakan <strong className="font-bold">tutup browser ini</strong> dan kembali ke layar Home Screen, lalu buka aplikasi <strong className="font-bold">myMbud</strong> dari sana!
                 </p>
               </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInstallAndroid}
                disabled={!deferredPrompt}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {deferredPrompt ? 'Install Sekarang' : 'Menyiapkan Instalasi...'}
              </motion.button>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                *Jika tombol tidak merespon, buka menu titik tiga Chrome lalu pilih "Install App".
              </p>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};