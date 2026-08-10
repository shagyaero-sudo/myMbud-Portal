import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  ChevronRight as ArrowRight,
  X,
  UserCheck,
  Pencil,
  BookOpenCheck,
  CheckCircle2,
  FolderKanban,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { AppState, DayOfWeek, Task, Announcement } from '../types';
import {
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  subscribeAnnouncements
} from '../services/announcements';

interface DashboardViewProps {
  state: AppState;
  isOfficer: boolean;
  onAddAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onNavigateTab: (
    tab: 'tasks' | 'contacts' | 'materials' | 'spinwheel' | 'calculator' | 'mbudiary' | any,
    courseFilterOrTaskId?: string
  ) => void;
}

interface AttachmentData {
  fileName: string;
  fileUrl: string;
}

// --- DAFTAR LIBUR NASIONAL / TANGGAL MERAH INDONESIA 2026 ---
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

// --- WIDGET KALENDER MINI HEADER ---
const FlipCalendarWidget: React.FC = () => {
  const now = new Date();
  const dayNumber = now.getDate();
  const monthName = now.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();

  return (
    <div className="flex flex-col items-center justify-between w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden shrink-0 transition-transform hover:scale-105 select-none">
      <div className="w-full bg-rose-600 dark:bg-rose-700 py-[4px] text-center shrink-0">
        <span className="text-[9px] font-black text-white tracking-widest uppercase leading-none block">
          {monthName}
        </span>
      </div>
      <div className="flex-1 w-full flex items-center justify-center leading-none pb-0.5">
        <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
          {dayNumber}
        </span>
      </div>
    </div>
  );
};

