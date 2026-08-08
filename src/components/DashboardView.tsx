import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Pin,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Flame,
  BookOpen,
  Paperclip,
  X,
  UserCheck,
  Download,
  File as FileIcon,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookHeart,
  Pencil,
  CalendarDays
} from 'lucide-react';
import { AppState, DayOfWeek, Task, Announcement, ScheduleItem } from '../types';
import {
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  subscribeAnnouncements // Tambahkan import subscribeAnnouncements di sini
} from '../services/announcements';

interface DashboardViewProps {
  state: AppState;
  isOfficer: boolean;
  onAddAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onNavigateTab: (
    tab: 'tasks' | 'contacts' | 'materials' | 'spinwheel' | 'calculator' | 'mbudiary' | any,
    courseFilter?: string
  ) => void;
}

interface AttachmentData {
  fileName: string;
  fileUrl: string;
}

// --- KOMPONEN WIDGET KALENDER MINI (MINIMALIS & CLEAN) ---
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

// --- LOGIKA KALKULASI MINGGU AKADEMIK + STYLE DINAMIS ---
const getCurrentAcademicWeek = () => {
  const startDate = new Date('2026-08-31T00:00:00+07:00');
  const now = new Date();
  const diffTime = now.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: 'di luar masa perkuliahan',
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

  // --- STATE REAL-TIME UNTUK PENGUMUMAN DARI FIRESTORE ---
  const [realAnnouncements, setRealAnnouncements] = useState<Announcement[]>(state.announcements || []);

  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState<
    'Penting' | 'Akademik' | 'Kegiatan' | 'Info'
  >('Penting');
  const [newAnnPinned, setNewAnnPinned] = useState(true);

  const [selectedTaskModal, setSelectedTaskModal] = useState<Task | null>(null);
  const [selectedAnnModal, setSelectedAnnModal] = useState<Announcement | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentData | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const [mobileAnnIndex, setMobileAnnIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Ganti referensi dari state.announcements menjadi realAnnouncements
  const totalAnn = realAnnouncements.length;
  const activeAnnIndex = Math.min(mobileAnnIndex, Math.max(0, totalAnn - 1));
  const currentMobileAnn = realAnnouncements[activeAnnIndex];

  // --- EFFECT UNTUK BERLANGGANAN DATA PENGUMUMAN SECARA REAL-TIME ---
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
      if (diff > 0) {
        handleNextAnn();
      } else {
        handlePrevAnn();
      }
    }
    setTouchStartX(null);
  };

  useEffect(() => {
    const days: DayOfWeek[] = [
      'Minggu' as DayOfWeek,
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
    ];
    const currentDayIndex = new Date().getDay();
    const todayName = days[currentDayIndex];
    if (todayName && todayName !== ('Minggu' as DayOfWeek)) {
      setSelectedDay(todayName);
    }
  }, []);

  const now = Date.now();
  const upcomingTasks = state.tasks
    .filter((t) => t.status !== 'done' && new Date(t.deadline).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

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

  const formatDeadlineDetails = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return (
      d.toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB'
    );
  };

  const getPillBadge = (deadlineStr: string) => {
    const nowDate = new Date();
    const deadline = new Date(deadlineStr);
    const todayStart = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate()
    ).getTime();
    const deadlineStart = new Date(
      deadline.getFullYear(),
      deadline.getMonth(),
      deadline.getDate()
    ).getTime();
    const diffDays = Math.round(
      (deadlineStart - todayStart) / (1000 * 3600 * 24)
    );

    if (diffDays < 0) {
      return {
        label: 'Tenggat Lewat',
        badgeClass:
          'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 font-bold',
      };
    } else if (diffDays <= 2) {
      const dayText = diffDays <= 0 ? 'H-0' : `H-${diffDays}`;
      return {
        label: `Mendesak ${dayText}`,
        badgeClass:
          'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 animate-pulse font-bold',
      };
    } else if (diffDays <= 5) {
      return {
        label: `Mepet H-${diffDays}`,
        badgeClass:
          'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 font-bold',
      };
    } else {
      return {
        label: `Masih H-${diffDays}`,
        badgeClass:
          'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50 font-bold',
      };
    }
  };

  const renderFormattedContent = (content: string) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
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

  const getAttachmentData = (attachment: any): AttachmentData | null => {
    if (!attachment) return null;
    if (typeof attachment === 'string') {
      return {
        fileName:
          attachment.split('/').pop()?.split('?')[0] || 'Dokumen Lampiran',
        fileUrl: attachment,
      };
    }
    const fileUrl = attachment.fileUrl || attachment.url || '';
    if (!fileUrl) return null;
    return {
      fileName: attachment.fileName || 'Dokumen Lampiran',
      fileUrl,
    };
  };

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const isImageFile = (fileName: string) => {
    return [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'bmp',
      'svg',
      'avif',
    ].includes(getFileExtension(fileName));
  };

  const isPdfFile = (fileName: string) => {
    return getFileExtension(fileName) === 'pdf';
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
          author: 'Pengurus Kelas A',
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
      className="space-y-6 pb-12"
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

      {/* Mobile & Tablet Announcements Carousel */}
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
                        title="Edit Pengumuman"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnn(currentMobileAnn.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                        title="Hapus Pengumuman"
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
                  aria-label="Pengumuman sebelumnya"
                  className="p-1 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-1.5">
                  {realAnnouncements.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMobileAnnIndex(idx)}
                      aria-label={`Ke pengumuman ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        idx === activeAnnIndex
                          ? 'w-5 bg-blue-600 dark:bg-blue-400'
                          : 'w-1.5 bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400 dark:hover:bg-zinc-600'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextAnn();
                  }}
                  aria-label="Pengumuman selanjutnya"
                  className="p-1 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
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
          {/* Jadwal Kuliah */}
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

          {/* Upcoming Tasks Section */}
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                  Daftar Tugas
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>Lihat Semua ({upcomingTasks.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/70 dark:bg-zinc-800/40 rounded-2xl">
                  Tidak ada tugas mendatang.
                </div>
              ) : (
                upcomingTasks.map((task) => {
                  const badge = getPillBadge(task.deadline);
                  const deadlineFormatted = formatDeadlineDetails(task.deadline);
                  return (
                    <motion.div
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                      key={task.id}
                      onClick={() => setSelectedTaskModal(task)}
                      className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-transparent hover:border-blue-100 dark:hover:border-zinc-700 group"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {task.title}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-700 dark:text-zinc-300">
                            {task.course}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500 dark:text-zinc-400 font-medium">
                            {deadlineFormatted}
                          </span>
                        </div>
                      </div>

                      {badge && (
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.badgeClass}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Announcements (Sekarang Menggunakan realAnnouncements) */}
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
                            title="Edit Pengumuman"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnn(ann.id);
                            }}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                            title="Hapus Pengumuman"
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

      {/* Modal: Task Detail */}
      <AnimatePresence>
        {selectedTaskModal && (
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
                <div className="pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
                      {selectedTaskModal.type} • {selectedTaskModal.course}
                    </span>
                    {getPillBadge(selectedTaskModal.deadline) && (
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${getPillBadge(selectedTaskModal.deadline)?.badgeClass}`}>
                        {getPillBadge(selectedTaskModal.deadline)?.label}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mt-2">{selectedTaskModal.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedTaskModal(null)}
                  className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                <div className="bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-2xl text-xs border border-slate-100 dark:border-zinc-800 space-y-2">
                  <div>
                    <span className="text-slate-400 dark:text-zinc-400 block mb-0.5">Dosen:</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {selectedTaskModal.assigner || 'Dosen Pengampu'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/50 dark:border-zinc-700/50">
                    <span className="text-slate-400 dark:text-zinc-400 block mb-0.5">Tenggat:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {formatDeadlineDetails(selectedTaskModal.deadline)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider mb-1">Rincian Tugas</h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/80 p-4 rounded-2xl leading-relaxed whitespace-pre-line border border-slate-100 dark:border-zinc-700/60">
                    {selectedTaskModal.description || 'Tidak ada instruksi.'}
                  </p>
                </div>

                {selectedTaskModal.attachment && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                      Lampiran File / Dokumen
                    </h4>
                    {(() => {
                      const attachment = getAttachmentData(selectedTaskModal.attachment);
                      if (!attachment) return null;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewAttachment(attachment);
                            setZoomLevel(1);
                          }}
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-semibold transition-all group shadow-xs text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                            <div className="min-w-0">
                              <span className="truncate block">{attachment.fileName}</span>
                              <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 block mt-0.5">
                                {isImageFile(attachment.fileName)
                                  ? 'Klik untuk melihat gambar'
                                  : isPdfFile(attachment.fileName)
                                  ? 'Klik untuk membuka PDF'
                                  : 'Klik untuk melihat lampiran'}
                              </span>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-white shrink-0 transition-colors" />
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-zinc-900">
                {selectedTaskModal.classroomUrl && (
                  <a
                    href={selectedTaskModal.classroomUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Link Pengumpulan</span>
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Viewer Modal */}
      <AnimatePresence>
        {previewAttachment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
            onClick={() => {
              setPreviewAttachment(null);
              setZoomLevel(1);
            }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative w-full max-w-6xl h-[92vh] bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 shrink-0">
                    {isImageFile(previewAttachment.fileName) ? (
                      <FileIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 truncate max-w-[55vw] sm:max-w-[700px]">
                      {previewAttachment.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                      Pratinjau lampiran
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewAttachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={previewAttachment.fileName}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewAttachment(null);
                      setZoomLevel(1);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    aria-label="Tutup viewer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 bg-slate-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden relative">
                
                {/* Floating Zoom Control (Mobile & Tablet) */}
                {(isImageFile(previewAttachment.fileName) || isPdfFile(previewAttachment.fileName)) && (
                  <div className="absolute top-4 right-4 z-20 flex md:hidden items-center gap-1 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-zinc-700/80">
                    <button
                      onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))}
                      className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95"
                      title="Perkecil"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 px-1.5 min-w-[42px] text-center select-none">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5))}
                      className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95"
                      title="Perbesar"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    {zoomLevel !== 1 && (
                      <button
                        onClick={() => setZoomLevel(1)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all border-l border-slate-200 dark:border-zinc-700 ml-0.5"
                        title="Reset Zoom"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {isImageFile(previewAttachment.fileName) ? (
                  <div className="w-full h-full overflow-auto flex items-center justify-center p-4 sm:p-8">
                    <div
                      className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
                      style={{ transform: `scale(${zoomLevel})` }}
                    >
                      <img
                        src={previewAttachment.fileUrl}
                        alt={previewAttachment.fileName}
                        className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-lg"
                      />
                    </div>
                  </div>
                ) : isPdfFile(previewAttachment.fileName) ? (
                  <div className="w-full h-full overflow-auto flex relative">
                    <div 
                      className="w-full h-full min-w-full min-h-full transition-transform duration-200 ease-out origin-top-left"
                      style={{
                        transform: `scale(${zoomLevel})`,
                        width: `${100 / zoomLevel}%`,
                        height: `${100 / zoomLevel}%`,
                      }}
                    >
                      <iframe
                        src={previewAttachment.fileUrl.includes('drive.google.com') && previewAttachment.fileUrl.includes('/view') ? previewAttachment.fileUrl.replace('/view', '/preview') : previewAttachment.fileUrl}
                        title={previewAttachment.fileName}
                        className="w-full h-full border-0 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                      <FileIcon className="w-7 h-7 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                      Preview tidak tersedia
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
                      Format file ini tidak dapat ditampilkan langsung di dalam myMbud.
                    </p>
                    <a
                      href={previewAttachment.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={previewAttachment.fileName}
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Unduh File
                    </a>
                  </div>
                )}
              </div>

              <div className="sm:hidden shrink-0 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
                <a
                  href={previewAttachment.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={previewAttachment.fileName}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Unduh Lampiran
                </a>
              </div>
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

      {/* FLOATING BUTTON MBUDIARY KHUSUS DI DASHBOARD */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => onNavigateTab('mbudiary' as any)}
        className="fixed bottom-28 lg:bottom-10 right-4 lg:right-10 z-40 flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200 shadow-2xl transition-all cursor-pointer group"
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