import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  KeyRound,
  X,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  Bell,
  BellRing,
  CheckCheck,
  Megaphone,
  Send,
  Users,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Flame,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Menu,
  Check,
} from 'lucide-react';

import { TabType } from './Sidebar';

import {
  AppNotification,
  subscribeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notifications';

import { sendOfficerNotification } from '../services/oneSignalNotification';
import {
  syncUserStreak,
  getLocalStreak,
  UserStreak,
} from '../services/streakService';
import { StreakModal, GlossyFlameIcon } from './StreakModal';

export type ThemeMode = 'light' | 'dark';
export type ThemeAccent = 'blue' | 'purple' | 'pink' | 'orange' | 'green' | 'teal' | 'cyan';

interface HeaderProps {
  isOfficer: boolean;
  setIsOfficer: (val: boolean) => void;

  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;

  isSyncing?: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  urgentTaskCount?: number;

  theme?: any;
  setTheme?: any;

  onLogout?: () => void;
}

type SimplePomodoroMode = 'focus' | 'break';

function formatNotificationTime(timestamp: string | null | undefined) {
  if (!timestamp) return 'Baru saja';

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Baru saja';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const Header: React.FC<HeaderProps> = ({
  isOfficer,
  setIsOfficer,
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [isQuickDrawerOpen, setIsQuickDrawerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [streakData, setStreakData] = useState<UserStreak>(getLocalStreak);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

  const [isOfficerFormOpen, setIsOfficerFormOpen] = useState(false);
  const [officerTargetNrp, setOfficerTargetNrp] = useState('');
  const [officerTitle, setOfficerTitle] = useState('');
  const [officerMessage, setOfficerMessage] = useState('');
  const [isSendingOfficerNotif, setIsSendingOfficerNotif] = useState(false);

  const [pomoMode, setPomoMode] = useState<SimplePomodoroMode>('focus');
  const [focusDuration, setFocusDuration] = useState<number>(25);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>('blue');

  const accentOptions = [
    { id: 'blue' as ThemeAccent, color: '#0284C7', label: 'Biru' },
    { id: 'purple' as ThemeAccent, color: '#7C3AED', label: 'Ungu' },
    { id: 'pink' as ThemeAccent, color: '#DB2777', label: 'Pink' },
    { id: 'orange' as ThemeAccent, color: '#EA580C', label: 'Oranye' },
    { id: 'green' as ThemeAccent, color: '#16A34A', label: 'Hijau' },
    { id: 'teal' as ThemeAccent, color: '#0D9488', label: 'Teal' },
    { id: 'cyan' as ThemeAccent, color: '#0891B2', label: 'Cyan' },
  ];

  const applyThemeToDOM = (mode: ThemeMode, accent: ThemeAccent) => {
    if (typeof document === 'undefined') return;
    
    document.documentElement.setAttribute('data-mode', mode);
    document.documentElement.setAttribute('data-accent', accent);
    if (document.body) {
      document.body.setAttribute('data-accent', accent);
      document.body.setAttribute('data-mode', mode);
    }

    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const targetColor = mode === 'dark' ? '#0c0d10' : '#ffffff';
    let metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', targetColor);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = targetColor;
      document.head.appendChild(meta);
    }
  };

  useEffect(() => {
    const savedMode = (localStorage.getItem('mymbud_theme_mode') as ThemeMode) || 'dark';
    const savedAccent = (localStorage.getItem('mymbud_theme_accent') as ThemeAccent) || 'blue';
    setThemeMode(savedMode);
    setThemeAccent(savedAccent);
    applyThemeToDOM(savedMode, savedAccent);
  }, []);

  const handleModeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('mymbud_theme_mode', mode);
    applyThemeToDOM(mode, themeAccent);
  };

  const handleAccentSelect = (accent: ThemeAccent) => {
    setThemeAccent(accent);
    localStorage.setItem('mymbud_theme_accent', accent);
    applyThemeToDOM(themeMode, accent);
  };

  const targetNrp = useMemo(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('mymbud_user_nrp') || '').trim().toLowerCase() : '';
  }, []);

  const currentUserName = useMemo(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('mymbud_user_name') || 'Mbuders' : 'Mbuders';
  }, []);

  useEffect(() => {
    if (!targetNrp || targetNrp === 'unknown') return;

    syncUserStreak(targetNrp, currentUserName).then(({ streak }) => {
      setStreakData(streak);
    });
  }, [targetNrp, currentUserName]);

  useEffect(() => {
    if (!targetNrp || targetNrp === 'unknown') {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeNotifications(targetNrp, setNotifications);
    return () => unsubscribe();
  }, [targetNrp]);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.isRead).length;
  }, [notifications]);

  const playAlarmSound = () => {
    if (!soundEnabled) return;
    try {
      if (!alarmAudioRef.current) {
        alarmAudioRef.current = new Audio('/alarm.mp3');
      }
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current.volume = 0.9;
      const playPromise = alarmAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[Pomodoro] Audio alarm blocked:', err);
        });
      }
    } catch (e) {
      console.warn('[Pomodoro] Gagal memutar alarm.mp3:', e);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const nextTime = prev <= 1 ? 0 : prev - 1;

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('mymbud_pomodoro_sync', {
                detail: {
                  timeLeft: nextTime,
                  isRunning: nextTime > 0,
                  pomoMode,
                },
              })
            );
          }

          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playAlarmSound();
            return 0;
          }
          return nextTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('mymbud_pomodoro_sync', {
            detail: {
              timeLeft,
              isRunning: false,
              pomoMode,
            },
          })
        );
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled, pomoMode, timeLeft]);

  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (isRunning) {
      document.title = `(${formatted}) ${pomoMode === 'focus' ? '🔥 Focus' : '☕ Break'} • myMbud`;
    } else {
      document.title = 'myMbud';
    }
  }, [timeLeft, isRunning, pomoMode]);

  const handleSwitchMode = (mode: SimplePomodoroMode) => {
    setPomoMode(mode);
    setIsRunning(false);
    const initialTime = (mode === 'focus' ? focusDuration : breakDuration) * 60;
    setTimeLeft(initialTime);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('mymbud_pomodoro_sync', {
          detail: {
            timeLeft: initialTime,
            isRunning: false,
            pomoMode: mode,
          },
        })
      );
    }
  };

  const handleAdjustDuration = (deltaMinutes: number) => {
    if (isRunning) return;
    if (pomoMode === 'focus') {
      const next = Math.max(1, Math.min(90, focusDuration + deltaMinutes));
      setFocusDuration(next);
      setTimeLeft(next * 60);
    } else {
      const next = Math.max(1, Math.min(45, breakDuration + deltaMinutes));
      setBreakDuration(next);
      setTimeLeft(next * 60);
    }
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    const resetTime = (pomoMode === 'focus' ? focusDuration : breakDuration) * 60;
    setTimeLeft(resetTime);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('mymbud_pomodoro_sync', {
          detail: {
            timeLeft: resetTime,
            isRunning: false,
            pomoMode,
          },
        })
      );
    }
  };

  const formattedTimer = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [timeLeft]);

  const handleLogoClick = () => {
    if (isOfficer) {
      setIsOfficer(false);
      setIsOfficerFormOpen(false);
    } else {
      setPinInput('');
      setPinError(false);
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '2025') {
      setIsOfficer(true);
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
      } catch (error) {
        console.error('[Notifications] Failed to mark as read:', error);
      }
    }

    setIsNotificationOpen(false);
    setIsOfficerFormOpen(false);

    const data = notification.data || {};
    if (data.postId) localStorage.setItem('mbud_target_post_id', data.postId);
    if (data.actorNrp) localStorage.setItem('mbud_target_actor_nrp', data.actorNrp);
    if (setActiveTab) setActiveTab('mbudiary');
    window.dispatchEvent(new Event('mbud_notification_navigate'));
  };

  const handleMarkAllRead = async () => {
    if (!targetNrp || unreadCount === 0) return;
    try {
      await markAllNotificationsAsRead(targetNrp);
    } catch (error) {
      console.error('[Notifications] Failed to mark all as read:', error);
    }
  };

  const handleSendOfficerNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerTargetNrp.trim() || !officerTitle.trim() || !officerMessage.trim() || isSendingOfficerNotif) return;

    setIsSendingOfficerNotif(true);
    try {
      await sendOfficerNotification({
        targetNrp: officerTargetNrp.trim(),
        title: officerTitle.trim(),
        message: officerMessage.trim(),
      });

      alert(officerTargetNrp.toUpperCase() === 'ALL' ? 'Notifikasi broadcast berhasil dikirim!' : 'Notifikasi berhasil dikirim!');
      setOfficerTargetNrp('');
      setOfficerTitle('');
      setOfficerMessage('');
      setIsOfficerFormOpen(false);
    } catch (error) {
      console.error('[Officer Notif Error]:', error);
      alert('Gagal mengirim notifikasi.');
    } finally {
      setIsSendingOfficerNotif(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 w-full bg-white/75 dark:bg-zinc-950/75 backdrop-blur-xl border-b border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 text-left group focus:outline-none shrink-0 cursor-pointer"
          >
            <img 
              src="/logombud.png" 
              alt="Logo myMbud" 
              className="h-8 w-auto object-contain transition-all duration-300"
              style={{ filter: 'var(--logo-filter, none)' }} 
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight group-hover:text-blue-500 transition-colors">
                  <span className="font-light">my</span>Mbud<span className="font-light"></span>
                </h1>
                <span className="text-xs font-normal text-slate-400">v2.5</span>
                {isOfficer && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 animate-pulse ml-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>MODE PJ</span>
                  </span>
                )}
              </div>
            </div>
          </motion.button>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsStreakModalOpen(true)}
              className="hidden lg:flex relative items-center h-10 pl-7 pr-3.5 rounded-2xl bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 transition-colors cursor-pointer border border-slate-200/50 dark:border-white/5 shrink-0 select-none group mr-1 shadow-xs"
              title="Daily Streak"
            >
              <div className="absolute -left-2.5 -top-1.5 w-9 h-11 pointer-events-none group-hover:scale-110 transition-transform">
                <GlossyFlameIcon className="w-full h-full" streakCount={streakData.currentStreak} />
              </div>

              <span className="text-sm font-extrabold tabular-nums ml-0.5">
                {streakData.currentStreak}
              </span>
            </motion.button>

            <div className="relative shrink-0">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsNotificationOpen((prev) => !prev);
                  setIsQuickDrawerOpen(false);
                }}
                className="relative p-2.5 rounded-2xl bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors flex items-center justify-center cursor-pointer border border-slate-200/50 dark:border-white/5 shadow-xs"
                title="Notifikasi"
              >
                {unreadCount > 0 ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-zinc-950" />
                  </span>
                )}
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setIsQuickDrawerOpen(true);
                setIsNotificationOpen(false);
              }}
              className={`relative transition-colors flex items-center justify-center cursor-pointer select-none shrink-0 border ${
                isRunning
                  ? pomoMode === 'focus'
                    ? 'px-3 py-2 sm:px-3.5 sm:py-2 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-mono gap-1.5 shadow-xs'
                    : 'px-3 py-2 sm:px-3.5 sm:py-2 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-mono gap-1.5 shadow-xs'
                  : 'p-2.5 rounded-2xl bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border-slate-200/50 dark:border-white/5 shadow-xs'
              }`}
              title="Menu & Fokus"
              aria-label="Menu & Fokus"
            >
              {isRunning ? (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pomoMode === 'focus' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${pomoMode === 'focus' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  </span>
                  <span className="text-xs font-bold tracking-tight tabular-nums">
                    {formattedTimer}
                  </span>
                </>
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </header>

      <div className="h-14 sm:h-16 w-full shrink-0" />

      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streak={streakData}
        userName={currentUserName}
        onStreakUpdate={(updated) => setStreakData(updated)}
      />

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isNotificationOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[99998] bg-slate-950/60 backdrop-blur-sm transition-opacity"
                  onClick={() => setIsNotificationOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="fixed top-16 left-4 right-4 sm:left-auto sm:right-6 sm:top-16 sm:w-[380px] max-w-md mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl shadow-2xl z-[99999] overflow-hidden"
                >
                  <div className="px-4 py-3.5 border-b border-slate-200/40 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Notifikasi</h2>
                        
                        {isOfficer && (
                          <button
                            onClick={() => setIsOfficerFormOpen(!isOfficerFormOpen)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isOfficerFormOpen 
                                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' 
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-indigo-500'
                            }`}
                            title="Kirim Notifikasi Manual"
                          >
                            <Megaphone className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {unreadCount > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500">
                            {unreadCount} baru
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Riwayat aktivitas myMbud</p>
                    </div>

                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-500 hover:text-blue-600 transition-colors cursor-pointer">
                        <CheckCheck className="w-3.5 h-3.5" /> Tandai semua
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {isOfficer && isOfficerFormOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-3 pt-3 overflow-hidden"
                      >
                        <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">Target Penerima:</span>
                            <button
                              type="button"
                              onClick={() => setOfficerTargetNrp('ALL')}
                              className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold hover:bg-indigo-500 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <Users className="w-2.5 h-2.5" />
                              <span>Semua User (ALL)</span>
                            </button>
                          </div>

                          <form onSubmit={handleSendOfficerNotif} className="space-y-2">
                            <input
                              type="text"
                              value={officerTargetNrp}
                              onChange={(e) => setOfficerTargetNrp(e.target.value)}
                              placeholder="NRP Target (atau ketik ALL)"
                              required
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-xs border border-indigo-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              value={officerTitle}
                              onChange={(e) => setOfficerTitle(e.target.value)}
                              placeholder="Judul Notifikasi"
                              required
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-xs border border-indigo-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <textarea
                              value={officerMessage}
                              onChange={(e) => setOfficerMessage(e.target.value)}
                              placeholder="Isi pesan notifikasi..."
                              rows={2}
                              required
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-xs border border-indigo-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                            />
                            <button
                              type="submit"
                              disabled={isSendingOfficerNotif}
                              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{isSendingOfficerNotif ? 'Mengirim Broadcast...' : 'Kirim Pesan'}</span>
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="max-h-[350px] sm:max-h-[430px] overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100/80 dark:bg-zinc-800 mx-auto flex items-center justify-center text-slate-400">
                          <Bell className="w-5 h-5" />
                        </div>
                        <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">Belum ada notifikasi</p>
                        <p className="mt-1 text-[10px] text-slate-400">Semua aktivitas terbaru akan muncul di sini.</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer ${
                            notification.isRead
                              ? 'bg-transparent hover:bg-white/60 dark:hover:bg-zinc-800/60'
                              : 'bg-blue-50/70 dark:bg-blue-950/25 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="pt-1.5 shrink-0">
                              <span className={`block w-2 h-2 rounded-full ${notification.isRead ? 'bg-transparent' : 'bg-blue-500'}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className={`text-[11px] leading-tight ${notification.isRead ? 'font-semibold text-slate-700 dark:text-zinc-300' : 'font-bold text-slate-900 dark:text-zinc-100'}`}>
                                  {notification.title}
                                </p>
                                <span className="text-[9px] text-slate-400 whitespace-nowrap shrink-0">
                                  {formatNotificationTime(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400 mt-1 break-words">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* QUICK DRAWER SIDEBAR */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isQuickDrawerOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm transition-opacity"
                  onClick={() => setIsQuickDrawerOpen(false)}
                />

                <motion.aside
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                  className="fixed top-0 right-0 bottom-0 z-[99999] w-full max-w-[320px] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-l border-white/40 dark:border-zinc-800 shadow-2xl flex flex-col justify-between overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-slate-200/40 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-500">
                        <Timer className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                        POMODORO TIMER
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsQuickDrawerOpen(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex p-1 bg-slate-100/80 dark:bg-zinc-900 rounded-xl border border-slate-200/50 dark:border-zinc-800">
                          <button
                            onClick={() => handleSwitchMode('focus')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              pomoMode === 'focus'
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                            }`}
                          >
                            Focus
                          </button>
                          <button
                            onClick={() => handleSwitchMode('break')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              pomoMode === 'break'
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                            }`}
                          >
                            Break
                          </button>
                        </div>

                        <button
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer border border-transparent ${
                            soundEnabled
                              ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-900/40'
                              : 'text-slate-400 dark:text-zinc-600 bg-slate-100 dark:bg-zinc-800 dark:border-zinc-700'
                          }`}
                          title={soundEnabled ? 'Suara Aktif' : 'Suara Muted'}
                        >
                          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                        pomoMode === 'focus'
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
                          : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">
                          {pomoMode === 'focus' ? <Flame className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                          <span>{pomoMode === 'focus' ? 'Belajar' : 'Istirahat'}</span>
                        </div>

                        <div className="flex items-center justify-center gap-3 my-2 w-full">
                          {!isRunning ? (
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleAdjustDuration(-1)}
                              className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center transition-all cursor-pointer text-inherit"
                              title="Kurangi 1 Menit"
                            >
                              <Minus className="w-4 h-4" />
                            </motion.button>
                          ) : (
                            <div className="w-8 h-8" />
                          )}

                          <div className="text-4xl font-black font-mono tracking-tight tabular-nums min-w-[130px] text-center">
                            {formattedTimer}
                          </div>

                          {!isRunning ? (
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleAdjustDuration(1)}
                              className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center transition-all cursor-pointer text-inherit"
                              title="Tambah 1 Menit"
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          ) : (
                            <div className="w-8 h-8" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2 w-full">
                          <button
                            onClick={() => setIsRunning(!isRunning)}
                            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-white transition-all active:scale-95 cursor-pointer ${
                              pomoMode === 'focus'
                                ? 'bg-rose-600 hover:bg-rose-500 shadow-sm shadow-rose-600/20'
                                : 'bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-600/20'
                            }`}
                          >
                            {isRunning ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                            <span>{isRunning ? 'Pause' : 'Start'}</span>
                          </button>

                          <button
                            onClick={handleResetTimer}
                            className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all active:scale-95 cursor-pointer"
                            title="Reset Waktu"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-3 border-t border-slate-200/40 dark:border-zinc-800">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block text-center">
                        Personalisasi Tampilan
                      </span>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400">
                          Mode Tampilan
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleModeSelect('light')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                              themeMode === 'light'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <Sun className="w-4 h-4" />
                            <span>Terang</span>
                          </button>

                          <button
                            onClick={() => handleModeSelect('dark')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                              themeMode === 'dark'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <Moon className="w-4 h-4" />
                            <span>Gelap</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400">
                          Warna Aksen
                        </label>
                        <div className="flex items-center justify-between gap-1.5 p-2 bg-slate-100/70 dark:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
                          {accentOptions.map((item) => {
                            const isSelected = themeAccent === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleAccentSelect(item.id)}
                                style={{ backgroundColor: item.color }}
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm relative cursor-pointer"
                                title={item.label}
                              >
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {onLogout && (
                    <div className="p-4 border-t border-slate-200/40 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950">
                      <button
                        onClick={() => {
                          setIsQuickDrawerOpen(false);
                          onLogout();
                        }}
                        className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar Akun</span>
                      </button>
                    </div>
                  )}
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      <AnimatePresence>
        {showPinModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 10 }} className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-5 relative">
              <button onClick={() => setShowPinModal(false)} className="absolute top-5 right-5 p-2 rounded-2xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"><X className="w-4 h-4" /></button>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 mx-auto flex items-center justify-center"><KeyRound className="w-6 h-6" /></div>
                <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Apakah kamu PJ?!</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Jika iya, masukkan PIN untuk masuk mode kelola data.</p>
              </div>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <input type="password" maxLength={6} autoFocus required value={pinInput} onChange={(e) => { setPinInput(e.target.value); if (pinError) setPinError(false); }} placeholder="• • • • • •" className={`w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 transition-all border ${pinError ? 'border-red-500 bg-red-50/50' : 'border-slate-200 dark:border-zinc-700 focus:ring-blue-500'}`} />
                {pinError && <p className="text-[11px] font-semibold text-red-600 text-center flex items-center justify-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /><span>PIN salah. Silakan coba lagi ya.</span></p>}
                <div className="flex items-center gap-2 pt-1">
                  <button type="button" onClick={() => setShowPinModal(false)} className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer">Batal</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="flex-1 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer">Verifikasi</motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};