const getCurrentAcademicWeek = () => {
  const startDate = new Date('2026-08-31T00:00:00+07:00');
  const now = new Date();
  const diffTime = now.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: 'mode libur',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400'
    };
  }

  const weekNumber = Math.floor(diffDays / 7) + 1;
  return {
    label: `Minggu ke-${weekNumber}`,
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400'
  };
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  isOfficer,
  onNavigateTab,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Senin');
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);

  // --- STATE KALENDER BUILD-IN ---
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());

  const [realAnnouncements, setRealAnnouncements] = useState<Announcement[]>(state.announcements || []);

  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState<'Penting' | 'Akademik' | 'Kegiatan' | 'Info'>('Penting');
  const [newAnnPinned, setNewAnnPinned] = useState(true);

  const [selectedAnnModal, setSelectedAnnModal] = useState<Announcement | null>(null);

  const [mobileAnnIndex, setMobileAnnIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const totalAnn = realAnnouncements.length;
  const activeAnnIndex = Math.min(mobileAnnIndex, Math.max(0, totalAnn - 1));
  const currentMobileAnn = realAnnouncements[activeAnnIndex];

  useEffect(() => {
    const unsubscribe = subscribeAnnouncements((data) => {
      setRealAnnouncements(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (totalAnn <= 1 || isPaused || selectedAnnModal !== null) return;
    const interval = setInterval(() => {
      setMobileAnnIndex((prev) => (prev < totalAnn - 1 ? prev + 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, [totalAnn, isPaused, selectedAnnModal]);

  const handlePrevAnn = () => {
    if (totalAnn <= 1) return;
    setMobileAnnIndex((prev) => (prev > 0 ? prev - 1 : totalAnn - 1));
  };

  const handleNextAnn = () => {
    if (totalAnn <= 1) return;
    setMobileAnnIndex((prev) => (prev < totalAnn - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNextAnn();
      else handlePrevAnn();
    }
    setTouchStartX(null);
  };

  useEffect(() => {
    const days: DayOfWeek[] = ['Minggu' as DayOfWeek, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentDayIndex = new Date().getDay();
    const todayName = days[currentDayIndex];
    if (todayName && todayName !== ('Minggu' as DayOfWeek)) {
      setSelectedDay(todayName);
    }
  }, []);

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
  
  // RENTANG PERKULIAHAN SEMESTER (31 AGUSTUS - 18 DESEMBER 2026)
  const startOfSemester = new Date('2026-08-31T00:00:00');
  const endOfSemesterLimit = new Date('2026-12-18T23:59:59');

  const isWithinSemesterPeriod = (dateObj: Date) => {
    const time = dateObj.getTime();
    return time >= startOfSemester.getTime() && time <= endOfSemesterLimit.getTime();
  };

  const selectedDateSchedules = isWithinSemesterPeriod(selectedCalendarDate)
    ? state.schedules.filter((s) => s.day === selectedDateDayName)
    : [];

  const formatAnnouncementDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  // --- WHATSAPP FORMATTING SYNTAX PARSER ---
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    const formattedRegex = /(`[^`]+`|\*[^*]+\*|_[^_]+_|~[^~]+~|https?:\/\/[^\s]+)/g;
    const parts = content.split(formattedRegex);

    return parts.map((part, i) => {
      if (!part) return null;

      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code key={i} className="bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-[11px] font-mono text-pink-600 dark:text-pink-400">
            {part.slice(1, -1)}
          </code>
        );
      }

      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <strong key={i} className="font-extrabold text-slate-900 dark:text-zinc-100">
            {part.slice(1, -1)}
          </strong>
        );
      }

      if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
        return (
          <em key={i} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }

      if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
        return (
          <del key={i} className="line-through opacity-75">
            {part.slice(1, -1)}
          </del>
        );
      }

      if (part.match(/^https?:\/\/[^\s]+$/)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold break-all"
          >
            {part}
          </a>
        );
      }

      return part;
    });
  };

  const dayTabs: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  const filteredSchedule = state.schedules
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => {
      const startA = a.time.split('-')[0].trim();
      const startB = b.time.split('-')[0].trim();
      return startA.localeCompare(startB);
    });

  const handleOpenAddAnn = () => {
    setEditingAnnId(null);
    setNewAnnTitle('');
    setNewAnnContent('');
    setNewAnnCategory('Penting');
    setNewAnnPinned(true);
    setShowAnnModal(true);
  };

  const handleOpenEditAnn = (ann: Announcement) => {
    setEditingAnnId(ann.id);
    setNewAnnTitle(ann.title);
    setNewAnnContent(ann.content);
    setNewAnnCategory(ann.category);
    setNewAnnPinned(ann.pinned);
    setShowAnnModal(true);
  };

  const handleDeleteAnn = async (id: string) => {
    if (confirm('Apakah kamu yakin ingin menghapus pengumuman ini?')) {
      try {
        await deleteAnnouncement(id);
      } catch (err) {
        console.error('Gagal menghapus pengumuman:', err);
        alert('Gagal menghapus pengumuman.');
      }
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;

    setIsSubmittingAnn(true);
    try {
      if (editingAnnId) {
        await updateAnnouncement(editingAnnId, {
          title: newAnnTitle.trim(),
          content: newAnnContent.trim(),
          category: newAnnCategory,
          pinned: newAnnPinned,
        });
      } else {
        await addAnnouncement({
          title: newAnnTitle.trim(),
          content: newAnnContent.trim(),
          category: newAnnCategory,
          pinned: newAnnPinned,
        });
      }
      setNewAnnTitle('');
      setNewAnnContent('');
      setEditingAnnId(null);
      setShowAnnModal(false);
    } catch (error) {
      console.error('Gagal menyimpan pengumuman:', error);
      alert('Terjadi kesalahan saat menyimpan pengumuman.');
    } finally {
      setIsSubmittingAnn(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = localStorage.getItem('mymbud_user_name') || 'Mbuders'; 
    if (hour >= 4 && hour < 11) return `Selamat Pagi, ${userName}! 🌅`;
    if (hour >= 11 && hour < 15) return `Selamat Siang, ${userName}! ☀️`;
    if (hour >= 15 && hour < 18) return `Selamat Sore, ${userName}! ☕`;
    return `Selamat Malam, ${userName}! 🌙`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-28 sm:pb-32"
    >
      <div className="block lg:hidden px-2 pt-2 pb-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              {getGreeting()}
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Siap untuk produktif hari ini?
            </p>
          </div>
          <FlipCalendarWidget />
        </div>
      </div>

      {/* Mobile Announcements Carousel */}
      <div className="block lg:hidden bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-2.5 transition-colors">
        {isOfficer && (
          <div className="flex justify-end pb-1">
            <button
              onClick={handleOpenAddAnn}
              className="px-2.5 py-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat</span>
            </button>
          </div>
        )}

        {totalAnn === 0 ? (
          <div className="p-4 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/70 dark:bg-zinc-800/40 rounded-2xl">
            Belum ada pengumuman kelas.
          </div>
        ) : (
          <div className="space-y-2">
            <motion.div
              layout
              key={currentMobileAnn?.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => setSelectedAnnModal(currentMobileAnn)}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-zinc-800/70 border border-slate-100 dark:border-zinc-800/80 space-y-1.5 transition-all select-none cursor-pointer hover:bg-slate-100/80 dark:hover:bg-zinc-800 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full text-[10px]">
                  {currentMobileAnn?.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                    {formatAnnouncementDate(currentMobileAnn?.date)}
                  </span>
                  {isOfficer && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditAnn(currentMobileAnn);
                        }}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnn(currentMobileAnn.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 line-clamp-1">
                {currentMobileAnn?.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-2">
                {renderFormattedContent(currentMobileAnn?.content)}
              </p>
            </motion.div>

            {totalAnn > 1 && (
              <div className="flex items-center justify-center gap-2.5 pt-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevAnn();
                  }}
                  className="p-1 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-zinc-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-1.5">
                  {realAnnouncements.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMobileAnnIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        idx === activeAnnIndex
                          ? 'w-5 bg-blue-600 dark:bg-blue-400'
                          : 'w-1.5 bg-slate-300 dark:bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextAnn();
                  }}
                  className="p-1 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-zinc-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* MBUDIARY BANNER — HANYA TAMPIL DI MOBILE/TAB */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.2 }}
            onClick={() => onNavigateTab('mbudiary' as any)}
            className="block lg:hidden w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 pink:from-pink-500 pink:to-rose-500 purple:from-purple-600 purple:to-fuchsia-600 green:from-emerald-600 green:to-teal-600 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
            title="Ceritakan di mbudiary. #SejutaCerita"
          >
            <Pencil className="w-4 h-4 shrink-0" />
            <span className="text-xs sm:text-sm font-black tracking-tight">
              Ceritakan di mbudiary.
            </span>
            <span className="text-xs sm:text-sm font-normal opacity-90">
              #SejutaCerita
            </span>
          </motion.button>

          {/* 1. JADWAL PERKULIAHAN */}
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 transition-colors">
            
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

            <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100/80 dark:bg-zinc-800/80 rounded-2xl w-full">
              {dayTabs.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative w-full py-2 px-1 text-[11px] sm:text-xs text-center font-medium rounded-xl transition-all ${
                    selectedDay === day
                      ? 'text-white font-bold'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  {selectedDay === day && (
                    <motion.div
                      layoutId="activeDayBg"
                      className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-500/20"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{day}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              {filteredSchedule.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/70 dark:bg-zinc-800/40 rounded-2xl">
                  Tidak ada jadwal perkuliahan untuk hari {selectedDay}.
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
                        whileHover={{ scale: 1.005 }}
                        key={item.id}
                        className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 hover:bg-slate-100/60 dark:hover:bg-zinc-800 transition-all flex flex-col space-y-3 border border-slate-100 dark:border-zinc-800/80"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-snug pr-2">
                              {item.course}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                              Dosen: {item.lecturer}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                              PJ: {item.pjMatkul.replace(/\s*08\d+/g, '')}
                            </p>
                          </div>

                          <div className="flex flex-col items-end shrink-0 text-right space-y-1">
                            <span className="text-[11px] text-slate-500 dark:text-zinc-400 mb-0.5">
                              {item.sks} SKS
                            </span>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              {item.room}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 font-sans whitespace-nowrap">
                              {item.time}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 w-full">
                          <a
                            href="https://presensi.its.ac.id/dashboard"
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Presensi / Kehadiran</span>
                          </a>

                          <button
                            onClick={() => onNavigateTab('contacts', item.course)}
                            className="shrink-0 px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 text-[11px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1"
                          >
                            <span>Kontak</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* 2. WIDGET KALENDER BUILD-IN */}
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-6 transition-colors">
            {/* Header Kalender: Title & Slider Sejajar di Pojok Kanan */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                  Kalender
                </h3>
              </div>

              {/* Slider Bulan di Pojok Kanan */}
              <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-xl p-0.5 shrink-0">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                  aria-label="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 px-2 min-w-[90px] sm:min-w-[100px] text-center select-none">
                  {currentMonthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                  aria-label="Bulan Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid Kalender Bulanan */}
            <div className="space-y-2">
              {/* Nama Hari (SEN - MIN, MIN berwarna merah) */}
              <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-100 dark:border-zinc-800 pb-2">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((dayName, idx) => (
                  <span 
                    key={dayName} 
                    className={`text-[11px] font-bold uppercase ${idx === 6 ? 'text-rose-600 dark:text-rose-500' : 'text-slate-400 dark:text-zinc-500'}`}
                  >
                    {dayName}
                  </span>
                ))}
              </div>

              {/* Tanggal Grid */}
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
                  
                  // DOT HANYA MUNCUL JIKA DALAM PERIODE 31 AGUSTUS - 18 DESEMBER 2026 & BUKAN SABTU/MINGGU
                  const isCourseActive = isWithinSemesterPeriod(dateObj) && getDayNameFromDate(dateObj) !== ('Minggu' as any) && getDayNameFromDate(dateObj) !== ('Sabtu' as any);

                  return (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      key={dayNum}
                      title={holidayName || undefined}
                      onClick={() => setSelectedCalendarDate(dateObj)}
                      className={`relative h-10 sm:h-12 rounded-2xl flex flex-col items-center justify-center transition-all select-none border ${
                        isSelected
                          ? 'bg-blue-600 text-white font-black border-blue-600 shadow-md shadow-blue-500/30'
                          : isToday
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold border-blue-200 dark:border-blue-800'
                          : isHoliday
                          ? 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold border-rose-200/60 dark:border-rose-900/40'
                          : 'bg-slate-50/60 dark:bg-zinc-800/40 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-transparent'
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

            {/* Panel Ringkasan Agenda Tanggal Terpilih */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  <span>Agenda: </span>
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                    {selectedCalendarDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')}
                  </span>
                </span>

                <button
                  onClick={() => onNavigateTab('tasks')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>List Tugas &gt;</span>
                </button>
              </div>

              {NATIONAL_HOLIDAYS_2026[formatDateKey(selectedCalendarDate)] && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
                  <span>🎉 Libur Nasional: {NATIONAL_HOLIDAYS_2026[formatDateKey(selectedCalendarDate)]}</span>
                </div>
              )}

              <div className="space-y-2">
                {selectedDateSchedules.length === 0 && selectedDateTasks.length === 0 && !NATIONAL_HOLIDAYS_2026[formatDateKey(selectedCalendarDate)] ? (
                  <div className="p-4 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/70 dark:bg-zinc-800/40 rounded-2xl">
                    Tidak ada jadwal kuliah maupun deadline tugas di tanggal ini.
                  </div>
                ) : (
                  <>
                    {selectedDateSchedules.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-blue-900 dark:text-blue-200 block">{s.course}</span>
                          <span className="text-[11px] text-blue-700 dark:text-blue-400">Dosen: {s.lecturer}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-blue-600 dark:text-blue-400 block">{s.time}</span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400">{s.room}</span>
                        </div>
                      </div>
                    ))}

                    {selectedDateTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onNavigateTab('tasks')}
                        className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 flex items-center justify-between text-xs cursor-pointer hover:bg-rose-100/60 transition-colors"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <span className="font-bold text-rose-900 dark:text-rose-200 block truncate">{t.title}</span>
                          <span className="text-[11px] text-rose-700 dark:text-rose-400 block">{t.course}</span>
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

        {/* Right Column: Announcements */}
        <div className="hidden lg:block space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                  Pengumuman
                </h3>
              </div>

              {isOfficer && (
                <button
                  onClick={handleOpenAddAnn}
                  className="px-3 py-1.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {realAnnouncements.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/70 dark:bg-zinc-800/40 rounded-2xl">
                  Belum ada pengumuman kelas.
                </div>
              ) : (
                realAnnouncements.map((ann) => (
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    key={ann.id}
                    onClick={() => setSelectedAnnModal(ann)}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 space-y-1.5 border border-slate-100 dark:border-zinc-800 cursor-pointer hover:bg-slate-100/90 dark:hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full">
                        {ann.category}
                      </span>
                      {isOfficer && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditAnn(ann);
                            }}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnn(ann.id);
                            }}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 pt-1 group-hover:text-blue-600 transition-colors">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-2">
                      {renderFormattedContent(ann.content)}
                    </p>
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 pt-1">
                      {formatAnnouncementDate(ann.date)}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create / Edit Announcement */}
      <AnimatePresence>
        {showAnnModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  {editingAnnId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAnnouncement} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Judul Pengumuman
                    </label>
                    <input
                      type="text"
                      required
                      value={newAnnTitle}
                      onChange={(e) => setNewAnnTitle(e.target.value)}
                      placeholder="Misal: Perubahan Jadwal / Info Makrab"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Kategori
                    </label>
                    <select
                      value={newAnnCategory}
                      onChange={(e) => setNewAnnCategory(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Penting">Penting</option>
                      <option value="Akademik">Akademik</option>
                      <option value="Kegiatan">Kegiatan</option>
                      <option value="Info">Info Umum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Isi Pesan / Informasi
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={newAnnContent}
                      onChange={(e) => setNewAnnContent(e.target.value)}
                      placeholder="Tuliskan instruksi atau pengumuman lengkap untuk teman-teman..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="pinCheck"
                      checked={newAnnPinned}
                      onChange={(e) => setNewAnnPinned(e.target.checked)}
                      className="rounded-lg border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="pinCheck" className="text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                      Sematkan (Pin) di bagian teratas
                    </label>
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-zinc-900">
                  <button
                    type="button"
                    disabled={isSubmittingAnn}
                    onClick={() => setShowAnnModal(false)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmittingAnn}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
                  >
                    {isSubmittingAnn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : editingAnnId ? (
                      'Simpan Perubahan'
                    ) : (
                      'Terbitkan Pengumuman'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Announcement Detail */}
      <AnimatePresence>
        {selectedAnnModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-start justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900">
                <div className="pr-2 space-y-1">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
                    {selectedAnnModal.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 pt-1">
                    {selectedAnnModal.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Diterbitkan: {formatAnnouncementDate(selectedAnnModal.date)} •{' '}
                    {selectedAnnModal.author || 'Pengurus Kelas'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAnnModal(null)}
                  className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                <div className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/80 p-4 rounded-2xl leading-relaxed whitespace-pre-line border border-slate-100 dark:border-zinc-700/60">
                  {renderFormattedContent(selectedAnnModal.content)}
                </div>
              </div>

              <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
                {isOfficer ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const ann = selectedAnnModal;
                        setSelectedAnnModal(null);
                        handleOpenEditAnn(ann);
                      }}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        const annId = selectedAnnModal.id;
                        setSelectedAnnModal(null);
                        handleDeleteAnn(annId);
                      }}
                      className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={() => setSelectedAnnModal(null)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING BUTTON MBUDIARY KHUSUS DESKTOP (POJOK KANAN BAWAH) */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => onNavigateTab('mbudiary' as any)}
        className="hidden lg:flex fixed bottom-10 right-10 z-40 items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200 shadow-2xl transition-all cursor-pointer group"
        title="mbudiary #RuangAman"
      >
        <Pencil className="w-5 h-5 text-zinc-100 dark:text-zinc-900 shrink-0" />
        <div className="text-left flex flex-col justify-center pr-1">
          <span className="text-base font-black tracking-tight text-zinc-100 dark:text-zinc-900 leading-none">
            mbudiary.
          </span>
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 leading-tight mt-1">
            #RuangAman
          </span>
        </div>
      </motion.button>
    </motion.div>
  );
};