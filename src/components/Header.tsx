import React, { useEffect, useMemo, useState } from 'react';

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

function formatNotificationTime(
  timestamp: AppNotification['createdAt']
) {
  if (!timestamp) {
    return 'Baru saja';
  }

  const date = timestamp.toDate();

  const now = new Date();

  const diffMs = now.getTime() - date.getTime();

  const diffSeconds = Math.floor(
    diffMs / 1000
  );

  const diffMinutes = Math.floor(
    diffSeconds / 60
  );

  const diffHours = Math.floor(
    diffMinutes / 60
  );

  const diffDays = Math.floor(
    diffHours / 24
  );

  if (diffSeconds < 60) {
    return 'Baru saja';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  if (diffDays < 7) {
    return `${diffDays} hari lalu`;
  }

  return date.toLocaleDateString(
    'id-ID',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
}

export const Header: React.FC<HeaderProps> = ({
  isOfficer,
  setIsOfficer,
  theme = 'light',
  setTheme,
  onLogout,
}) => {
  const [showPinModal, setShowPinModal] =
    useState(false);

  const [pinInput, setPinInput] =
    useState('');

  const [pinError, setPinError] =
    useState(false);

  const [isThemeDropdownOpen, setIsThemeDropdownOpen] =
    useState(false);

  const [isNotificationOpen, setIsNotificationOpen] =
    useState(false);

  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);

  const [isRequestingPush, setIsRequestingPush] =
    useState(false);

  /*
   * ==========================================================
   * USER NRP
   * ==========================================================
   */
  const targetNrp = useMemo(() => {
    return localStorage.getItem(
      'mymbud_user_nrp'
    ) || '';
  }, []);

  /*
   * ==========================================================
   * REALTIME FIRESTORE NOTIFICATIONS
   * ==========================================================
   */
  useEffect(() => {
    if (!targetNrp) {
      setNotifications([]);
      return;
    }

    const unsubscribe =
      subscribeNotifications(
        targetNrp,
        setNotifications
      );

    return () => {
      unsubscribe();
    };
  }, [targetNrp]);

  /*
   * ==========================================================
   * UNREAD COUNT
   * ==========================================================
   */
  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;
  }, [notifications]);

  /*
   * ==========================================================
   * LOGO / OFFICER
   * ==========================================================
   */
  const handleLogoClick = () => {
    if (isOfficer) {
      setIsOfficer(false);
    } else {
      setPinInput('');
      setPinError(false);
      setShowPinModal(true);
    }
  };

  /*
   * ==========================================================
   * PIN
   * ==========================================================
   */
  const handlePinSubmit = (
    e: React.FormEvent
  ) => {
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

  /*
   * ==========================================================
   * OPEN NOTIFICATION
   * ==========================================================
   */
  const handleNotificationClick = async (
    notification: AppNotification
  ) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(
          notification.id
        );
      } catch (error) {
        console.error(
          '[Notifications] Failed to mark as read:',
          error
        );
      }
    }
  };

  /*
   * ==========================================================
   * MARK ALL READ
   * ==========================================================
   */
  const handleMarkAllRead = async () => {
    if (!targetNrp || unreadCount === 0) {
      return;
    }

    try {
      await markAllNotificationsAsRead(
        targetNrp
      );
    } catch (error) {
      console.error(
        '[Notifications] Failed to mark all as read:',
        error
      );
    }
  };

  /*
   * ==========================================================
   * REQUEST ONESIGNAL PERMISSION
   * ==========================================================
   */
  const handleEnablePush = async () => {
    if (isRequestingPush) return;

    setIsRequestingPush(true);

    try {
      await requestOneSignalPermission();
    } finally {
      setIsRequestingPush(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md text-slate-800 dark:text-zinc-100 px-4 py-3.5 sm:px-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none dark:border-b dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* ==================================================
              LOGO
          ================================================== */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLogoClick}
            title={
              isOfficer
                ? 'Klik logo untuk keluar dari Mode Pengurus'
                : 'Akses Sistem myMbud'
            }
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <img
              src="/logombud.png"
              alt="Logo myMbud"
              className="h-8 w-auto object-contain"
            />

            <div>
              <div className="flex items-center gap-1.5">

                <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span className="font-light">
                    my
                  </span>
                  Mbud
                  <span className="font-light">
                    {' '}
                    Portal
                  </span>
                </h1>

                <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">
                  v2.5
                </span>

                {isOfficer && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 animate-pulse ml-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>MODE PJ</span>
                  </span>
                )}

              </div>
            </div>
          </motion.button>

          {/* ==================================================
              RIGHT HEADER ACTIONS
          ================================================== */}
          <div className="flex items-center gap-2">

            {/* =================================================
                NOTIFICATION BELL
            ================================================= */}
            <div className="relative">

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsNotificationOpen(
                    (prev) => !prev
                  );

                  setIsThemeDropdownOpen(false);
                }}
                className="relative p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-all flex items-center justify-center"
                title="Notifikasi"
                aria-label="Notifikasi"
              >

                {unreadCount > 0 ? (
                  <BellRing className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}

                {/* UNREAD DOT */}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />

                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-zinc-950" />
                  </span>
                )}

              </motion.button>

              {/* =================================================
                  NOTIFICATION PANEL (FIXED FOR MOBILE LAYOUT)
              ================================================= */}
              <AnimatePresence>
                {isNotificationOpen && (
                  <>
                    {/* Click outside */}
                    <div
                      className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-none"
                      onClick={() =>
                        setIsNotificationOpen(false)
                      }
                    />

                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.95,
                        y: -8,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        y: -8,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 28,
                      }}
                      className="fixed top-16 left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-3 sm:w-[380px] max-w-md mx-auto bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
                    >

                      {/* HEADER PANEL */}
                      <div className="px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">

                        <div>
                          <div className="flex items-center gap-2">

                            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                              Notifikasi
                            </h2>

                            {unreadCount > 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500">
                                {unreadCount} baru
                              </span>
                            )}

                          </div>

                          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                            Riwayat aktivitas myMbud
                          </p>
                        </div>

                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Tandai semua
                          </button>
                        )}

                      </div>

                      {/* =================================================
                          ENABLE PUSH
                      ================================================= */}
                      <div className="px-3 pt-3">

                        <button
                          onClick={handleEnablePush}
                          disabled={isRequestingPush}
                          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-all text-left disabled:opacity-60"
                        >

                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <BellRing className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                              {isRequestingPush
                                ? 'Memproses...'
                                : 'Aktifkan Push Notification'}
                            </p>

                            <p className="text-[9px] text-blue-500/80 dark:text-blue-400/70 mt-0.5">
                              Terima notifikasi meski myMbud tidak sedang dibuka
                            </p>
                          </div>

                        </button>

                      </div>

                      {/* =================================================
                          NOTIFICATION LIST
                      ================================================= */}
                      <div className="max-h-[350px] sm:max-h-[430px] overflow-y-auto p-3 space-y-1.5">

                        {notifications.length === 0 ? (
                          <div className="py-10 text-center">

                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 mx-auto flex items-center justify-center text-slate-400 dark:text-zinc-500">
                              <Bell className="w-5 h-5" />
                            </div>

                            <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                              Belum ada notifikasi
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500">
                              Semua aktivitas terbaru akan muncul di sini.
                            </p>

                          </div>
                        ) : (
                          notifications.map(
                            (notification) => (
                              <button
                                key={notification.id}
                                onClick={() =>
                                  handleNotificationClick(
                                    notification
                                  )
                                }
                                className={`w-full text-left p-3 rounded-2xl transition-all ${
                                  notification.isRead
                                    ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                                    : 'bg-blue-50/70 dark:bg-blue-950/25 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                                }`}
                              >

                                <div className="flex gap-3">

                                  {/* UNREAD DOT */}
                                  <div className="pt-1.5 shrink-0">
                                    <span
                                      className={`block w-2 h-2 rounded-full ${
                                        notification.isRead
                                          ? 'bg-transparent'
                                          : 'bg-blue-500'
                                      }`}
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1">

                                    <div className="flex items-start justify-between gap-3">

                                      <p
                                        className={`text-[11px] leading-tight ${
                                          notification.isRead
                                            ? 'font-semibold text-slate-700 dark:text-zinc-300'
                                            : 'font-bold text-slate-900 dark:text-zinc-100'
                                        }`}
                                      >
                                        {notification.title}
                                      </p>

                                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 whitespace-nowrap shrink-0">
                                        {formatNotificationTime(
                                          notification.createdAt
                                        )}
                                      </span>

                                    </div>

                                    <p className="text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400 mt-1 break-words">
                                      {notification.message}
                                    </p>

                                  </div>

                                </div>

                              </button>
                            )
                          )
                        )}

                      </div>

                    </motion.div>
                  </>
                )}
              </AnimatePresence>

            </div>

            {/* =================================================
                THEME BUTTON
            ================================================= */}
            {setTheme && (
              <div className="relative">

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsThemeDropdownOpen(
                      !isThemeDropdownOpen
                    );

                    setIsNotificationOpen(false);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-all flex items-center justify-center text-xs font-bold cursor-pointer"
                  title="Pilih Tema & Pengaturan"
                >
                  {theme === 'green' ? (
                    <Leaf className="w-5 h-5 text-emerald-600" />
                  ) : theme === 'purple' ? (
                    <Palette className="w-5 h-5 text-purple-500" />
                  ) : theme === 'pink' ? (
                    <Sparkles className="w-5 h-5 text-pink-500" />
                  ) : theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-400" />
                  )}
                </motion.button>

                <AnimatePresence>
                  {isThemeDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() =>
                          setIsThemeDropdownOpen(false)
                        }
                      />

                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.9,
                          y: -5,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.9,
                          y: -5,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="absolute right-0 mt-2 w-44 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
                      >

                        {/* LIGHT */}
                        <button
                          onClick={() => {
                            setTheme('light');
                            setIsThemeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all ${
                            theme === 'light'
                              ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-zinc-800/50'
                              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          <Sun className="w-4 h-4 text-amber-400" />
                          <span>Light</span>
                        </button>

                        {/* DARK */}
                        <button
                          onClick={() => {
                            setTheme('dark');
                            setIsThemeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all ${
                            theme === 'dark'
                              ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-zinc-800/50'
                              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          <Moon className="w-4 h-4 text-indigo-400" />
                          <span>Dark</span>
                        </button>

                        {/* PINK */}
                        <button
                          onClick={() => {
                            setTheme('pink');
                            setIsThemeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all ${
                            theme === 'pink'
                              ? 'text-pink-600 bg-pink-50'
                              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          <Sparkles className="w-4 h-4 text-pink-500" />
                          <span>Pink</span>
                        </button>

                        {/* PURPLE */}
                        <button
                          onClick={() => {
                            setTheme('purple');
                            setIsThemeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all ${
                            theme === 'purple'
                              ? 'text-purple-600 bg-purple-50'
                              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          <Palette className="w-4 h-4 text-purple-500" />
                          <span>Purple</span>
                        </button>

                        {/* GREEN */}
                        <button
                          onClick={() => {
                            setTheme('green');
                            setIsThemeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all ${
                            theme === 'green'
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          <Leaf className="w-4 h-4 text-emerald-600" />
                          <span>Green</span>
                        </button>

                        {/* LOGOUT */}
                        {onLogout && (
                          <>
                            <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

                            <button
                              onClick={() => {
                                setIsThemeDropdownOpen(false);
                                onLogout();
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:bg-rose-100 transition-all cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Log Out Akun</span>
                            </button>
                          </>
                        )}

                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

              </div>
            )}

          </div>
        </div>
      </header>

      {/* ======================================================
          SECRET PIN MODAL
      ====================================================== */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{
                scale: 0.9,
                opacity: 0,
                y: 10,
              }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
              }}
              exit={{
                scale: 0.9,
                opacity: 0,
                y: 10,
              }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 25,
              }}
              className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-5 relative"
            >

              <button
                onClick={() =>
                  setShowPinModal(false)
                }
                className="absolute top-5 right-5 p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2">

                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                  <KeyRound className="w-6 h-6" />
                </div>

                <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                  Apakah kamu PJ?!
                </h3>

                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Jika iya, masukkan PIN untuk masuk mode kelola data.
                </p>

              </div>

              <form
                onSubmit={handlePinSubmit}
                className="space-y-4"
              >

                <div>

                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    required
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(
                        e.target.value
                      );

                      if (pinError) {
                        setPinError(false);
                      }
                    }}
                    placeholder="• • • • • •"
                    className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 transition-all border border-slate-200 dark:border-zinc-700 ${
                      pinError
                        ? 'border-red-500 focus:ring-red-500 bg-red-50/50 dark:bg-red-950/30'
                        : 'focus:ring-blue-500'
                    }`}
                  />

                  {pinError && (
                    <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 text-center mt-2 flex items-center justify-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />

                      <span>
                        PIN salah. Silakan coba lagi.
                      </span>
                    </p>
                  )}

                </div>

                <div className="flex items-center gap-2 pt-1">

                  <button
                    type="button"
                    onClick={() =>
                      setShowPinModal(false)
                    }
                    className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    Batal
                  </button>

                  <motion.button
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    type="submit"
                    className="flex-1 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                  >
                    Verifikasi
                  </motion.button>

                </div>

              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};