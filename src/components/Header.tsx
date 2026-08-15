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
  Sparkles,
  Palette,
  Leaf,
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
} from 'lucide-react';

import { TabType } from './Sidebar';

import {
  AppNotification,
  subscribeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notifications';

import {
  requestOneSignalPermission,
} from '../services/oneSignal';

import { sendOfficerNotification } from '../services/oneSignalNotification';

interface HeaderProps {
  isOfficer: boolean;
  setIsOfficer: (val: boolean) => void;

  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;

  isSyncing?: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  urgentTaskCount?: number;

  theme?: 'light' | 'dark' | 'pink' | 'purple' | 'green';

  setTheme?: (
    val: 'light' | 'dark' | 'pink' | 'purple' | 'green'
  ) => void;

  onLogout?: () => void;
}

type SimplePomodoroMode = 'focus' | 'break';

function formatNotificationTime(
  timestamp: AppNotification['createdAt']
) {
  if (!timestamp) return 'Baru saja';

  const date = timestamp.toDate();
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
  theme = 'light',
  setTheme,
  onLogout,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  // DRAWER & MODAL STATES
  const [isQuickDrawerOpen, setIsQuickDrawerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isRequestingPush, setIsRequestingPush] = useState(false);

  // STATE FORM OFFICER
  const [isOfficerFormOpen, setIsOfficerFormOpen] = useState(false);
  const [officerTargetNrp, setOfficerTargetNrp] = useState('');
  const [officerTitle, setOfficerTitle] = useState('');
  const [officerMessage, setOfficerMessage] = useState('');
  const [isSendingOfficerNotif, setIsSendingOfficerNotif] = useState(false);

  // --- SEAMLESS POMODORO STATE ---
  const [pomoMode, setPomoMode] = useState<SimplePomodoroMode>('focus');
  const [focusDuration, setFocusDuration] = useState<number>(25);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  const targetNrp = useMemo(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('mymbud_user_nrp') || '' : '';
  }, []);

  useEffect(() => {
    if (!targetNrp) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeNotifications(targetNrp, setNotifications);
    return () => unsubscribe();
  }, [targetNrp]);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.isRead).length;
  }, [notifications]);

  // Play Alarm Sound
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

  // Timer Tick & Window Event Broadcast
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

  // Sync document title
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (isRunning) {
      document.title = `(${formatted}) ${pomoMode === 'focus' ? '🔥 Focus' : '☕ Break'} • myMbud Portal`;
    } else {
      document.title = 'myMbud Portal';
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

  const handleEnablePush = async () => {
    if (isRequestingPush) return;
    setIsRequestingPush(true);
    try {
      await requestOneSignalPermission();
    } finally {
      setIsRequestingPush(false);
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
      <header className="sticky top-0 z-30 w-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md text-slate-800 dark:text-zinc-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none dark:border-b dark:border-zinc-800/80 transition-colors pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between">
          {/* LOGO */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <img src="/logombud.png" alt="Logo myMbud" className="h-8 w-auto object-contain" />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight group-hover:text-blue-600 transition-colors">
                  <span className="font-light">my</span>Mbud<span className="font-light"> Portal</span>
                </h1>
                <span className="text-xs font-normal text-slate-400">v2.5</span>
                {isOfficer && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 animate-pulse ml-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>MODE PJ</span>
                  </span>
                )}
              </div>
            </div>
          </motion.button>

          {/* ACTIONS */}
          <div className="flex items-center gap-2">
            {/* NOTIFICATION BELL */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsNotificationOpen((prev) => !prev);
                  setIsQuickDrawerOpen(false);
                }}
                className="relative p-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-all flex items-center justify-center cursor-pointer"
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

            {/* ADAPTIVE POMODORO TIMER / HAMBURGER TRIGGER */}
            <motion.button
              layout
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setIsQuickDrawerOpen(true);
                setIsNotificationOpen(false);
              }}
              className={`relative transition-all flex items-center justify-center cursor-pointer select-none ${
                isRunning
                  ? pomoMode === 'focus'
                    ? 'px-3 py-2 sm:px-3.5 sm:py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-mono gap-1.5 shadow-xs'
                    : 'px-3 py-2 sm:px-3.5 sm:py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-mono gap-1.5 shadow-xs'
                  : 'p-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200'
              }`}
              title="Menu & Fokus"
              aria-label="Menu & Fokus"
            >
              {isRunning ? (
                <>
                  <span className="relative flex h-2 w-2">
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

      {/* NOTIFICATION MODAL (PORTAL) */}
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
                  className="fixed top-16 left-4 right-4 sm:left-auto sm:right-6 sm:top-16 sm:w-[380px] max-w-md mx-auto bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-2xl z-[99999] overflow-hidden"
                >
                  <div className="px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Notifikasi</h2>
                        
                        {isOfficer && (
                          <button
                            onClick={() => setIsOfficerFormOpen(!isOfficerFormOpen)}
                            className={`p-1.5 rounded-lg transition-all ${
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
                      <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
                        <CheckCheck className="w-3.5 h-3.5" /> Tandai semua
                      </button>
                    )}
                  </div>

                  {/* FORM BROADCAST OFFICER */}
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
                              className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold hover:bg-indigo-500 transition-all flex items-center gap-1 active:scale-95"
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
                              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{isSendingOfficerNotif ? 'Mengirim Broadcast...' : 'Kirim Pesan'}</span>
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="px-3 pt-3">
                    <button onClick={handleEnablePush} disabled={isRequestingPush} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 transition-all text-left disabled:opacity-60">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <BellRing className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                          {isRequestingPush ? 'Memproses...' : 'Aktifkan Push Notification'}
                        </p>
                        <p className="text-[9px] text-blue-500/80 dark:text-blue-400/70 mt-0.5">
                          Terima notifikasi meski myMbud tidak sedang dibuka
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="max-h-[350px] sm:max-h-[430px] overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 mx-auto flex items-center justify-center text-slate-400">
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
                          className={`w-full text-left p-3 rounded-2xl transition-all ${
                            notification.isRead
                              ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/60'
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
                  className="fixed top-0 right-0 bottom-0 z-[99999] w-full max-w-[320px] bg-white dark:bg-zinc-950 border-l border-slate-200/80 dark:border-zinc-800/80 shadow-2xl flex flex-col justify-between overflow-hidden"
                >
                  {/* Header Drawer */}
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Timer className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                        POMODORO TIMER
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsQuickDrawerOpen(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body Konten Drawer */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                    
                    {/* SECTION 1: SEAMLESS POMODORO */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl">
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
                          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            soundEnabled
                              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                              : 'text-slate-400 dark:text-zinc-600 bg-slate-100 dark:bg-zinc-800'
                          }`}
                          title={soundEnabled ? 'Suara Aktif' : 'Suara Muted'}
                        >
                          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Display Card Minimalis */}
                      <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                        pomoMode === 'focus'
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
                          : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">
                          {pomoMode === 'focus' ? <Flame className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                          <span>{pomoMode === 'focus' ? 'Sesi Belajar' : 'Istirahat'}</span>
                        </div>

                        {/* Digit Countdown & Stepper */}
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

                        {/* Action Buttons */}
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

                    {/* SECTION 2: 1-ROW VIBRANT THEME PICKER */}
                    {setTheme && (
                      <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block text-center">
                          Tema Warna
                        </span>

                        <div className="flex items-center justify-between gap-1.5 p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-2xl">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setTheme('light')}
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              theme === 'light'
                                ? 'bg-amber-500/20 ring-2 ring-amber-500 shadow-xs'
                                : 'hover:bg-amber-500/10'
                            }`}
                            title="Light Mode"
                          >
                            <Sun className="w-4.5 h-4.5 text-amber-500" />
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setTheme('dark')}
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-indigo-500/20 ring-2 ring-indigo-500 shadow-xs'
                                : 'hover:bg-indigo-500/10'
                            }`}
                            title="Dark Mode"
                          >
                            <Moon className="w-4.5 h-4.5 text-indigo-400" />
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setTheme('pink')}
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              theme === 'pink'
                                ? 'bg-pink-500/20 ring-2 ring-pink-500 shadow-xs'
                                : 'hover:bg-pink-500/10'
                            }`}
                            title="Pink Theme"
                          >
                            <Sparkles className="w-4.5 h-4.5 text-pink-500" />
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setTheme('purple')}
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              theme === 'purple'
                                ? 'bg-purple-500/20 ring-2 ring-purple-500 shadow-xs'
                                : 'hover:bg-purple-500/10'
                            }`}
                            title="Purple Theme"
                          >
                            <Palette className="w-4.5 h-4.5 text-purple-500" />
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setTheme('green')}
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              theme === 'green'
                                ? 'bg-emerald-500/20 ring-2 ring-emerald-500 shadow-xs'
                                : 'hover:bg-emerald-500/10'
                            }`}
                            title="Green Theme"
                          >
                            <Leaf className="w-4.5 h-4.5 text-emerald-600" />
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Drawer (Logout) */}
                  {onLogout && (
                    <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50">
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

      {/* SECRET PIN MODAL */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 10 }} className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-5 relative">
              <button onClick={() => setShowPinModal(false)} className="absolute top-5 right-5 p-2 rounded-2xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"><X className="w-4 h-4" /></button>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center"><KeyRound className="w-6 h-6" /></div>
                <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Apakah kamu PJ?!</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Jika iya, masukkan PIN untuk masuk mode kelola data.</p>
              </div>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <input type="password" maxLength={6} autoFocus required value={pinInput} onChange={(e) => { setPinInput(e.target.value); if (pinError) setPinError(false); }} placeholder="• • • • • •" className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 transition-all border ${pinError ? 'border-red-500 bg-red-50/50' : 'border-slate-200 dark:border-zinc-700 focus:ring-blue-500'}`} />
                {pinError && <p className="text-[11px] font-semibold text-red-600 text-center flex items-center justify-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /><span>PIN salah. Silakan coba lagi ya.</span></p>}
                <div className="flex items-center gap-2 pt-1">
                  <button type="button" onClick={() => setShowPinModal(false)} className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 transition-all">Batal</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="flex-1 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all">Verifikasi</motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};