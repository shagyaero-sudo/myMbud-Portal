import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { STUDENTS_DATA } from '../data/studentsData';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [nrp, setNrp] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi Prefix NRP (Harus diawali 5033251 dan total 10 digit)
    if (!nrp.startsWith('5033251') || nrp.length !== 10) {
      setError(true);
      setPin('');
      return;
    }

    // 2. Ambil 3 digit suffix NRP
    const suffix = nrp.slice(-3);
    const student = STUDENTS_DATA[suffix];

    // 3. Cocokkan dengan data mahasiswa dan PIN
    if (student && student.pin === pin) {
      setError(false);
      setIsLoading(true);

      try {
        await supabase.from('revoked_sessions').delete().eq('id', nrp);
      } catch (err) {
        console.error('Gagal membersihkan revoked session:', err);
      }

      localStorage.setItem('mymbud_auth', 'true');
      localStorage.setItem('mymbud_user_name', student.name);
      localStorage.setItem('mymbud_user_nrp', nrp);

      setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);

        setTimeout(() => {
          onLoginSuccess();
        }, 900);
      }, 850);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] flex flex-col lg:flex-row font-sans selection:bg-blue-500 selection:text-white">
      
      {/* BAGIAN KIRI / ATAS: GAMBAR SCRAPBOOK (Proporsi Asli) */}
      <div className="w-full lg:w-1/2 h-[58vh] lg:h-screen bg-white relative flex items-center justify-end overflow-hidden">
        <motion.img 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          src="/collase.png" 
          alt="Kolase Kelas A" 
          className="absolute inset-0 w-full h-full object-cover object-right"
        />
      </div>

      {/* BAGIAN KANAN / BAWAH: FORM LOGIN */}
      <div className="w-full lg:w-1/2 flex-1 flex flex-col justify-center bg-white dark:bg-[#09090b] rounded-t-[2.5rem] lg:rounded-none -mt-10 lg:mt-0 relative z-20 px-6 py-8 sm:px-12 lg:px-24 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] lg:shadow-none">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm mx-auto"
        >
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 shrink-0">
              <img 
                src="/logombud.png" 
                alt="myMbud Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              myMbud Portal
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-1 tracking-tight">
            Selamat Datang
          </h1>
          <p className="text-xs sm:text-[13px] font-normal text-slate-500 dark:text-zinc-400 mb-6">
            Masukkan NRP dan PIN untuk masuk ke akunmu
          </p>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              /* PANEL KONFIRMASI LOGIN BERHASIL */
              <motion.div
                key="success-panel"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                className="p-6 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 text-center space-y-3 shadow-xs"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Login Berhasil
                  </h3>
                </div>
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-zinc-400 pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  <span>Redirecting...</span>
                </div>
              </motion.div>
            ) : (
              /* FORM INPUT LOGIN */
              <motion.form 
                key="login-form"
                onSubmit={handleLogin} 
                className="space-y-3.5"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Input NRP */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                    NRP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    disabled={isLoading}
                    value={nrp}
                    onChange={(e) => setNrp(e.target.value.replace(/\D/g, ''))}
                    placeholder="5033251xxx"
                    className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-zinc-900/60 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400/60 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-zinc-700 transition-all border-none disabled:opacity-50"
                  />
                </div>

                {/* Input PIN */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                    PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    disabled={isLoading}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-4 py-3 rounded-2xl text-base sm:text-lg tracking-[0.3em] font-bold bg-slate-100 dark:bg-zinc-900/60 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400/60 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-zinc-700 transition-all border-none disabled:opacity-50"
                  />
                </div>

                {error && (
                  <p className="text-[11px] font-bold text-rose-500 pt-0.5">
                    NRP atau PIN tidak cocok.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={nrp.length !== 10 || pin.length !== 4 || isLoading}
                  className="w-full py-3.5 mt-2 rounded-2xl bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white disabled:bg-slate-200 disabled:dark:bg-zinc-800 disabled:text-slate-400 disabled:dark:text-zinc-500 text-white dark:text-slate-900 text-xs sm:text-sm font-bold transition-all active:scale-[0.98] cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <span>Masuk</span>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {!isSuccess && (
            <div className="mt-5 text-center">
              <a 
                href="https://wa.me/6285182284769?text=Halo%20Aero,%20aku%20butuh%20bantuan%20akses%20login%20myMbud%20Portal" 
                target="_blank" 
                rel="noreferrer"
                className="text-[11px] font-normal text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors"
              >
                Bantuan?
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};