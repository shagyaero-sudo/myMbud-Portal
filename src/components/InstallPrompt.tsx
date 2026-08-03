import React, { useState, useEffect } from 'react';

export const InstallPrompt: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Cek apakah aplikasi sudah diinstal (sedang dibuka di mode PWA)
    const isAppMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone;
    
    setIsStandalone(isAppMode);

    // Kalau sudah diinstal, tidak perlu memunculkan banner
    if (isAppMode) return;

    // 2. Deteksi apakah pengguna memakai iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Tunda muncul banner 2 detik agar web loading dulu
      setTimeout(() => setIsVisible(true), 2000);
    }

    // 3. Deteksi event instalasi bawaan untuk Android (Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Mencegah Chrome memunculkan pop-up default secara langsung
      e.preventDefault();
      // Simpan event-nya agar bisa dipicu lewat tombol khusus kita
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Tampilkan pop-up instalasi bawaan Android
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isVisible || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-bounce">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-4">
        
        {/* Icon / Logo Aplikasi */}
        <div className="w-12 h-12 flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
          <img src="/logombud.png" alt="Logo" className="w-8 h-8 object-contain" />
        </div>

        {/* Konten Text & Tombol */}
        <div className="flex-1">
          <h4 className="text-slate-900 dark:text-white font-bold text-sm">
            Install myMbud Portal
          </h4>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
            {isIOS ? (
              <>
                Tap tombol <span className="font-bold text-blue-500">Share</span> di menu bawah, lalu pilih <span className="font-bold">"Add to Home Screen"</span> untuk pengalaman terbaik.
              </>
            ) : (
              "Install portal ini di HP-mu untuk akses jadwal yang lebih cepat tanpa browser!"
            )}
          </p>

          <div className="mt-3 flex gap-2">
            {!isIOS && (
              <button
                onClick={handleInstallClick}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Install
              </button>
            )}
            <button
              onClick={() => setIsVisible(false)}
              className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Nanti
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};