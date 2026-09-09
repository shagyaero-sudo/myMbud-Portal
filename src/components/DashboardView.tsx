import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Pencil,
  Zap,
  Building2,
  Coffee,
  MessageSquare,
  BookOpenCheck,
  Handshake,
  FileSpreadsheet,
  LayoutGrid,
  ClipboardList,
  GraduationCap,
  Dices,
  Calculator,
  FileEdit,
  Award,
  X,
  User,
  PhoneCall,
  Info,
  Bell,
  BellRing,
  CheckCheck,
  Sun,
  Moon,
  LogOut,
  Lock,
  Check,
  ShieldCheck,
  Plus,
  Megaphone,
  Send,
  Users
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { AppState, DayOfWeek, ScheduleItem } from '../types';
import {
  syncUserStreak,
  getLocalStreak,
  UserStreak,
} from '../services/streakService';
import { subscribeToGlobalUnread } from '../services/firebaseChat';
import { StreakModal, GlossyFlameIcon } from './StreakModal';
import {
  AppNotification,
  subscribeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notifications';
import { sendOfficerNotification } from '../services/oneSignalNotification';

const IS_FRS_WAR_ACTIVE = false;
const FRS_DIRECT_URL = 'https://mia.its.ac.id/rencana-studi/';

interface DashboardViewProps {
  state: AppState;
  isOfficer: boolean;
  onAddAnnouncement?: (announcement: any) => void;
  onDeleteAnnouncement?: (id: string) => void;
  onNavigateTab: (
    tab: 'tasks' | 'contacts' | 'materials' | 'spinwheel' | 'calculator' | 'letter' | 'mbudiary' | 'mbudtalk' | 'blockblast' | any,
    courseFilterOrTaskId?: string
  ) => void;
  onOpenGpaModal?: () => void;
  onLogout?: () => void;
  setIsOfficer?: (value: boolean) => void;
}

type ThemeMode = 'light' | 'dark';
type ThemeAccent = 'blue' | 'purple' | 'pink' | 'orange' | 'green' | 'teal' | 'cyan';

const NATIONAL_HOLIDAYS_2026: Record<string, string> = {
  '2026-01-01': 'Tahun Baru 2026 Masehi',
  '2026-01-16': 'Isra Mikraj Nabi Muhammad SAW',
  '2026-02-17': 'Tahun Baru Imlek 2577 Kongzili',
  '2026-03-19': 'Hari Suci Nyepi (Tahun Baru Saka 1948)',
  '2026-03-21': 'Hari Raya Idul Fitri 1447 H',
  '2026-03-22': 'Hari Raya Idul Fitri 1447 H',
  '2026-04-03': 'Wafat Jesus Kristus (Jumat Agung)',
  '2026-04-05': 'Kebangkitan Yesus Kristus (Paskah)',
  '2026-05-01': 'Hari Buruh Internasional',
  '2026-05-14': 'Kenaikan Yesus Kristus',
  '2026-05-27': 'Hari Raya Idul Adha 1447 H',
  '2026-05-31': 'Hari Raya Waisak 2570 BE',
  '2026-06-16': 'Tahun Baru Islam 1448 H',
  '2026-08-17': 'Hari Kemerdekaan Republik Indonesia',
  '2026-08-24': 'Maulid Nabi Muhammad SAW',
  '2026-12-25': 'Hari Raya Natal',
};

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

const getCurrentAcademicWeek = () => {
  const startDate = new Date('2026-08-31T00:00:00+07:00');
  const now = new Date();
  const diffTime = now.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: 'mode libur',
      badgeClass: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/50 text-rose-600 dark:text-rose-400',
    };
  }

  const weekNumber = Math.floor(diffDays / 7) + 1;
  return {
    label: `Pekan ke-${weekNumber}`,
    badgeClass: 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-200/60 dark:border-blue-900/50 text-blue-600 dark:text-blue-400',
  };
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  isOfficer,
  onNavigateTab,
  onOpenGpaModal,
  onLogout,
  setIsOfficer
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [showMoreMenuModal, setShowMoreMenuModal] = useState(false);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<ScheduleItem | null>(null);

  // STATE MODAL OFFICER PIN (MODE EDIT PJ)
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // NOTIFICATION STATE
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // OFFICER BROADCAST NOTIFICATION STATE
  const [isOfficerFormOpen, setIsOfficerFormOpen] = useState(false);
  const [officerTargetNrp, setOfficerTargetNrp] = useState('');
  const [officerTitle, setOfficerTitle] = useState('');
  const [officerMessage, setOfficerMessage] = useState('');
  const [isSendingOfficerNotif, setIsSendingOfficerNotif] = useState(false);

  // STREAK & CHAT STATE
  const [streakData, setStreakData] = useState<UserStreak>(getLocalStreak);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState<boolean>(false);

  // THEME STATE
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('mymbud_theme_mode') as ThemeMode) || 'dark';
    }
    return 'dark';
  });
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('mymbud_theme_accent') as ThemeAccent) || 'blue';
    }
    return 'blue';
  });

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());

  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('mymbud_user_photo_url') || null : null;
  });

  const currentUserNrp = typeof window !== 'undefined' ? (localStorage.getItem('mymbud_user_nrp') || '').trim().toLowerCase() : '';
  const userName = typeof window !== 'undefined' ? localStorage.getItem('mymbud_user_name') || 'Mbuders' : 'Mbuders';

  const todayActualName = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  }, []);

  const formattedTodayDateShort = useMemo(() => {
    const date = new Date();
    const daysShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthsShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    
    const dayName = daysShort[date.getDay()];
    const dayNum = date.getDate();
    const monthName = monthsShort[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${dayNum} ${monthName} ${year}`;
  }, []);

  useEffect(() => {
    if (!currentUserNrp || currentUserNrp === 'unknown') {
      setNotifications([]);
      return;
    }
    const unsubscribe = subscribeNotifications(currentUserNrp, setNotifications);
    return () => unsubscribe();
  }, [currentUserNrp]);

  const unreadNotifCount = useMemo(() => {
    return notifications.filter((notification) => !notification.isRead).length;
  }, [notifications]);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
      } catch (error) {
        console.error('[Notifications] Failed to mark as read:', error);
      }
    }
    setIsNotificationOpen(false);

    const data = notification.data || {};
    if (data.postId) localStorage.setItem('mbud_target_post_id', data.postId);
    if (data.actorNrp) localStorage.setItem('mbud_target_actor_nrp', data.actorNrp);
    onNavigateTab('mbudiary');
  };

  const handleMarkAllRead = async () => {
    if (!currentUserNrp || unreadNotifCount === 0) return;
    try {
      await markAllNotificationsAsRead(currentUserNrp);
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

      alert(officerTargetNrp.toUpperCase() === 'ALL' ? 'Notifikasi broadcast berhasil dikirim ke seluruh teman!' : 'Notifikasi berhasil dikirim!');
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

  const handleApplyTheme = (mode: ThemeMode, accent: ThemeAccent) => {
    setThemeMode(mode);
    setThemeAccent(accent);

    localStorage.setItem('mymbud_theme_mode', mode);
    localStorage.setItem('mymbud_theme_accent', accent);

    const root = document.documentElement;
    root.setAttribute('data-mode', mode);
    root.setAttribute('data-accent', accent);

    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // VERIFIKASI PIN OFFICER (SINKRON DENGAN PIN HEADER 1234/2025/2026)
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === '2025' || pinInput === '2026') {
      if (setIsOfficer) {
        setIsOfficer(true);
      }
      setIsOfficerModalOpen(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('PIN salah! Silakan coba lagi.');
    }
  };

  const parseTargetNrps = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          const str = String(item).trim();
          const match = str.match(/\d{7,14}/);
          return match ? match[0] : str.toLowerCase();
        })
        .filter(Boolean);
    }
    if (typeof raw === 'string') {
      const clean = raw.replace(/[{}"']/g, '');
      return clean
        .split(/[\n,]+/)
        .map((item) => {
          const str = item.trim();
          const match = str.match(/\d{7,14}/);
          return match ? match[0] : str.toLowerCase();
        })
        .filter(Boolean);
    }
    return [];
  };

  const visibleSchedules = useMemo(() => {
    const cleanUserNrp = currentUserNrp.trim().toLowerCase();

    return state.schedules.filter((s: any) => {
      const targets = parseTargetNrps(s.target_nrps || s.targetNrps);

      if (targets.length > 0) {
        if (!cleanUserNrp || cleanUserNrp === 'unknown') return false;
        return targets.includes(cleanUserNrp);
      }

      return true;
    });
  }, [state.schedules, currentUserNrp]);

  const ALL_DAYS: DayOfWeek[] = useMemo(
    () => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    []
  );

  const dayTabs: DayOfWeek[] = useMemo(() => {
    return ALL_DAYS.filter((day) =>
      visibleSchedules.some((s) => s.day === day)
    );
  }, [visibleSchedules, ALL_DAYS]);

  useEffect(() => {
    if (dayTabs.includes(todayActualName as DayOfWeek)) {
      setSelectedDay(todayActualName as DayOfWeek);
    } else {
      setSelectedDay(null);
    }
  }, [dayTabs, todayActualName]);

  useEffect(() => {
    if (!currentUserNrp || currentUserNrp === 'unknown') return;

    syncUserStreak(currentUserNrp, userName).then(({ streak, isFirstVisitToday }) => {
      setStreakData(streak);
      if (isFirstVisitToday) {
        setIsStreakModalOpen(true);
      }
    });

    const refreshStreak = () => {
      setStreakData(getLocalStreak());
    };

    window.addEventListener('mbud_streak_change', refreshStreak);
    return () => window.removeEventListener('mbud_streak_change', refreshStreak);
  }, [currentUserNrp, userName]);

  useEffect(() => {
    if (!currentUserNrp || currentUserNrp === 'unknown') return;

    const unsubscribe = subscribeToGlobalUnread(currentUserNrp, (unread) => {
      setHasUnreadChat(unread);
    });

    return () => unsubscribe();
  }, [currentUserNrp]);

  useEffect(() => {
    const handleProfileChange = () => {
      const storedUrl = localStorage.getItem('mymbud_user_photo_url');
      if (storedUrl) setUserAvatarUrl(storedUrl);
    };

    window.addEventListener('mbud_user_change', handleProfileChange);
    window.addEventListener('mbud_users_change', handleProfileChange);

    if (currentUserNrp && currentUserNrp !== 'unknown') {
      const fetchAvatar = async () => {
        const { data } = await supabase
          .from('mbudiary_users')
          .select('photo_url')
          .eq('nrp', currentUserNrp)
          .maybeSingle();

        if (data && data.photo_url) {
          setUserAvatarUrl(data.photo_url);
          localStorage.setItem('mymbud_user_photo_url', data.photo_url);
        }
      };

      fetchAvatar();

      const channel = supabase
        .channel(`dashboard-avatar-${currentUserNrp}-${Math.random()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'mbudiary_users' },
          fetchAvatar
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('mbud_user_change', handleProfileChange);
        window.removeEventListener('mbud_users_change', handleProfileChange);
      };
    }

    return () => {
      window.removeEventListener('mbud_user_change', handleProfileChange);
      window.removeEventListener('mbud_users_change', handleProfileChange);
    };
  }, [currentUserNrp]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();

  const handlePrevMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonth + 1, 1));

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const formatDateKey = (dateObj: Date) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getTasksForDate = (targetDate: Date) => {
    return state.tasks.filter((task) => {
      const taskDate = new Date(task.deadline);
      return isSameDay(taskDate, targetDate);
    });
  };

  const getDayNameFromDate = (targetDate: Date): DayOfWeek | null => {
    const mapDays: DayOfWeek[] = ['Minggu' as any, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu' as any];
    return mapDays[targetDate.getDay()];
  };

  const selectedDateTasks = getTasksForDate(selectedCalendarDate);
  const selectedDateDayName = getDayNameFromDate(selectedCalendarDate);
  
  const startOfSemester = new Date('2026-08-31T00:00:00');
  const endOfSemesterLimit = new Date('2026-12-18T23:59:59');

  const isWithinSemesterPeriod = (dateObj: Date) => {
    const time = dateObj.getTime();
    return time >= startOfSemester.getTime() && time <= endOfSemesterLimit.getTime();
  };

  const selectedDateSchedules = isWithinSemesterPeriod(selectedCalendarDate)
    ? visibleSchedules
        .filter((s) => s.day === selectedDateDayName)
        .sort((a, b) => {
          const startA = a.time.split('-')[0]?.trim() || '';
          const startB = b.time.split('-')[0]?.trim() || '';
          return startA.localeCompare(startB);
        })
    : [];

  const filteredSchedule = selectedDay
    ? visibleSchedules
        .filter((s) => s.day === selectedDay)
        .sort((a, b) => {
          const startA = a.time.split('-')[0]?.trim() || '';
          const startB = b.time.split('-')[0]?.trim() || '';
          return startA.localeCompare(startB);
        })
    : [];

  const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return `Pagi, ${userName}!`;
    if (hour >= 11 && hour < 15) return `Siang, ${userName}!`;
    if (hour >= 15 && hour < 18) return `Sore, ${userName}!`;
    return `Malam, ${userName}!`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-5 pb-8 lg:pb-2"
    >
      {/* QUICK ACTIONS BAR JIKA MODE PJ AKTIF */}
      {isOfficer && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-300">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight">Mode Edit PJ Aktif</p>
              <p className="text-[11px] opacity-80 truncate">Kamu memiliki akses penuh pengeditan data portal.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('tasks')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kelola Tugas</span>
            </button>
            <button
              onClick={() => setIsOfficer && setIsOfficer(false)}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Keluar Mode PJ
            </button>
          </div>
        </motion.div>
      )}

      {/* BANNER WAR FRS DIRECT BYPASS */}
      {IS_FRS_WAR_ACTIVE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 p-0.5 shadow-xl shadow-red-500/20"
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl animate-pulse" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl animate-pulse" />

          <div className="relative rounded-[22px] bg-slate-950/80 backdrop-blur-xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>WAR FRS: 18 - 21 AGUSTUS</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                RENCANA STUDI (FRS) by MIA ITS
              </h3>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                Klik tombol buat langsung menuju ke medan perang!
              </p>
            </div>

            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href={FRS_DIRECT_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/30 transition-all shrink-0 cursor-pointer border border-amber-300/60 active:scale-95"
            >
              <span className="text-lg">🚀</span>
              <span>WAR NOW!</span>
            </motion.a>
          </div>
        </motion.div>
      )}

      {/* HEADER MOBILE & DESKTOP GREETING INTEGRATION */}
      <div className="block lg:hidden space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => onNavigateTab('mbudiary')}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-slate-200/80 dark:border-zinc-700 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-transform"
              title="Ke mBudiary"
            >
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt="Foto Profil" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-200">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
            </button>

            <div className="min-w-0">
              <button
                onClick={() => setIsOfficerModalOpen(true)}
                className="group flex items-center gap-1.5 text-left focus:outline-none cursor-pointer"
              >
                <h2 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight leading-tight truncate group-hover:text-blue-500 transition-colors">
                  {getGreetingText()}
                </h2>
                {isOfficer && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    PJ
                  </span>
                )}
              </button>
              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                <CalendarIcon className="w-3 h-3 text-slate-400 dark:text-zinc-500 shrink-0" />
                <span className="truncate">{formattedTodayDateShort}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsStreakModalOpen(true)}
              className="relative flex items-center h-9 pl-6 pr-3 rounded-full bg-slate-900/80 dark:bg-zinc-800/80 backdrop-blur-md border border-white/10 shadow-xs transition-all cursor-pointer select-none group"
            >
              <div className="absolute -left-2 -top-1 w-8 h-10 pointer-events-none group-hover:scale-110 transition-transform">
                <GlossyFlameIcon className="w-full h-full" streakCount={streakData.currentStreak} />
              </div>
              <span className="text-xs font-extrabold text-white tracking-tight tabular-nums ml-0.5">
                {streakData.currentStreak}
              </span>
            </motion.button>

            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative w-9 h-9 rounded-full bg-slate-900/80 dark:bg-zinc-800/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-200 active:scale-95 transition-transform cursor-pointer"
              title="Notifikasi"
            >
              {unreadNotifCount > 0 ? (
                <BellRing className="w-4 h-4 text-slate-200" />
              ) : (
                <Bell className="w-4 h-4 text-slate-300" />
              )}
              {unreadNotifCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* 4 BENTO BUTTONS MOBILE */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <a
            href="https://classroom.its.ac.id/auth/oidc"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex items-center gap-3 hover:bg-white/90 dark:hover:bg-zinc-850 transition-all active:scale-95 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 block truncate">
                myITS Classroom
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">
                Materi & Tugas
              </span>
            </div>
          </a>

          <a
            href="https://kemahasiswaan.its.ac.id/beranda"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex items-center gap-3 hover:bg-white/90 dark:hover:bg-zinc-850 transition-all active:scale-95 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Handshake className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 block truncate">
                myITS StudentConnect
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">
                SKEM Portofolio
              </span>
            </div>
          </a>

          <a
            href="https://mia.its.ac.id/"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex items-center gap-3 hover:bg-white/90 dark:hover:bg-zinc-850 transition-all active:scale-95 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 block truncate">
                myITS Academics
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">
                Cek Nilai / Isi FRS
              </span>
            </div>
          </a>

          <button
            onClick={() => setShowMoreMenuModal(true)}
            className="p-3.5 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex items-center gap-3 hover:bg-white/90 dark:hover:bg-zinc-850 transition-all active:scale-95 cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 block truncate">
                Menu Lainnya
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">
                Tema, Fitur, dll..
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* PC & MOBILE MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
        
        {/* KOLOM KIRI: BAR MBUDTALK + JADWAL PERKULIAHAN */}
        <div className="space-y-4 sm:space-y-5">

          {/* BAR INPUT MBUDTALK / MBUDIARY DESKTOP */}
          <div className="hidden lg:flex items-center gap-2.5 sm:gap-3">
            <motion.div
              whileHover={{ scale: 1.004 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onNavigateTab('mbudiary')}
              className="group flex-1 h-14 relative overflow-hidden rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 px-3.5 sm:px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none cursor-pointer transition-all flex items-center"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-zinc-700/60 shrink-0">
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt="Profil Saya" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-200">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex items-center justify-between gap-2.5 text-slate-400 dark:text-zinc-500 min-w-0">
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 truncate">
                    Ada cerita apa, {userName.split(' ')[0]}?
                  </span>
                  <Pencil className="w-4 h-4 text-slate-400 dark:text-zinc-400 shrink-0" />
                </div>
              </div>
            </motion.div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigateTab('mbudtalk')}
              title="Buka mbudTalk"
              className="relative w-14 h-14 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-white/90 dark:hover:bg-zinc-800/80 transition-all shrink-0 cursor-pointer"
            >
              <MessageSquare
                className={`w-6 h-6 transition-all duration-300 ${
                  hasUnreadChat
                    ? 'text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400'
                    : 'text-slate-500 dark:text-zinc-400 fill-none'
                }`}
              />
              
              {hasUnreadChat && (
                <span className="absolute top-3 right-3 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900"></span>
                </span>
              )}
            </motion.button>
          </div>

          {/* JADWAL PERKULIAHAN */}
          <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none space-y-3.5 transition-all">
            
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                Jadwal Perkuliahan
              </h3>

              {(() => {
                const weekInfo = getCurrentAcademicWeek();
                return (
                  <div className={`px-3 py-1 border rounded-full flex items-center justify-center shadow-xs transition-colors ${weekInfo.badgeClass}`}>
                    <span className="text-xs font-bold">
                      {weekInfo.label}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* TAB HARI DINAMIS */}
            <div 
              className="grid gap-1 p-1 bg-slate-100/70 dark:bg-zinc-800/60 rounded-2xl w-full border border-slate-200/40 dark:border-white/5"
              style={{ gridTemplateColumns: `repeat(${Math.max(dayTabs.length, 1)}, minmax(0, 1fr))` }}
            >
              {dayTabs.map((day) => {
                const isActive = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`relative w-full py-2 px-1 text-[11px] sm:text-xs text-center font-bold rounded-xl transition-all duration-150 cursor-pointer select-none ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                    }`}
                  >
                    <span>{day}</span>
                  </button>
                );
              })}
            </div>

            {/* KETERANGAN BANTUAN PRESENSI PANDUAN SISWA */}
            <div className="px-3.5 py-2 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100/80 dark:border-blue-900/50 flex items-center gap-2 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
              <Info className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>
                <strong>Tombol presensi dengan tampilan terbaru! 👇</strong>
              </span>
            </div>

            {/* KONTEN JADWAL MODEREN */}
            <div className="space-y-3 pt-1">
              {selectedDay === null ? (
                <div className="p-8 text-center space-y-3 bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl border border-slate-200/40 dark:border-white/5">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100">
                      Tidak ada perkuliahan pada hari {todayActualName}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                      {dayTabs.length > 0 
                        ? 'Klik tab hari di atas untuk melihat jadwal perkuliahan pekan ini' 
                        : 'Nikmati waktu istirahatmu!'}
                    </p>
                  </div>
                </div>
              ) : filteredSchedule.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl border border-slate-200/30 dark:border-white/5">
                  Tidak ada kelas di hari {selectedDay}.
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedDay}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {filteredSchedule.map((item) => (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        key={item.id}
                        className="relative overflow-hidden p-5 rounded-3xl bg-white/70 dark:bg-zinc-800/50 hover:bg-white/90 dark:hover:bg-zinc-800/80 transition-all border border-slate-200/60 dark:border-white/10 shadow-xs flex items-center justify-between gap-4 group"
                      >
                        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-blue-500/10 dark:bg-blue-400/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                        <div className="absolute right-10 -top-8 w-20 h-20 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 blur-lg pointer-events-none" />

                        <div className="space-y-2 min-w-0 flex-1 relative z-10">
                          {/* RUANGAN SAJA DI DALAM BADGE ROUNDED CIRCLE, JAM TANPA BADGE DENGAN WARNA PUTIH/TERANG */}
                          <div className="inline-flex items-center gap-2 text-[11px] font-bold">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400">
                              <Building2 className="w-3 h-3 stroke-[2.2]" />
                              <span>{item.room}</span>
                            </span>
                            <span className="opacity-40 text-slate-400 dark:text-zinc-500">•</span>
                            <span className="text-slate-800 dark:text-white font-semibold">{item.time}</span>
                          </div>

                          <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-zinc-100 leading-snug max-w-[220px] sm:max-w-[280px]">
                            {item.course}
                          </h3>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedCourseDetail(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors cursor-pointer group/btn pt-0.5"
                            >
                              <span>Dosen / PJ</span>
                              <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                            </button>

                            {/* AKSI EDIT PJ LANGSUNG PADA ITEM JADWAL */}
                            {isOfficer && (
                              <button
                                onClick={() => onNavigateTab('contacts', item.course)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 transition-colors cursor-pointer"
                                title="Edit data matkul/kontak ini"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                                <span>Edit Data</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="relative z-10 shrink-0">
                          <a
                            href={
                              item.attendanceUrl && item.attendanceUrl.trim() !== ''
                                ? item.attendanceUrl
                                : 'https://mia.its.ac.id/presensi/'
                            }
                            target="_blank"
                            rel="noreferrer"
                            title="Input Presensi"
                            className="flex items-center justify-center sm:px-4 py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 active:scale-95 transition-all cursor-pointer border border-blue-400/30 group/presensi"
                          >
                            <UserCheck className="w-5 h-5 shrink-0" />
                            <span className="hidden sm:inline-block text-xs font-bold ml-2 whitespace-nowrap">
                              Presensi
                            </span>
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: WIDGET KALENDER BUILD-IN */}
        <div className="space-y-4 sm:space-y-5">
          <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none space-y-5 transition-all">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                  Kalender
                </h3>
              </div>

              <div className="flex items-center bg-slate-100/70 dark:bg-zinc-800/60 rounded-xl p-0.5 shrink-0 border border-slate-200/40 dark:border-white/5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                  aria-label="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 px-2 min-w-[90px] sm:min-w-[100px] text-center select-none">
                  {currentMonthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                  aria-label="Bulan Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-200/40 dark:border-white/5 pb-2">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((dayName, idx) => (
                  <span 
                    key={dayName} 
                    className={`text-[11px] font-bold uppercase ${idx === 6 ? 'text-rose-600 dark:text-rose-500' : 'text-slate-400 dark:text-zinc-500'}`}
                  >
                    {dayName}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: firstDayOfMonth(currentYear, currentMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10 sm:h-12 rounded-2xl bg-transparent" />
                ))}

                {Array.from({ length: daysInMonth(currentYear, currentMonth) }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateObj = new Date(currentYear, currentMonth, dayNum);
                  const isToday = isSameDay(dateObj, new Date());
                  const isSelected = isSameDay(dateObj, selectedCalendarDate);
                  
                  const dateKey = formatDateKey(dateObj);
                  const holidayName = NATIONAL_HOLIDAYS_2026[dateKey];
                  const isHoliday = Boolean(holidayName);

                  const dayTasks = getTasksForDate(dateObj);
                  const hasTasks = dayTasks.length > 0;
                  
                  const dayName = getDayNameFromDate(dateObj);
                  const hasSchedulesOnDay = visibleSchedules.some((s) => s.day === dayName);
                  const isCourseActive = isWithinSemesterPeriod(dateObj) && hasSchedulesOnDay;

                  return (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      key={dayNum}
                      title={holidayName || undefined}
                      onClick={() => setSelectedCalendarDate(dateObj)}
                      className={`relative h-10 sm:h-12 rounded-2xl flex flex-col items-center justify-center transition-all select-none border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-black border-blue-600 shadow-md shadow-blue-500/30'
                          : isToday
                          ? 'bg-blue-50/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold border-blue-200 dark:border-blue-800'
                          : isHoliday
                          ? 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold border-rose-200/60 dark:border-rose-900/40'
                          : 'bg-white/50 dark:bg-zinc-800/40 hover:bg-white/80 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-transparent'
                      }`}
                    >
                      <span className={`text-xs sm:text-sm leading-none ${isHoliday && !isSelected ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
                        {dayNum}
                      </span>

                      <div className="flex items-center justify-center gap-1 mt-1">
                        {isHoliday && !isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title={holidayName} />
                        )}
                        {isCourseActive && !isHoliday && (
                          <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                        )}
                        {hasTasks && (
                          <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-rose-500'}`} />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Panel Ringkasan Agenda */}
            <div className="pt-3 border-t border-slate-200/40 dark:border-white/5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  <span>Agenda: </span>
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                    {selectedCalendarDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')}
                  </span>
                </span>

                <button
                  onClick={() => onNavigateTab('tasks')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>List Tugas &gt;</span>
                </button>
              </div>

              {NATIONAL_HOLIDAYS_2026[formatDateKey(selectedCalendarDate)] && (
                <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
                  <span>🎉 Libur Nasional: {NATIONAL_HOLIDAYS_2026[formatDateKey(selectedCalendarDate)]}</span>
                </div>
              )}

              <div className="space-y-2">
                {selectedDateSchedules.length === 0 && selectedDateTasks.length === 0 && !NATIONAL_HOLIDAYS_2026[formatDateKey(selectedCalendarDate)] ? (
                  <div className="p-4 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl border border-slate-200/30 dark:border-white/5">
                    Tiada jadwal kuliah atau deadline di tanggal ini.
                  </div>
                ) : (
                  <>
                    {selectedDateSchedules.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100/80 dark:border-blue-900/50 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-3">
                          <span className="font-bold text-blue-900 dark:text-blue-200 block truncate">{s.course}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-blue-600 dark:text-blue-400 block">{s.time}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-zinc-400 justify-end">
                            <Building2 className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
                            <span>{s.room}</span>
                          </span>
                        </div>
                      </div>
                    ))}

                    {selectedDateTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onNavigateTab('tasks')}
                        className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100/80 dark:border-rose-900/50 flex items-center justify-between text-xs cursor-pointer hover:bg-rose-100/60 transition-colors"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <span className="font-bold text-rose-900 dark:text-rose-200 block truncate">{t.title}</span>
                          <span className="text-[11px] text-rose-700 dark:text-rose-400 block truncate">{t.course}</span>
                        </div>
                        <span className="font-bold px-2 py-1 rounded-xl bg-rose-600 text-white text-[10px] shrink-0">
                          Deadline {new Date(t.deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streak={streakData}
        userName={userName}
        onStreakUpdate={(updated) => setStreakData(updated)}
      />

      {/* MODAL INPUT PIN OFFICER (MODE EDIT PJ) */}
      {isOfficerModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16171b] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                <Lock className="w-5 h-5 text-blue-500" />
                <h3>Akses Mode Edit PJ</h3>
              </div>
              <button
                onClick={() => {
                  setIsOfficerModalOpen(false);
                  setPinError('');
                  setPinInput('');
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isOfficer ? (
              <div className="space-y-4 text-center">
                <p className="text-xs text-slate-600 dark:text-zinc-300">
                  Kamu sedang dalam Mode PJ (Bisa mengubah jadwal, kontak & tugas).
                </p>
                <button
                  onClick={() => {
                    if (setIsOfficer) setIsOfficer(false);
                    setIsOfficerModalOpen(false);
                  }}
                  className="w-full py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Keluar Mode PJ
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyPin} className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Masukkan PIN khusus pengurus untuk mengaktifkan fitur edit portal.
                </p>
                <div>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Masukkan PIN..."
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm text-center tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  {pinError && (
                    <p className="text-[11px] text-red-500 mt-1 text-center">
                      {pinError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Verifikasi PIN
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL NOTIFIKASI DASHBOARD */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isNotificationOpen && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsNotificationOpen(false)}
                  className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="relative z-10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-slate-200/40 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                          Notifikasi
                        </h3>

                        {unreadNotifCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-500">
                            {unreadNotifCount} baru
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                        Riwayat aktivitas & pesan terbaru
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOfficer && (
                        <button
                          onClick={() => setIsOfficerFormOpen(!isOfficerFormOpen)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                            isOfficerFormOpen 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 hover:bg-indigo-100'
                          }`}
                          title="Kirim Pengumuman Broadcast"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          <span>Pengumuman</span>
                        </button>
                      )}

                      {unreadNotifCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors cursor-pointer mr-1"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>Tandai</span>
                        </button>
                      )}

                      <button
                        onClick={() => setIsNotificationOpen(false)}
                        className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* FORM BROADCAST PENGUMUMAN PJ */}
                  <AnimatePresence>
                    {isOfficer && isOfficerFormOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pt-3 overflow-hidden"
                      >
                        <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">Target Penerima:</span>
                            <button
                              type="button"
                              onClick={() => setOfficerTargetNrp('ALL')}
                              className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-500 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <Users className="w-3 h-3" />
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
                              <span>{isSendingOfficerNotif ? 'Mengirim Broadcast...' : 'Kirim Pengumuman'}</span>
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="max-h-[380px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100/80 dark:bg-zinc-900 mx-auto flex items-center justify-center text-slate-400">
                          <Bell className="w-6 h-6" />
                        </div>
                        <p className="mt-3 text-xs font-bold text-slate-700 dark:text-zinc-300">
                          Belum ada notifikasi
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Notifikasi aktivitas terbaru akan muncul di sini.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer border ${
                            notification.isRead
                              ? 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900'
                              : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-100/60 dark:border-blue-900/40 hover:bg-blue-100/60'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="pt-1 shrink-0">
                              <span className={`block w-2 h-2 rounded-full ${notification.isRead ? 'bg-transparent' : 'bg-blue-500'}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className={`text-xs leading-tight ${notification.isRead ? 'font-semibold text-slate-700 dark:text-zinc-300' : 'font-bold text-slate-900 dark:text-zinc-100'}`}>
                                  {notification.title}
                                </p>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                                  {formatNotificationTime(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400 mt-1 break-words">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* MODAL DETAIL MATAKULIAH */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {selectedCourseDetail && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedCourseDetail(null)}
                  className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
                />

                <motion.div 
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="relative z-10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-white/40 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden"
                >
                  <div className="px-6 py-5 border-b border-slate-200/40 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                          Detail Mata Kuliah
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Informasi Pengajar & Penanggung Jawab
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCourseDetail(null)}
                      className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                        {selectedCourseDetail.course}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 pt-1">
                        <span>{selectedCourseDetail.sks} SKS</span>
                        <span>•</span>
                        <span>Ruang {selectedCourseDetail.room}</span>
                        <span>•</span>
                        <span>{selectedCourseDetail.time} WIB</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block px-1">
                        Dosen Pengampu
                      </span>
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 space-y-2">
                        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                          <User className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>{selectedCourseDetail.lecturer || 'Belum ditentukan'}</span>
                        </div>
                        {selectedCourseDetail.lecturer2 && selectedCourseDetail.lecturer2.trim() !== '' && (
                          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 pt-1 border-t border-slate-200/40 dark:border-zinc-800">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>{selectedCourseDetail.lecturer2}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block px-1">
                        Penanggung Jawab (PJ)
                      </span>
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                          {selectedCourseDetail.pjMatkul ? selectedCourseDetail.pjMatkul.replace(/\s*08\d+/g, '') : 'Belum ada PJ'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const courseName = selectedCourseDetail.course;
                        setSelectedCourseDetail(null);
                        onNavigateTab('contacts', courseName);
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 mt-2"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Hubungi via Direktori Kontak</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* MODAL MENU LAINNYA */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showMoreMenuModal && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMoreMenuModal(false)}
                  className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
                />

                <motion.div 
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="relative z-10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-white/40 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                >
                  <div className="px-6 py-5 border-b border-slate-200/40 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-900/50">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                        Menu & Pengaturan Portal
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                        Akses layanan, alat bantu & personalisasi
                      </p>
                    </div>

                    <button
                      onClick={() => setShowMoreMenuModal(false)}
                      className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                    
                    {/* myITS ACADEMICS 2.0 */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 tracking-wider px-1">
                        <span className="lowercase">my</span>ITS PORTAL
                      </p>

                      <div className="grid grid-cols-1 gap-2">
                        <a
                          href="https://akademik.its.ac.id/home.php"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold"
                        >
                          <span className="flex items-center gap-2.5 truncate">
                            <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="truncate">SIAKAD v1.0</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </a>

                        <a
                          href="https://wali.its.ac.id/"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold"
                        >
                          <span className="flex items-center gap-2.5 truncate">
                            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="truncate">myITS Wali</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </a>
                      </div>
                    </div>

                    {/* TOOLS LAINNYA */}
                    <div className="space-y-2 pt-1 border-t border-slate-200/50 dark:border-white/5">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                        TOOLS LAINNYA
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenuModal(false);
                            onNavigateTab('spinwheel');
                          }}
                          className="flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 active:bg-blue-100"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Dices className="w-4 h-4 shrink-0" />
                            <span className="truncate">Spinwheel</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenuModal(false);
                            onNavigateTab('calculator');
                          }}
                          className="flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 active:bg-indigo-100"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Calculator className="w-4 h-4 shrink-0" />
                            <span className="truncate">Kalkulator Nilai</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenuModal(false);
                            onNavigateTab('letter');
                          }}
                          className="flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 active:bg-emerald-100"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileEdit className="w-4 h-4 shrink-0" />
                            <span className="truncate">Surat Turlap</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenuModal(false);
                            if (onOpenGpaModal) onOpenGpaModal();
                          }}
                          className="flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 active:bg-amber-100"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Award className="w-4 h-4 shrink-0" />
                            <span className="truncate">Hitung IP</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        </button>
                      </div>
                    </div>

                    {/* PERSONALISASI TAMPILAN KOMPAK DI PALING BAWAH */}
                    <div className="pt-3 border-t border-slate-200/50 dark:border-white/5 space-y-2.5">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                        PERSONALISASI TAMPILAN
                      </p>

                      <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 p-2 rounded-2xl border border-slate-200/60 dark:border-white/5">
                        <div className="flex bg-slate-200/60 dark:bg-zinc-800/80 p-0.5 rounded-xl">
                          <button
                            onClick={() => handleApplyTheme('light', themeAccent)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              themeMode === 'light'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-500 dark:text-zinc-400'
                            }`}
                          >
                            <Sun className="w-3.5 h-3.5" />
                            <span>Terang</span>
                          </button>
                          <button
                            onClick={() => handleApplyTheme('dark', themeAccent)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              themeMode === 'dark'
                                ? 'bg-zinc-700 text-white shadow-xs'
                                : 'text-slate-500 dark:text-zinc-400'
                            }`}
                          >
                            <Moon className="w-3.5 h-3.5" />
                            <span>Gelap</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 pr-1">
                          {(['blue', 'purple', 'pink', 'orange', 'green', 'cyan'] as ThemeAccent[]).map((accent) => {
                            const colorMap: Record<ThemeAccent, string> = {
                              blue: 'bg-blue-500',
                              purple: 'bg-purple-500',
                              pink: 'bg-pink-500',
                              orange: 'bg-orange-500',
                              green: 'bg-emerald-500',
                              teal: 'bg-teal-500',
                              cyan: 'bg-cyan-500',
                            };

                            return (
                              <button
                                key={accent}
                                onClick={() => handleApplyTheme(themeMode, accent)}
                                className={`w-5 h-5 rounded-full ${colorMap[accent]} flex items-center justify-center transition-transform ${
                                  themeAccent === accent ? 'scale-110 ring-2 ring-white dark:ring-zinc-400' : 'opacity-70 hover:opacity-100'
                                }`}
                              >
                                {themeAccent === accent && <Check className="w-3 h-3 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* TOMBOL KELUAR AKUN */}
                    {onLogout && (
                      <div className="pt-2 border-t border-slate-200/50 dark:border-white/5">
                        <button
                          onClick={() => {
                            setShowMoreMenuModal(false);
                            onLogout();
                          }}
                          className="w-full py-2.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-500/20 active:scale-95"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Keluar Akun</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </motion.div>
  );
};