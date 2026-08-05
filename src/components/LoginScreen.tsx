import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { STUDENTS_DATA } from '../data/studentData';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [nrp, setNrp] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi Prefix NRP (Harus diawali 5033251 dan total 10 digit)
    if (!nrp.startsWith('5033251') || nrp.length !== 10) {
      setError(true);
      setPin('');
      return;
    }

    // 2. Ambil 3 digit suffix NRP (misal '046')
    const suffix = nrp.slice(-3);
    const student = STUDENTS_DATA[suffix];

    // 3. Cocokkan dengan data mahasiswa dan PIN
    if (student && student.pin === pin) {
      setError(false);
      localStorage.setItem('mymbud_auth', 'true');
      localStorage.setItem('mymbud_user_name', student.name); // Simpan nama panggilan
      localStorage.setItem('mymbud_user_nrp', nrp);
      onLoginSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] flex flex-col lg:flex-row font-sans selection:bg-blue-500 selection:text-white">
      
      {/* BAGIAN KIRI / ATAS: GAMBAR SCRAPBOOK */}
      {/* Container dibuat memakan porsi besar di HP dan bg-white agar blending dgn gambar */}
      <div className="w-full lg:w-1/2 h-[58vh] lg:h-screen bg-white relative flex items-center justify-end overflow-hidden">
        <motion.img 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          src="/collase.png" 
          alt="Kolase Kelas A" 
          // object-cover & object-right memastikan gambar NABRAK ke tepi kanan tanpa celah
          className="absolute inset-0 w-full h-full object-cover object-right"
        />
      </div>

      {/* BAGIAN KANAN / BAWAH: FORM LOGIN */}
      {/* Padding dan margin dikurangi agar form lebih ramping/compact di HP */}
      <div className="w-full lg:w-1/2 flex-1 flex flex-col justify-center bg-white dark:bg-[#09090b] rounded-t-[2.5rem] lg:rounded-none -mt-10 lg:mt-0 relative z-20 px-6 py-8 sm:px-12 lg:px-24 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] lg:shadow-none">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm mx-auto"
        >
          {/* Logo & Judul */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-6 h-6 shrink-0">
              <img 
                src="/logombud.png" 
                alt="myMbud Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
              <span className="font-light">my</span>Mbud <span className="font-light">Portal</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-zinc-100 mb-1.5 tracking-tight">
            Selamat Datang!
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 dark:text-zinc-400 mb-6">
            Masukkan NRP dan PIN untuk masuk
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
            
            {/* Input NRP */}
            <div className="space-y-1.5">
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-zinc-400">NRP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={nrp}
                onChange={(e) => setNrp(e.target.value.replace(/\D/g, ''))}
                placeholder="50332510xxx"
                className="w-full px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-zinc-900/60 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400/70 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-zinc-700 transition-all border-none"
              />
            </div>

            {/* Input PIN */}
            <div className="space-y-1.5">
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-zinc-400">PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-xl text-base sm:text-lg tracking-[0.3em] font-bold bg-slate-100 dark:bg-zinc-900/60 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400/70 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-zinc-700 transition-all border-none"
              />
            </div>

            {error && (
              <p className="text-[10px] sm:text-xs font-bold text-rose-500 pt-0.5">
                NRP / PIN salah atau tidak terdaftar!
              </p>
            )}

            <button
              type="submit"
              disabled={nrp.length !== 10 || pin.length !== 4}
              className="w-full py-3.5 mt-2 rounded-xl bg-slate-800 dark:bg-[#cbd5e1] hover:bg-slate-900 dark:hover:bg-white disabled:bg-slate-300 disabled:dark:bg-zinc-800 disabled:text-slate-500 text-white dark:text-slate-900 text-xs sm:text-sm font-bold transition-all active:scale-[0.98]"
            >
              Masuk
            </button>
          </form>

          <div className="mt-5 text-right">
            <a 
              href="https://wa.me/6285182284769?text=Halo%20Aero,%20aku%20butuh%20bantuan%20akses%20login%20myMbud%20Portal" 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] sm:text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300 transition-colors"
            >
              Bantuan?
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};