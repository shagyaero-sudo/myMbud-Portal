import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Sparkles } from 'lucide-react';

export const SoftForceModal: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [hasInstalled, setHasInstalled] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const userAgent = (window.navigator.userAgent || '').toLowerCase();
    const platform = (window.navigator.platform || '').toLowerCase();
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    const checkIsMobile = () => {
      const isAndroidUA = /android|samsungbrowser/i.test(userAgent);
      const isAndroidPlatform = /linux arm|android/i.test(platform);
      const isLinuxTouchTablet = /linux/i.test(platform) && maxTouchPoints > 1 && !/windows|macintosh/i.test(userAgent);
      const isAndroidReal = isAndroidUA || isAndroidPlatform || isLinuxTouchTablet;

      const isIOSReal = /iphone|ipod/.test(userAgent);
      const isIPad = /ipad/.test(userAgent) || (platform === 'macintel' && maxTouchPoints > 1 && !(window as any).MSStream);

      const isRealMobileOrTablet = isAndroidReal || isIOSReal || isIPad;

      setIsMobileDevice(isRealMobileOrTablet);
      setIsIOS(isIOSReal || isIPad);
    };

    checkIsMobile();

    const isAppMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    setIsStandalone(isAppMode);

    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (platform === 'macintel' && maxTouchPoints > 1 && !(window as any).MSStream);

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
      }, 150); 
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
    } else {
      // Fallback jika browser membatasi direct prompt otomatis
      setInstallStatus('installing');
    }
  };

  const handleResetInstall = () => {
    localStorage.removeItem('mymbud_pwa_installed');
    setHasInstalled(false);
  };

  if (!isMobileDevice || isStandalone) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999999] bg-black/98 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6 my-auto relative z-10"
        >
          <div className="mx-auto w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center p-3 border border-blue-500/30">
            <img src="/logombud.png" alt="myMbud Logo" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Install myMbud Portal
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Untuk mengakses jadwal kuliah, tugas, dan fitur portal di HP/Tablet, kamu wajib menginstal aplikasi ini ke Home Screen terlebih dulu.
            </p>
          </div>

          {hasInstalled ? (
            <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-5 text-center space-y-3">
              <div className="w-14 h-14 bg-red-900/50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-300 font-bold text-sm uppercase tracking-wide">
                  Akses Browser Ditolak
                </h3>
                <p className="text-xs text-red-400 mt-2 leading-relaxed">
                  Portal ini terdeteksi sudah terpasang di perangkatmu. <strong className="font-bold underline">Tutup browser ini</strong> dan buka <strong className="font-bold text-white">myMbud</strong> langsung melalui ikon di <strong className="font-bold text-white">Home Screen</strong>.
                </p>
              </div>

              <button
                onClick={handleResetInstall}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 underline pt-2 block mx-auto font-medium cursor-pointer"
              >
                Belum terinstal / Ingin coba install lagi?
              </button>
            </div>
          ) : isIOS ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-left space-y-3">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider text-center">
                Cara Install di iPhone / iPad:
              </p>
              
              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex items-center gap-3 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Tap tombol <strong className="text-blue-400">Share (Bagikan)</strong> <span className="inline-block px-1.5 py-0.5 bg-zinc-800 rounded text-[10px]">⎋ / ⇧</span> di menu Safari.</span>
                </div>

                <div className="flex items-center gap-3 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Pilih opsi <strong className="text-white">"Add to Home Screen"</strong> <span className="inline-block px-1.5 py-0.5 bg-zinc-800 rounded text-[10px]">➕</span>.</span>
                </div>

                <div className="flex items-center gap-3 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Klik <strong className="text-blue-400">"Add"</strong>. Buka aplikasi dari Home Screen!</span>
                </div>
              </div>
            </div>
          ) : installStatus === 'installing' ? (
            <div className="bg-blue-950/20 border border-blue-900/40 rounded-2xl p-5 text-center space-y-4">
               <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                 <span>Mengunduh & Memasang...</span>
                 <span className="font-mono text-sm">{progress}%</span>
               </div>

               <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5">
                 <motion.div 
                   className="bg-blue-500 h-full rounded-full"
                   animate={{ width: `${progress}%` }}
                   transition={{ ease: "easeInOut" }}
                 />
               </div>

               <p className="text-[12px] text-blue-300 leading-relaxed">
                 Mohon tunggu hingga loading selesai...
               </p>
            </div>
          ) : installStatus === 'success' ? (
            <div className="bg-emerald-950/20 border border-emerald-800 rounded-2xl p-5 text-center space-y-3">
               <div className="w-14 h-14 bg-emerald-900/50 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
                 <Sparkles className="w-7 h-7 text-emerald-400" />
               </div>
               <div>
                 <h3 className="text-emerald-400 font-bold text-sm">Instalasi Berhasil!</h3>
                 <p className="text-xs text-emerald-300 mt-1.5 leading-relaxed">
                   Silakan <strong className="font-bold text-white">tutup browser ini</strong> dan buka aplikasi <strong className="font-bold text-white">myMbud</strong> dari Layar Utama (Home Screen).
                 </p>
               </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInstallAndroid}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install Aplikasi Sekarang</span>
              </motion.button>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-left space-y-2">
                <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider text-center">
                  Atau jika tombol tidak merespons:
                </p>
                <div className="space-y-1.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2 bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                    <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                    <span>Buka menu browser <strong>Titik Tiga (⋮)</strong> di kanan atas.</span>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                    <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                    <span>Pilih <strong>"Install app"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};