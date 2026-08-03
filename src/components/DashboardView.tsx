import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Pin,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Flame,
  BookOpen,
  Paperclip,
  X,
  QrCode,
  UserCheck,
} from 'lucide-react';
import { AppState, DayOfWeek, Task, Announcement, ScheduleItem } from '../types';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';

interface DashboardViewProps {
  state: AppState;
  isOfficer: boolean;
  onAddAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onNavigateTab: (tab: 'tasks' | 'contacts' | 'materials' | 'spinwheel' | 'calculator', courseFilter?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  isOfficer,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onNavigateTab,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Senin');
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [selectedTaskModal, setSelectedTaskModal] = useState<Task | null>(null);
  const [selectedAnnModal, setSelectedAnnModal] = useState<Announcement | null>(null);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState<'Penting' | 'Akademik' | 'Kegiatan' | 'Info'>('Penting');
  const [newAnnPinned, setNewAnnPinned] = useState(true);

  // Carousel state for mobile announcements
  const [mobileAnnIndex, setMobileAnnIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const totalAnn = state.announcements.length;
  const activeAnnIndex = Math.min(mobileAnnIndex, Math.max(0, totalAnn - 1));
  const currentMobileAnn = state.announcements[activeAnnIndex];

  // Auto-play timer (4 seconds per slide, pauses on hover/touch or when detail modal is open)
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

  // Set default selected day based on current day
  useEffect(() => {
    const days: DayOfWeek[] = ['Minggu' as DayOfWeek, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentDayIndex = new Date().getDay();
    const todayName = days[currentDayIndex];
    if (todayName && todayName !== ('Minggu' as DayOfWeek)) {
      setSelectedDay(todayName);
    }
  }, []);

  // Filter tasks that are not done and deadline is not expired
  const now = Date.now();
  const upcomingTasks = state.tasks
    .filter((t) => t.status !== 'done' && new Date(t.deadline).getTime() > now)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // Helper to format announcement date to DD/MM/YYYY
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

  // Helper to format date and time deadline string (e.g. "5 Agu 2026 • 23:59 WIB")
  const formatDeadlineDetails = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} • ${hours}:${minutes} WIB`;
  };

  // Helper for task deadline pill badge dengan kalkulasi H-
  const getPillBadge = (deadlineStr: string) => {
    const now = new Date();
    const deadline = new Date(deadlineStr);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const deadlineStart = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()).getTime();
    const diffDays = Math.round((deadlineStart - todayStart) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        label: 'Tenggat Lewat',
        badgeClass: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 font-bold',
      };
    } else if (diffDays <= 2) {
      const dayText = diffDays <= 0 ? 'H-0' : `H-${diffDays}`;
      return {
        label: `Mendesak ${dayText}`,
        badgeClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 animate-pulse font-bold',
      };
    } else if (diffDays <= 5) {
      return {
        label: `Mepet H-${diffDays}`,
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 font-bold',
      };
    } else {
      return {
        label: `Masih H-${diffDays}`,
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50 font-bold',
      };
    }
  };

  const dayTabs: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  
  // LOGIKA BARU: Filter dan Sorting secara Ascending berdasarkan Jam (Terpagi di Atas)
  const filteredSchedule = state.schedules
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => {
      const startA = a.time.split('-')[0].trim();
      const startB = b.time.split('-')[0].trim();
      return startA.localeCompare(startB);
    });

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim()) return;
    onAddAnnouncement({
      title: newAnnTitle,
      content: newAnnContent,
      category: newAnnCategory,
      author: 'Pengurus Kelas A',
      pinned: newAnnPinned,
    });
    setNewAnnTitle('');
    setNewAnnContent('');
    setShowAnnModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Mobile & Tablet Announcements Carousel (Visible on screens < lg) */}
      <div className="block lg:hidden bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-2.5 transition-colors">
        {/* Tombol Buat Pengumuman jika pengurus */}
        {isOfficer && (
          <div className="flex justify-end pb-1">
            <button
              onClick={() => setShowAnnModal(true)}
              className="px-2.5 py-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat</span>
            </button>
          </div>
        )}

        {/* Carousel Content Card */}
        {totalAnn === 0 ? (
          <div className="p-4 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/70 dark:bg-zinc-800/40 rounded-2xl">
            Belum ada pengumuman kelas.
          </div>
        ) : (
          <div className="space-y-2">
            <div
              onClick={() => setSelectedAnnModal(currentMobileAnn)}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-zinc-800/70 border border-slate-100 dark:border-zinc-800/80 space-y-1.5 transition-all select-none cursor-pointer hover:bg-slate-100/80 dark:hover:bg-zinc-800 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full text-[10px]">
                  {currentMobileAnn.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                    {formatAnnouncementDate(currentMobileAnn.date)}
                  </span>
                  {isOfficer && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAnnouncement(currentMobileAnn.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                      title="Hapus Pengumuman"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 line-clamp-1">
                {currentMobileAnn.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-2">
                {currentMobileAnn.content}
              </p>
            </div>

            {/* Bottom Controls: Navigation Arrows centered right next to Pagination Dots */}
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
                  {state.announcements.map((_, idx) => (
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

      {/* Main Grid: Weekly Schedule & Pinned Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Jadwal Kuliah & Tugas Mendatang */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 transition-colors">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Jadwal Perkuliahan</h3>
            </div>

            {/* Day Selector Tabs - Fits in one mobile screen without overflow */}
            <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100/80 dark:bg-zinc-800/80 rounded-2xl w-full">
              {dayTabs.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`w-full py-2 px-1 text-[11px] sm:text-xs text-center font-medium rounded-xl transition-all ${
                    selectedDay === day
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Schedule Cards for Selected Day */}
            <div className="space-y-3 pt-2">
              {filteredSchedule.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/70 dark:bg-zinc-800/40 rounded-2xl">
                  Tidak ada jadwal perkuliahan untuk hari {selectedDay}.
                </div>
              ) : (
                filteredSchedule.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 hover:bg-slate-100/60 dark:hover:bg-zinc-800 transition-all flex flex-col space-y-3 border border-slate-100 dark:border-zinc-800/80"
                  >
                    {/* Upper Section */}
                    <div className="flex items-start justify-between gap-3">
                      {/* KOLOM KIRI: Matkul, Dosen & PJ */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-snug pr-2">
                          {item.course}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">Dosen: {item.lecturer}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">PJ: {item.pjMatkul.replace(/\s*08\d+/g, '')}</p>
                      </div>

                      {/* KOLOM KANAN: SKS, Ruangan DI TENGAH, Jam DI BAWAH */}
                      <div className="flex flex-col items-end shrink-0 text-right space-y-1">
                        {/* TEKS SKS POLOS */}
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 mb-0.5">
                          {item.sks} SKS
                        </span>
                        
                        {/* KODE RUANG */}
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {item.room}
                        </span>
                        
                        {/* WAKTU / JAM */}
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 font-sans whitespace-nowrap">
                          {item.time}
                        </span>
                      </div>
                    </div>

                    {/* Presensi, QR, & Kontak Buttons at bottom of each card */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 w-full">
                      
                      {/* GABUNGAN TOMBOL PRESENSI & SCAN QR (Dengan Padding & Round UI) */}
                      <div className="flex-1 flex items-center bg-blue-600 hover:bg-blue-700 rounded-xl p-1 shadow-xs transition-all">
                        {/* Sub-Tombol 1: Presensi Manual/Web */}
                        <a
                          href="https://presensi.its.ac.id/dashboard"
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 px-2 py-1.5 text-white text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 rounded-lg active:bg-blue-800/40"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Presensi</span>
                        </a>

                        {/* Sub-Tombol 2: Quick Scan QR (Lebih Pop-out) */}
                        <a
                          href="https://presensi.its.ac.id/kehadiran-mahasiswa/qr-scan"
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 px-3.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ml-1"
                          title="Scan QR Presensi"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>QR</span>
                        </a>
                      </div>

                      {/* TOMBOL KONTAK (Lebih Compact & Tidak Flex-1) */}
                      <button
                        onClick={() => onNavigateTab('contacts', item.course)}
                        className="shrink-0 px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 text-[11px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1"
                      >
                        <span>Kontak</span>
                      </button>

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Tasks Section */}
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Daftar Tugas</h3>
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
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskModal(task)}
                      className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-transparent hover:border-blue-100 dark:hover:border-zinc-700 group"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{task.title}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-700 dark:text-zinc-300">{task.course}</span>
                          <span>•</span>
                          <span className="text-slate-500 dark:text-zinc-400 font-medium">{deadlineFormatted}</span>
                        </div>
                      </div>

                      {badge && (
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.badgeClass}`}>
                            {badge.label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Pengumuman Kelas (Desktop View) */}
        <div className="hidden lg:block space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Pengumuman</h3>
              </div>

              {isOfficer && (
                <button
                  onClick={() => setShowAnnModal(true)}
                  className="px-3 py-1.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat</span>
                </button>
              )}
            </div>

            {/* Announcements List */}
            <div className="space-y-3">
              {state.announcements.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/70 dark:bg-zinc-800/40 rounded-2xl">
                  Belum ada pengumuman kelas.
                </div>
              ) : (
                state.announcements.map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => setSelectedAnnModal(ann)}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 space-y-1.5 border border-slate-100 dark:border-zinc-800 cursor-pointer hover:bg-slate-100/90 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full">{ann.category}</span>
                      {isOfficer && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAnnouncement(ann.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                          title="Hapus Pengumuman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 pt-1">{ann.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-2">{ann.content}</p>
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 pt-1">{formatAnnouncementDate(ann.date)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create Announcement (For Officers) */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Buat Pengumuman Baru Kelas A</h3>
              <button
                type="button"
                onClick={() => setShowAnnModal(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleCreateAnnouncement} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Judul Pengumuman</label>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Kategori</label>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Isi Pesan / Informasi</label>
                  <textarea
                    rows={4}
                    required
                    value={newAnnContent}
                    onChange={(e) => setNewAnnContent(e.target.value)}
                    placeholder="Tuliskan instruksi atau pengumuman lengkap untuk teman-teman Kelas A..."
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

              {/* Modal Sticky Footer */}
              <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                >
                  Terbitkan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Task Detail */}
      {selectedTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
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
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Dosen: {selectedTaskModal.assigner}</p>
              </div>
              <button
                onClick={() => setSelectedTaskModal(null)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Deskripsi & Instruktur</h4>
                <p className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/80 p-4 rounded-2xl leading-relaxed whitespace-pre-line border border-slate-100 dark:border-zinc-700/60">
                  {selectedTaskModal.description || 'Tidak ada deskripsi tambahan.'}
                </p>
              </div>

              {selectedTaskModal.attachment && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                    Lampiran File / Dokumen
                  </h4>
                  <a
                    href={selectedTaskModal.attachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 text-slate-800 dark:text-zinc-300 text-xs font-semibold transition-all group"
                  >
                    <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{selectedTaskModal.attachment.fileName}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Sticky Footer */}
            <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setSelectedTaskModal(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Announcement Detail */}
      {selectedAnnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-start justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900">
              <div className="pr-2 space-y-1">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
                  {selectedAnnModal.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 pt-1">{selectedAnnModal.title}</h3>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Diterbitkan: {formatAnnouncementDate(selectedAnnModal.date)} • {selectedAnnModal.author || 'Pengurus Kelas'}
                </p>
              </div>
              <button
                onClick={() => setSelectedAnnModal(null)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <p className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/80 p-4 rounded-2xl leading-relaxed whitespace-pre-line border border-slate-100 dark:border-zinc-700/60">
                {selectedAnnModal.content}
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setSelectedAnnModal(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};