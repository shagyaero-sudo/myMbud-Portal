import React, { useState, useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trophy,
  CalendarCheck,
  Loader2,
  ChevronLeft,
  HelpCircle,
  Flame,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  UserStreak,
  LeaderboardUser,
  fetchStreakLeaderboard,
} from '../services/streakService';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: UserStreak;
  userName: string;
  onStreakUpdate?: (updated: UserStreak) => void;
}

export const GlossyFlameIcon: React.FC<{ className?: string; streakCount?: number }> = ({
  className = "w-20 h-24",
  streakCount = 1,
}) => {
  const isMythic = (streakCount || 0) >= 100;
  const rawId = useId();
  const id = rawId.replace(/:/g, '');

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
}) => {
  const [viewMode, setViewMode] = useState<'my_streak' | 'leaderboard' | 'guide'>('my_streak');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const isMythic = (streak.currentStreak || 0) >= 100;
  const MIGRATION_DATE_STR = '2026-08-29';

  const weeklySchedule = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    const currentDay = now.getDay();

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
    const activeDatesSet = new Set(streak.activeDates || [todayStr]);

    return labels.map((item) => {
      const targetDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + item.dayOffset, 0, 0, 0, 0);
      const targetDateStr = formatLocalDate(targetDate);

      const isToday = targetDateStr === todayStr;
      const isPast = targetDateStr < todayStr;
      const isFuture = targetDateStr > todayStr;

      const diffDaysFromToday = Math.round(
        (new Date(currentYear, currentMonth, currentDate).getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const isPreMigrationActive = targetDateStr <= MIGRATION_DATE_STR && diffDaysFromToday >= 0 && diffDaysFromToday < streakCount;
      const isPostMigrationActive = targetDateStr > MIGRATION_DATE_STR && activeDatesSet.has(targetDateStr);

      const isActive = !isFuture && (isPreMigrationActive || isPostMigrationActive);
      const isMissed = isPast && targetDateStr > MIGRATION_DATE_STR && !isActive;

      return {
        ...item,
        dateStr: targetDateStr,
        isToday,
        isActive,
        isMissed,
        isFuture,
      };
    });
  }, [streak.currentStreak, streak.activeDates]);

  const handleOpenLeaderboard = async () => {
    setViewMode('leaderboard');
    if (leaderboard.length === 0) {
      setIsLoadingLeaderboard(true);
      const data = await fetchStreakLeaderboard();
      setLeaderboard(data);
      setIsLoadingLeaderboard(false);
    }
  };

  const formatLastActive = (dateStr?: string, timestampStr?: string) => {
    const rawTime = timestampStr || (dateStr && dateStr.includes('T') ? dateStr : null);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    if (rawTime) {
      const date = new Date(rawTime);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        const isToday =
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear();

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const timeFormatted = `${hours}.${minutes}`;

        if (isToday) {
          return `Hari ini ${timeFormatted}`;
        }
        return `${date.getDate()} ${months[date.getMonth()]} ${timeFormatted}`;
      }
    }

    if (!dateStr) return 'Belum pernah';
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    if (dateStr === todayStr) return 'Hari ini';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = Number(parts[2]);
      const m = Number(parts[1]) - 1;
      return `${d} ${months[m] || ''}`;
    }
    return dateStr;
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
              {viewMode !== 'my_streak' ? (
                <button
                  type="button"
                  onClick={() => setViewMode('my_streak')}
                  className="p-1.5 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewMode('guide')}
                  className="px-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 flex items-center gap-1 text-[11px] font-semibold transition-all cursor-pointer"
                  title="Cara Kerja Streak"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Aturan</span>
                </button>
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
                  {userName} Jaga Api!
                </p>

                {/* Banner Notifikasi Erosi/Decay */}
                {Boolean(streak.daysMissedToday && streak.daysMissedToday > 0) && (
                  <div className="w-full mt-3 p-2.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 flex items-center gap-2 text-left">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
                      Apimu terkikis <strong>-{streak.daysMissedToday} hari</strong> karena absen, tapi menyala kembali hari ini!
                    </p>
                  </div>
                )}

                {/* Progress Mingguan */}
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
                              : day.isMissed
                              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40'
                              : day.isToday
                              ? 'border-2 border-dashed border-amber-500 text-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                              : 'bg-slate-200/70 dark:bg-zinc-700/60 text-slate-400 dark:text-zinc-500'
                          }`}
                        >
                          {day.isActive ? (
                            <GlossyFlameIcon className="w-4 h-5" streakCount={streak.currentStreak} />
                          ) : day.isMissed ? (
                            <span className="text-xs font-bold">✕</span>
                          ) : (
                            <span>{day.initial}</span>
                          )}
                        </div>
                        <span
                          className={`text-[9.5px] font-medium ${
                            day.isToday
                              ? 'font-bold text-amber-600 dark:text-amber-400'
                              : day.isMissed
                              ? 'text-rose-500 dark:text-rose-400 font-semibold'
                              : 'text-slate-400 dark:text-zinc-500'
                          }`}
                        >
                          {day.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tombol Leaderboard */}
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

                {/* Tombol Tutup Sederhana Tambahan */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-semibold text-xs transition-colors cursor-pointer mt-2"
                >
                  Tutup
                </button>

                <p className="mt-2.5 text-[11px] font-normal text-slate-400 dark:text-zinc-500 leading-snug">
                  Buka myMbud tiap hari untuk menaikkan streak!
                </p>
              </motion.div>
            )}

            {/* TAB 2: CARA KERJA SISTEM STREAK */}
            {viewMode === 'guide' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full flex flex-col flex-1 overflow-hidden text-left"
              >
                <div className="mb-3 text-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center justify-center gap-2">
                    <span>Aturan Main Streak</span> 
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Sistem Akumulasi myMbud
                  </p>
                </div>

                <div className="w-full flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar max-h-[310px] text-xs">
                  <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 flex items-start gap-2.5">
                    <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-zinc-200">1. Check-In Harian (+1 Hari)</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        Cukup buka myMbud 1x setiap hari untuk menambah 1 api streak. Buka berkali-kali di hari yang sama tidak akan menambah angka ganda.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-zinc-200">2. Sistem Minus (-1 per hari bolos)</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        Jika kamu bolos beberapa hari, api tidak langsung reset ke 1 (awal), tapi hanya berkurang sebanyak hari kamu bolos.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-start gap-2.5">
                    <div className="shrink-0 mt-0.5">
                      <GlossyFlameIcon className="w-4 h-5" streakCount={100} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-zinc-200">3. Mythic Flame (100+ Hari)</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        Kumpulkan streak hingga 100 hari untuk membuka efek aura api ungu (Mythic Flame) di profilmu!
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode('my_streak')}
                  className="mt-4 w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Mengerti
                </button>
              </motion.div>
            )}

            {/* TAB 3: LEADERBOARD KELAS */}
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
                    Mahasiswa dengan streak api tertinggi
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
                                {formatLastActive(user.lastActiveDate, user.lastCheckedInAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-700/50 shadow-xs">
                            <GlossyFlameIcon className="w-3.5 h-4" streakCount={user.currentStreak} />
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 tabular-nums">
                              {user.currentStreak} Hari
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setViewMode('my_streak')}
                  className="mt-4 w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Kembali
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};