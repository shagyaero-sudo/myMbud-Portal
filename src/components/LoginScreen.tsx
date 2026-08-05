import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [nrp, setNrp] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // LOGIKA DUMMY SEMENTARA (Sesuai NRP & PIN kamu)
    if (nrp === '5033251046' && pin === '2810') {
      setError(false);
      localStorage.setItem('mymbud_auth', 'true');
      localStorage.setItem('mymbud_user_name', 'Aero'); // Simpan nama panggilan
      onLoginSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans selection:bg-blue-500 selection:text-white">
      
      {/* BAGIAN KIRI / ATAS: GAMBAR SCRAPBOOK */}
      <div className="w-full lg:w-1/2 h-[45vh] lg:h-screen relative flex items-center justify-center p-6 lg:p-12 overflow-hidden bg-white/50">
        <motion.img 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          src="/collase.png" 
          alt="Kolase Kelas A" 
          className="relative z-10 w-full max-w-md lg:max-w-xl object-contain drop-shadow-2xl"
        />
      </div>

      {/* BAGIAN KANAN / BAWAH: FORM LOGIN */}
      <div className="w-full lg:w-1/2 flex-1 flex flex-col justify-center bg-white dark:bg-zinc-950 rounded-t-[2.5rem] lg:rounded-none -mt-8 lg:mt-0 relative z-20 px-6 py-10 sm:px-12 lg:px-24 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] lg:shadow-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm mx-auto"
        >
          {/* Logo & Judul */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 text-blue-600">
              {/* Simple myMbud 'A' Logo SVG */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2L2 22h4l2.5-5h7l2.5 5h4L12 2zm-1.5 11l3-6 3 6h-6z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
              <span className="font-light">my</span>Mbud <span className="font-light">Portal</span>
            </span>
          </div>

          <h1 className="text-3xl font-black text-slate-900 dark:text-zinc-100 mb-2 tracking-tight">
            Selamat Datang!
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-8">
            Masukkan NRP dan PIN untuk masuk
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Input NRP */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400">NRP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={nrp}
                onChange={(e) => setNrp(e.target.value.replace(/\D/g, ''))}
                placeholder="50332510xxx"
                className="w-full px-4 py-3.5 rounded-xl text-sm font-semibold bg-slate-200/60 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-zinc-700 transition-all border-none"
              />
            </div>

            {/* Input PIN */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400">PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-4 py-3.5 rounded-xl text-lg tracking-[0.3em] font-bold bg-slate-200/60 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-zinc-700 transition-all border-none"
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-500 pt-1">
                Kredensial tidak valid, periksa kembali!
              </p>
            )}

            <button
              type="submit"
              disabled={nrp.length !== 10 || pin.length !== 4}
              className="w-full py-4 mt-2 rounded-xl bg-[#222222] hover:bg-black disabled:bg-slate-300 disabled:text-slate-500 text-white text-sm font-bold transition-all active:scale-[0.98]"
            >
              Masuk
            </button>
          </form>

          <div className="mt-5 text-right">
            <a href="#" className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
              Bantuan?
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};