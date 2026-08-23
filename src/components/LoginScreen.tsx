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
  const [modalState, setModalState] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nrp.startsWith('5033251') || nrp.length !== 10) {
      setError(true);
      setPin('');
      return;
    }

    const suffix = nrp.slice(-3);
    const student = STUDENTS_DATA[suffix];

    if (student && student.pin === pin) {
      setError(false);
      setModalState('loading');

      try {
        await supabase.from('revoked_sessions').delete().eq('id', nrp);
      } catch (err) {
        console.error('Gagal membersihkan revoked session:', err);
      }

      localStorage.setItem('mymbud_auth', 'true');
      localStorage.setItem('mymbud_user_name', student.name);
      localStorage.setItem('mymbud_user_nrp', nrp);

      setTimeout(() => {
        setModalState('success');

        setTimeout(() => {
          onLoginSuccess();
        }, 800);
      }, 750);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] flex flex-col lg:flex-row font-sans selection:bg-blue-500 selection:text-white relative">
      
      {/* BAGIAN KIRI / ATAS: GAMBAR SCRAPBOOK */}
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
            Selamat Datang!
          </h1>
          <p className="text-xs sm:text-[13px] font-normal text-slate-500 dark:text-zinc-400 mb-6">
            Masukkan NRP dan PIN untuk masuk
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                NRP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={nrp}
                onChange={(e) => setNrp(e.target.value.replace(/\D/g, ''))}
                placeholder="5033251xxx"
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-zinc-900/60 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400/60 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-zinc-700 transition-all border-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-2xl text-base sm:text-lg tracking-[0.3em] font-bold bg-slate-100 dark:bg-zinc-900/60 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400/60 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-zinc-700 transition-all border-none"
              />
            </div>

            {error && (
              <p className="text-[11px] font-bold text-rose-500 pt-0.5">
                NRP atau PIN salah/tidak cocok.
              </p>
            )}

            <button
              type="submit"
              disabled={nrp.length !== 10 || pin.length !== 4}
              className="w-full py-3.5 mt-2 rounded-2xl bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white disabled:bg-slate-200 disabled:dark:bg-zinc-800 disabled:text-slate-400 disabled:dark:text-zinc-500 text-white dark:text-slate-900 text-xs sm:text-sm font-bold transition-all active:scale-[0.98] cursor-pointer shadow-xs"
            >
              Masuk
            </button>
          </form>

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
        </motion.div>
      </div>

      {/* COMPACT POP-UP HUD MODAL */}
      <AnimatePresence>
        {modalState !== 'idle' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 26 }}
              className="relative z-10 w-36 h-36 rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl flex flex-col items-center justify-center gap-2 text-center p-3 select-none"
            >
              {modalState === 'loading' ? (
                <>
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                    Memverifikasi...
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                    Berhasil
                  </span>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};