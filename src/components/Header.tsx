import React, { useState, useEffect } from 'react';
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
  Heart,
  MessageSquare,
  Repeat,
  UserPlus,
} from 'lucide-react';
import { TabType } from './Sidebar';
import { MbudiaryNotification } from '../mbudiary/types';
import {
  getUserProfile,
  subscribeNotifications,
  markNotificationAsRead,
  getCachedUserByNrp,
} from '../mbudiary/lib/storage';

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
  setTheme?: (val: 'light' | 'dark' | 'pink' | 'purple' | 'green') => void;
  onLogout?: () => void;
  onSelectNotificationPost?: (postId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOfficer,
  setIsOfficer,
  theme = 'light',
  setTheme,
  onLogout,
  setActiveTab,
  onSelectNotificationPost,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  /* =========================================================
     NOTIFICATIONS REALTIME STATE
     ========================================================= */
  const [notifications, setNotifications] = useState<MbudiaryNotification[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  useEffect(() => {
    const user = getUserProfile();
    if (!user.nrp || user.nrp === 'unknown') return;

    const unsubscribe = subscribeNotifications(user.nrp, (notifs) => {
      setNotifications(notifs);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogoClick = () => {
    if (isOfficer) {
      setIsOfficer(false);
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

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md text-slate-800 dark:text-zinc-100 px-4 py-3.5 sm:px-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none dark:border-b dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
                  <span className="font-light">my</span>Mbud
                  <span className="font-light"> Portal</span>
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

          <div className="flex items-center gap-2">

            {/* =========================================================
                LONCENG NOTIFIKASI
                ========================================================= */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen);
                  setIsThemeDropdownOpen(false);
                }}
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-all flex items-center justify-center text-xs font-bold cursor-pointer relative"
                title="Notifikasi"
              >
                <Bell className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse border-2 border-white dark:border-zinc-950">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.button>

              {/* DROPDOWN NOTIFIKASI POPOVER */}
              <AnimatePresence>
                {isNotifDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsNotifDropdownOpen(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                      }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-2xl py-3 px-3 z-50 overflow-hidden space-y-2 max-h-[420px] flex flex-col"
                    >
                      {/* HEADER DROPDOWN */}
                      <div className="flex items-center justify-between pb-2 px-2 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-indigo-500" />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                            Notifikasi Portal
                          </h4>
                        </div>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40">
                            {unreadCount} baru
                          </span>
                        )}
                      </div>

                      {/* DAFTAR NOTIFIKASI */}
                      <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
                            Belum ada notifikasi masuk.
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const sender = getCachedUserByNrp(notif.senderNrp);

                            return (
                              <div
                                key={notif.id}
                                onClick={async () => {
                                  await markNotificationAsRead(notif.id);
                                  setIsNotifDropdownOpen(false);

                                  // Jika punya postId, langsung arahkan ke Mbudiary
                                  if (notif.postId) {
                                    if (setActiveTab) setActiveTab('mbudiary');
                                    if (onSelectNotificationPost) {
                                      onSelectNotificationPost(notif.postId);
                                    }
                                  } else if (notif.type === 'follow') {
                                    if (setActiveTab) setActiveTab('mbudiary');
                                  }
                                }}
                                className={`p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
                                  notif.isRead
                                    ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                                    : 'bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100/50'
                                }`}
                              >
                                {/* AVATAR SENDER */}
                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/60 dark:border-zinc-700/60 relative">
                                  {sender?.photoUrl ? (
                                    <img
                                      src={sender.photoUrl}
                                      alt={sender.nickname}
                                      className="w-full h-full object-cover rounded-xl"
                                    />
                                  ) : (
                                    <span className="text-base leading-none">
                                      {sender?.emoji || '😊'}
                                    </span>
                                  )}

                                  {/* ICON BADGE INTERAKSI */}
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm">
                                    {notif.type === 'like' && (
                                      <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                                    )}
                                    {notif.type === 'reply' && (
                                      <MessageSquare className="w-2.5 h-2.5 text-indigo-500 fill-indigo-500" />
                                    )}
                                    {notif.type === 'repost' && (
                                      <Repeat className="w-2.5 h-2.5 text-emerald-500" />
                                    )}
                                    {notif.type === 'follow' && (
                                      <UserPlus className="w-2.5 h-2.5 text-amber-500" />
                                    )}
                                  </div>
                                </div>

                                {/* DESKRIPSI & TEKS NOTIF */}
                                <div className="flex-1 min-w-0 text-xs leading-snug">
                                  <div className="text-slate-800 dark:text-zinc-200 truncate">
                                    <span className="font-bold">
                                      {sender?.nickname || 'Mbuders'}
                                    </span>{' '}
                                    <span className="text-slate-500 dark:text-zinc-400 font-normal">
                                      {notif.type === 'like' && 'menyukai postingan kamu'}
                                      {notif.type === 'reply' && 'membalas postingan kamu'}
                                      {notif.type === 'repost' && 'mengarahkan ulang cerita kamu'}
                                      {notif.type === 'follow' && 'mulai mengikuti kamu'}
                                    </span>
                                  </div>
                                </div>

                                {/* INDIKATOR UNREAD DOT */}
                                {!notif.isRead && (
                                  <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* TOGGLE TEMA & SETTINGS DROPDOWN */}
            {setTheme && (
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsThemeDropdownOpen(!isThemeDropdownOpen);
                    setIsNotifDropdownOpen(false);
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
                        onClick={() => setIsThemeDropdownOpen(false)}
                      />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="absolute right-0 mt-2 w-44 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
                      >
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

                        {/* Pembatas (Divider) & Tombol Keluar / Logout */}
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

      {/* Secret PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 25,
              }}
              className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-5 relative"
            >
              <button
                onClick={() => setShowPinModal(false)}
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

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    required
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (pinError) setPinError(false);
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
                      <span>PIN salah. Silakan coba lagi.</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPinModal(false)}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    Batal
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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