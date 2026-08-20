// src/components/StreakModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Flame,
  Trophy,
  CalendarCheck,
  Loader2,
  ChevronLeft,
  ShieldAlert,
} from 'lucide-react';
import {
  UserStreak,
  LeaderboardUser,
  fetchStreakLeaderboard,
  useStreakRevive,
} from '../services/streakService';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: UserStreak;
  userName: string;
  onStreakUpdate?: (updated: UserStreak) => void;
}

export const StreakModal: React.FC<StreakModalProps> = ({
  isOpen,
  onClose,
  streak,
  userName,
  onStreakUpdate,
}) => {
  const [viewMode, setViewMode] = useState<'my_streak' | 'leaderboard'>('my_streak');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isReviving, setIsReviving] = useState(false);

  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const todayIndex = new Date().getDay();

  const handleOpenLeaderboard = async () => {
    setViewMode('leaderboard');
    if (leaderboard.length === 0) {
      setIsLoadingLeaderboard(true);
      const data = await fetchStreakLeaderboard();
      setLeaderboard(data);
      setIsLoadingLeaderboard(false);
    }
  };

  const handleRevive = async () => {
    const nrp = localStorage.getItem('mymbud_user_nrp') || 'unknown';
    setIsReviving(true);
    try {
      const updated = await useStreakRevive(nrp, userName);
      if (updated && onStreakUpdate) {
        onStreakUpdate(updated);
      }
    } finally {
      setIsReviving(false);
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="text-base">🥇</span>;
    if (index === 1) return <span className="text-base">🥈</span>;
    if (index === 2) return <span className="text-base">🥉</span>;
    return (
      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 flex items-center justify-center">
        {index + 1}
      </span>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="relative max-w-sm sm:max-w-md w-full rounded-3xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 shadow-2xl p-6 sm:p-7 text-center overflow-hidden flex flex-col items-center max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-amber-500/20 to-orange-500/0 rounded-full blur-3xl pointer-events-none" />

            {/* Header Navigation */}
            <div className="w-full flex items-center justify-between z-10 mb-1">
              {viewMode === 'leaderboard' ? (
                <button
                  type="button"
                  onClick={() => setViewMode('my_streak')}
                  className="p-1.5 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                aria-label="Tutup"
                onClick={onClose}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ml-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: STATUS SAYA */}
            {viewMode === 'my_streak' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full flex flex-col items-center"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    rotate: [0, -3, 3, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-3"
                >
                  <Flame className="w-11 h-11 fill-current" />
                </motion.div>

                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
                  {streak.currentStreak} Hari
                </h2>

                <p className="text-xs font-semibold text-amber-500 dark:text-amber-400 mt-1 tracking-wide">
                  Streak Menyala!
                </p>

                {/* BANNER STREAK REVIVE JIKA PUTUS */}
                {streak.canRevive && (streak.previousBrokenStreak || 0) > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 flex flex-col gap-2 text-left"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                          Streak {streak.previousBrokenStreak} Hari Terputus!
                        </p>
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 leading-tight mt-0.5">
                          Kamu punya {streak.reviveQuota}x kesempatan revive untuk mempertahankan apimu di hari ke-{streak.previousBrokenStreak}.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isReviving}
                      onClick={handleRevive}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {isReviving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Memulihkan...</span>
                        </>
                      ) : (
                        <span>Gunakan Penyelamat Streak 🧊 ({streak.reviveQuota}/3)</span>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Progress Mingguan Sen - Min */}
                <div className="w-full mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 text-left flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    Aktivitas Pekan Ini
                  </p>
                  <div className="grid grid-cols-7 gap-1.5 pt-1">
                    {daysOfWeek.map((day, idx) => {
                      const isActive = streak.weeklyActiveDays?.includes(idx);
                      const isToday = idx === todayIndex;

                      return (
                        <div key={day} className="flex flex-col items-center gap-1">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xs'
                                : isToday
                                ? 'border-2 border-dashed border-amber-500 text-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                                : 'bg-slate-200/70 dark:bg-zinc-700/60 text-slate-400 dark:text-zinc-500'
                            }`}
                          >
                            {isActive ? (
                              <Flame className="w-4 h-4 fill-current" />
                            ) : (
                              <span>{day[0]}</span>
                            )}
                          </div>
                          <span
                            className={`text-[9.5px] font-medium ${
                              isToday
                                ? 'font-bold text-amber-600 dark:text-amber-400'
                                : 'text-slate-400 dark:text-zinc-500'
                            }`}
                          >
                            {day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stat Rekor & Sisa Revive */}
                <div className="w-full mt-3 grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-[9.5px] font-medium text-slate-400 dark:text-zinc-500 truncate">
                        Rekor Terpanjang
                      </p>
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                        {streak.longestStreak} Hari
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 text-xs">
                      🧊
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-[9.5px] font-medium text-slate-400 dark:text-zinc-500 truncate">
                        Restore perbulan
                      </p>
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                        {streak.reviveQuota ?? 3}x Jatah
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tombol Buka Leaderboard */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleOpenLeaderboard}
                  className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Leaderboard Streak</span>
                </motion.button>
              </motion.div>
            )}

            {/* TAB 2: LEADERBOARD KELAS */}
            {viewMode === 'leaderboard' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full flex flex-col flex-1 overflow-hidden"
              >
                <div className="mb-3 text-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center justify-center gap-2">
                    <span>Peringkat Teraktif</span> 🏆
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Mahasiswa dengan streak api terpanjang
                  </p>
                </div>

                {isLoadingLeaderboard ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    <span className="text-xs font-medium">Memuat peringkat...</span>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="py-10 text-xs text-slate-400">
                    Belum ada data streak kelas.
                  </div>
                ) : (
                  <div className="w-full flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[300px]">
                    {leaderboard.map((user, idx) => {
                      const isMe = user.name.toLowerCase() === userName.toLowerCase();

                      return (
                        <div
                          key={user.nrp}
                          className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                            isMe
                              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 shadow-xs'
                              : 'bg-slate-50 dark:bg-zinc-800/60 border-slate-100 dark:border-zinc-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            {getRankBadge(idx)}
                            <div className="text-left min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                                {user.name} {isMe && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold">(Kamu)</span>}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                                Rekor: {user.longestStreak} hari
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-700/50">
                            <span className="text-xs">🔥</span>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 tabular-nums">
                              {user.currentStreak}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};