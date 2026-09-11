import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  CheckSquare, 
  Calendar, 
  Megaphone, 
  Plus, 
  Edit3, 
  Trash2, 
  Lock,
  LogOut,
  Pencil
} from 'lucide-react';
import { Task, ScheduleItem } from '../types';

interface PjControlCenterViewProps {
  tasks: Task[];
  schedules: ScheduleItem[];
  isOfficer: boolean;
  setIsOfficer: (val: boolean) => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onDeleteTask: (id: string) => void;
  onNavigateTab: (tab: string, filter?: string) => void;
}

export const PjControlCenterView: React.FC<PjControlCenterViewProps> = ({
  tasks,
  schedules,
  isOfficer,
  setIsOfficer,
  onDeleteTask,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'schedules' | 'announcements'>('tasks');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === '2025' || pinInput === '2026') {
      setIsOfficer(true);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('PIN salah! Silakan coba lagi.');
    }
  };

  // 1. TAMPILAN JIKA BELUM AUTENTIKASI PIN
  if (!isOfficer) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-2xl text-center space-y-5"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/40 flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-zinc-100">PJ Control Center</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Masukkan PIN Penanggung Jawab untuk mengelola data portal.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-3">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan 6 digit PIN..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-center font-mono text-lg text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-rose-500 font-semibold">{pinError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              Masuk Control Center
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // 2. TAMPILAN DASHBOARD CONTROL CENTER
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-24 w-full"
    >
      {/* HEADER BANNER */}
      <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">PJ Control Center</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
                Sesi Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Pusat kendali terpisah untuk mengelola data tugas, jadwal & pengumuman.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOfficer(false)}
          className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-rose-500 border border-slate-200 dark:border-zinc-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sesi PJ</span>
        </button>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Kelola Tugas ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'schedules'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Kelola Jadwal ({schedules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Broadcast Pengumuman</span>
        </button>
      </div>

      {/* TAB CONTENT: MANAJEMEN TUGAS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              Daftar Tugas Keseluruhan ({tasks.length})
            </h3>
            <button 
              onClick={() => onNavigateTab('tasks')}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buka Form Tambah Tugas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0 space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                    {task.course}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{task.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Deadline: {new Date(task.deadline).toLocaleDateString('id-ID')}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Hapus Tugas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: MANAJEMEN JADWAL */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              Daftar Mata Kuliah ({schedules.length})
            </h3>
            <button 
              onClick={() => onNavigateTab('contacts')}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              <span>Buka Manager Kontak & Matkul</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {schedules.map((schedule) => (
              <div 
                key={schedule.id}
                className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/40">
                      {schedule.day}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                      {schedule.time}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{schedule.course}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                    Ruang: {schedule.room} • PJ: {schedule.pjMatkul || '-'}
                  </p>
                </div>

                <button 
                  onClick={() => onNavigateTab('contacts', schedule.course)}
                  className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer shrink-0"
                  title="Edit Matkul"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PENGUMUMAN */}
      {activeTab === 'announcements' && (
        <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-xl space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/40">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Kirim Notifikasi Broadcast PJ</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
            Fitur kirim pengumuman dapat langsung digunakan melalui tombol "Pengumuman" di popup notifikasi dashboard.
          </p>
        </div>
      )}
    </motion.div>
  );
};