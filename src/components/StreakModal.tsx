import React, { useState, useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
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

// 3D Glossy Flame Asset dengan Unique SVG Gradient ID (Bebas Bentrok di HP)
export const GlossyFlameIcon: React.FC<{ className?: string; streakCount?: number }> = ({
  className = "w-20 h-24",
  streakCount = 1,
}) => {
  const isMythic = (streakCount || 0) >= 100;
  const rawId = useId();
  const id = rawId.replace(/:/g, ''); // ID unik per instance SVG

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 120"
        className={`w-full h-full overflow-visible filter ${
          isMythic
            ? 'drop-shadow-[0_4px_22px_rgba(168,85,247,0.8)]'
            : 'drop-shadow-[0_4px_16px_rgba(255,80,0,0.5)]'
        }`}
      >
        <defs>
          <linearGradient id={`${id}-outer`} x1="0%" y1="0%" x2="100%" y2="100%">
            {isMythic ? (
              <>
                <stop offset="0%" stopColor="#7E22CE" />
                <stop offset="50%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#EC4899" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#FF1E00" />
                <stop offset="50%" stopColor="#FF4500" />
                <stop offset="100%" stopColor="#FF8C00" />
              </>
            )}
          </linearGradient>

          <linearGradient id={`${id}-inner`} x1="0%" y1="0%" x2="0%" y2="100%">
            {isMythic ? (
              <>
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#F472B6" />
                <stop offset="100%" stopColor="#C084FC" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#FFF200" />
                <stop offset="100%" stopColor="#FFAE00" />
              </>
            )}
          </linearGradient>

          <linearGradient id={`${id}-gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M50 2 C55 24, 78 35, 88 56 C99 77, 92 102, 73 114 C54 125, 26 122, 12 105 C-2 88, 1 65, 15 48 C20 42, 23 48, 25 39 C27 28, 38 18, 50 2 Z"
          fill={`url(#${id}-outer)`}
        />
        <path
          d="M50 28 C56 42, 74 52, 78 68 C83 85, 74 103, 58 110 C42 117, 24 112, 18 97 C12 82, 19 68, 28 58 C33 53, 34 43, 50 28 Z"
          fill={isMythic ? "#9333EA" : "#FF5E00"}
          opacity="0.85"
        />
        <path
          d="M50 48 C55 58, 67 67, 68 79 C69 92, 60 104, 48 107 C36 110, 26 102, 25 90 C24 78, 32 68, 38 61 C42 56, 43 51, 50 48 Z"
          fill={`url(#${id}-inner)`}
        />
        <path
          d="M48 12 C38 24, 25 38, 20 54 C16 68, 18 78, 17 84 C15 76, 16 60, 24 46 C32 32, 42 20, 48 12 Z"
          fill={`url(#${id}-gloss)`}
        />
      </svg>
    </div>
  );
};

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

  const isMythic = streak.currentStreak >= 100;

  // =========================================================================
  // KALKULASI REAL-TIME MINGGU INI (LOCAL TIMEZONE / BEBAS BUG UTC)
  // =========================================================================
  const weeklySchedule = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    const currentDay = now.getDay(); // 0 = Min, 1 = Sen, 2 = Sel, 3 = Rab, 4 = Kam, 5 = Jum, 6 = Sab

    // Hitung jarak hari ke hari Senin minggu ini
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(currentYear, currentMonth, currentDate + distanceToMonday, 0, 0, 0, 0);

    const labels = [
      { label: 'Sen', initial: 'S', dayOffset: 0 },
      { label: 'Sel', initial: 'S', dayOffset: 1 },
      { label: 'Rab', initial: 'R', dayOffset: 2 },
      { label: 'Kam', initial: 'K', dayOffset: 3 },
      { label: 'Jum', initial: 'J', dayOffset: 4 },
      { label: 'Sab', initial: 'S', dayOffset: 5 },
      { label: 'Min', initial: 'M', dayOffset: 6 },
    ];

    const formatLocalDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${date}`;
    };

    const todayStr = formatLocalDate(now);
    const streakCount = Math.max(1, streak.currentStreak || 0);

    return labels.map((item) => {
      const targetDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + item.dayOffset, 0, 0, 0, 0);
      const targetDateStr = formatLocalDate(targetDate);

      const isToday = targetDateStr === todayStr;
      const isFuture = targetDateStr > todayStr;

      // Hitung selisih hari dari hari ini
      const diffDaysFromToday = Math.round((new Date(currentYear, currentMonth, currentDate).getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

      // HANYA aktif jika bukan masa depan dan masuk rentang streak ke belakang
      const isActive = !isFuture && diffDaysFromToday >= 0 && diffDaysFromToday < streakCount;

      return {
        ...item,
        dateStr: targetDateStr,
        isToday,
        isActive,
        isFuture,
      };
    });
  }, [streak.currentStreak]);

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
      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400 flex items-center justify-center">
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
          className="fixed inset-0 z-[99999] bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
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
            <div
              className={`absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors ${
                isMythic ? 'bg-purple-600/30' : 'bg-orange-500/20'
              }`}
            />

            {/* Header Nav */}
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
                {/* 3D Glossy SVG Flame */}
                <motion.div
                  animate={{
                    scale: [1, 1.07, 1],
                    y: [0, -3, 0],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="my-1 flex items-center justify-center"
                >
                  <GlossyFlameIcon className="w-20 h-24" streakCount={streak.currentStreak} />
                </motion.div>

                <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
                  {streak.currentStreak} Hari
                </h2>

                <p
                  className={`text-xs font-bold mt-0.5 tracking-wide ${
                    isMythic
                      ? 'text-purple-600 dark:text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                      : 'text-amber-500 dark:text-amber-400'
                  }`}
                >
                  {userName} Menyala!
                </p>

                {/* BANNER STREAK REVIVE */}
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
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
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

                {/* Progress Mingguan: Senin -> Minggu */}
                <div className="w-full mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 text-left flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    Aktivitas Minggu Ini
                  </p>
                  <div className="grid grid-cols-7 gap-1.5 pt-1">
                    {weeklySchedule.map((day) => (
                      <div key={day.label} className="flex flex-col items-center gap-1">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                            day.isActive
                              ? isMythic
                                ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-xs'
                                : 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xs'
                              : day.isToday
                              ? 'border-2 border-dashed border-amber-500 text-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                              : 'bg-slate-200/70 dark:bg-zinc-700/60 text-slate-400 dark:text-zinc-500'
                          }`}
                        >
                          {day.isActive ? (
                            <GlossyFlameIcon className="w-4 h-5" streakCount={streak.currentStreak} />
                          ) : (
                            <span>{day.initial}</span>
                          )}
                        </div>
                        <span
                          className={`text-[9.5px] font-medium ${
                            day.isToday
                              ? 'font-bold text-amber-600 dark:text-amber-400'
                              : 'text-slate-400 dark:text-zinc-500'
                          }`}
                        >
                          {day.label}
                        </span>
                      </div>
                    ))}
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
                        Restore Perbulan
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
                  className={`mt-4 w-full py-3 rounded-2xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isMythic
                      ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 shadow-purple-500/25'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-orange-500/20'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Leaderboard Streak</span>
                </motion.button>

                <p className="mt-2.5 text-[11px] font-normal text-slate-400 dark:text-zinc-500 leading-snug">
                  Buka myMbud min. 1x/hari untuk mempertahankan streak-mu! 
                </p>
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
                                {user.name} {isMe && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">(Kamu)</span>}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                                Rekor: {user.longestStreak} hari
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-700/50">
                            <GlossyFlameIcon className="w-3.5 h-4" streakCount={user.currentStreak} />
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 tabular-nums">
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