import React, { useState, useEffect } from 'react';

export const SoftForceModal: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Status instalasi: 'idle' | 'installing' | 'success'
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success'>('idle');
  
  // State untuk angka persentase palsu (0 - 100)
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Cek ukuran layar (HP / Tablet)
    const checkScreen = () => {
      setIsMobileOrTablet(window.innerWidth < 1024);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);

    // 2. Cek apakah sudah dibuka dari Home Screen (Standalone Mode)
    const isAppMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isAppMode);

    // 3. Deteksi iOS / iPadOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS
    setIsIOS(isIOSDevice);

    // 4. Tangkap event instalasi Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('resize', checkScreen);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Logika Fake Progress Bar (~22 Detik)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (installStatus === 'installing') {
      setProgress(0);

      // Setiap 200ms menambah persentase secara dinamis
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(interval);
            setInstallStatus('success');
            return 100;
          }

          // Efek realistis: Cepat di awal (0-70%), melambat di akhir (70-99%)
          let increment = 1;
          if (prevProgress < 40) {
            increment = Math.floor(Math.random() * 3) + 2; // +2 sampai +4
          } else if (prevProgress < 75) {
            increment = Math.floor(Math.random() * 2) + 1; // +1 sampai +2
          } else if (prevProgress < 95) {
            increment = Math.random() > 0.5 ? 1 : 0; // Kadang +1, kadang diam sebentar
          } else {
            increment = 1;
          }

          return Math.min(prevProgress + increment, 100);
        });
      }, 200); // 200ms * total increment = ~20-22 detik
    }

    return () => clearInterval(interval);
  }, [installStatus]);

  const handleInstallAndroid = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        // Pemicu dimulainya animasi fake progress
        setInstallStatus('installing');
      }
    }
  };

  // Jika di Desktop ATAU Aplikasi sudah di-install, Sembunyikan Modal (Lolos Akses)
  if (!isMobileOrTablet || isStandalone) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-fade-in my-auto">
        
        {/* App Logo */}
        <div className="mx-auto w-20 h-20 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center p-3 border border-blue-500/30">
          <img src="/logombud.png" alt="myMbud Logo" className="w-full h-full object-contain" />
        </div>

        {/* Header Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Install myMbud Portal
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
            Untuk mengakses jadwal kuliah, tugas, dan fitur portal di HP/Tablet, kamu wajib menginstal aplikasi ini ke Home Screen terlebih dahulu.
          </p>
        </div>

        {/* Content Pembeda OS & Status */}
        {isIOS ? (
          /* ================= VISUAL GUIDE UNTUK IOS / IPADOS ================= */
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
          /* ================= FAKE PROGRESS BAR STATE (20-22 DETIK) ================= */
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 text-center space-y-4 animate-fade-in">
             <div className="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-400">
               <span>Mengunduh & Memasang...</span>
               <span className="font-mono text-sm">{progress}%</span>
             </div>

             {/* Visual Progress Bar */}
             <div className="w-full bg-blue-200 dark:bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5">
               <div 
                 className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-200 ease-out"
                 style={{ width: `${progress}%` }}
               />
             </div>

             <p className="text-[12px] text-blue-700/80 dark:text-blue-400 leading-relaxed">
               Membuat paket aplikasi WebAPK & melakukan pemindaian keamanan Android...
             </p>
          </div>
        ) : installStatus === 'success' ? (
          /* ================= SUCCESS STATE ANDROID ================= */
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 text-center space-y-3 animate-fade-in">
             <div className="w-14 h-14 bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-2">
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
               </svg>
             </div>
             <div>
               <h3 className="text-green-800 dark:text-green-400 font-bold text-sm">Pemasangan Berhasil!</h3>
               <p className="text-[13px] text-green-700/80 dark:text-green-500 mt-1.5 leading-relaxed">
                 Silakan <strong className="font-bold">tutup browser ini</strong>, kembali ke layar utama HP (Home Screen), dan buka aplikasi <strong className="font-bold">myMbud</strong> dari sana!
               </p>
             </div>
          </div>
        ) : (
          /* ================= ONE-CLICK INSTALL UNTUK ANDROID (IDLE) ================= */
          <div className="space-y-3 pt-2">
            <button
              onClick={handleInstallAndroid}
              disabled={!deferredPrompt}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-200 text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {deferredPrompt ? 'Install Sekarang (One-Click)' : 'Menyiapkan Instalasi...'}
            </button>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              *Jika tombol tidak merespon, buka menu titik tiga Chrome lalu pilih "Install App".
            </p>
          </div>
        )}

      </div>
    </div>
  );
};