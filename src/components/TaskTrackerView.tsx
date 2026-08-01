import React, { useState } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  ExternalLink,
  BookOpen,
  X,
  UserCheck,
  AlertCircle,
  ChevronRight,
  BookOpenCheck,
  Tag,
  Paperclip,
} from 'lucide-react';
import { Task } from '../types';

interface TaskTrackerViewProps {
  tasks: Task[];
  isOfficer: boolean;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask?: (id: string, updatedTask: Partial<Task>) => void;
  onUpdateTaskStatus: (id: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
  onDeleteTask: (id: string) => void;
}

export const TaskTrackerView: React.FC<TaskTrackerViewProps> = ({
  tasks,
  isOfficer,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'Individu' | 'Kelompok'>('ALL');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Detail Modal State
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);

  // Add/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Individu' | 'Kelompok'>('Individu');
  const [assigner, setAssigner] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [classroomUrl, setClassroomUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const uniqueCourses = Array.from(new Set(tasks.map((t) => t.course)));

  const now = Date.now();

  const activeTaskCount = tasks.filter((t) => new Date(t.deadline).getTime() > now).length;
  const historyTaskCount = tasks.filter((t) => new Date(t.deadline).getTime() <= now).length;

  const filteredTasks = tasks.filter((t) => {
    const isPast = new Date(t.deadline).getTime() <= now;

    if (activeTab === 'active' && isPast) return false;
    if (activeTab === 'history' && !isPast) return false;

    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.course.toLowerCase().includes(search.toLowerCase()) ||
      t.assigner.toLowerCase().includes(search.toLowerCase());
    const matchCourse = filterCourse === 'ALL' || t.course === filterCourse;
    const matchType = filterType === 'ALL' || t.type === filterType;
    return matchSearch && matchCourse && matchType;
  });

  // Badge logic dengan penghitungan selisih hari H-
  const getDeadlineBadge = (deadlineStr: string) => {
    const now = new Date();
    const deadline = new Date(deadlineStr);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const deadlineStart = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()).getTime();
    const diffDays = Math.round((deadlineStart - todayStart) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        label: 'Tenggat Lewat',
        bg: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700',
      };
    } else if (diffDays <= 2) {
      const dayText = diffDays <= 0 ? 'H-0' : `H-${diffDays}`;
      return {
        label: `Mendesak ${dayText}`,
        bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 animate-pulse',
      };
    } else if (diffDays <= 5) {
      return {
        label: `Mepet H-${diffDays}`,
        bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
      };
    } else {
      return {
        label: `Masih H-${diffDays}`,
        bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
      };
    }
  };

  const formatDeadlineDetails = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';
  };

  const handleOpenAddModal = () => {
    setEditingTaskId(null);
    setTitle('');
    if (uniqueCourses.length > 0) setCourse(uniqueCourses[0]);
    setDescription('');
    setType('Individu');
    setAssigner('');
    setDeadlineDate('');
    setDeadlineTime('23:59');
    setPriority('High');
    setClassroomUrl('');
    setAttachmentName('');
    setAttachmentUrl('');
    setShowModal(true);
  };

  const handleOpenEditModal = (t: Task) => {
    setEditingTaskId(t.id);
    setTitle(t.title);
    setCourse(t.course);
    setDescription(t.description || '');
    setType(t.type);
    setAssigner(t.assigner || '');
    if (t.deadline) {
      const d = new Date(t.deadline);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setDeadlineDate(`${yyyy}-${mm}-${dd}`);
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        setDeadlineTime(`${hh}:${min}`);
      }
    }
    setPriority(t.priority || 'High');
    setClassroomUrl(t.classroomUrl || '');
    setAttachmentName(t.attachment?.fileName || '');
    setAttachmentUrl(t.attachment?.fileUrl || '');
    setShowModal(true);
  };

  const handleTaskFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !course.trim() || !deadlineDate) return;

    const fullIsoDeadline = new Date(`${deadlineDate}T${deadlineTime || '23:59'}:00`).toISOString();
    const attachmentObj = attachmentName.trim()
      ? {
          fileName: attachmentName.trim(),
          fileUrl: attachmentUrl.trim() || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        }
      : undefined;

    if (editingTaskId && onUpdateTask) {
      onUpdateTask(editingTaskId, {
        title,
        course,
        description,
        type,
        assigner: assigner || 'Dosen Pengampu',
        deadline: fullIsoDeadline,
        priority,
        classroomUrl: classroomUrl.trim() || undefined,
        attachment: attachmentObj,
      });
    } else {
      onAddTask({
        title,
        course,
        description,
        type,
        assigner: assigner || 'Dosen Pengampu',
        deadline: fullIsoDeadline,
        status: 'todo',
        priority,
        classroomUrl: classroomUrl.trim() || undefined,
        attachment: attachmentObj,
      });
    }

    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setClassroomUrl('');
    setAttachmentName('');
    setAttachmentUrl('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Mading Informasi Tugas</h2>
          <a
            href="https://classroom.its.ac.id/my/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold border border-slate-200/80 dark:border-zinc-700 transition-all mt-2.5"
          >
            <BookOpenCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>myITS Classroom</span>
          </a>
        </div>

        {isOfficer && (
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tugas Baru</span>
          </button>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="space-y-2.5">
        {/* Baris 1: Input Pencarian */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tugas, mata kuliah, atau dosen..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none"
          />
        </div>

        {/* Baris 2: Dropdown Mata Kuliah + Grup Tombol Kategori (Sebaris Horizontal) */}
        <div className="flex flex-row items-center gap-2 sm:gap-3 w-full">
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="flex-1 min-w-0 w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none truncate"
          >
            <option value="ALL">Semua Mata Kuliah</option>
            {uniqueCourses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-1 rounded-2xl gap-1 shrink-0 overflow-x-auto shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs whitespace-nowrap transition-all ${
                filterType === 'ALL' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('Individu')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs whitespace-nowrap transition-all ${
                filterType === 'Individu' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              Individu
            </button>
            <button
              onClick={() => setFilterType('Kelompok')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs whitespace-nowrap transition-all ${
                filterType === 'Kelompok' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              Kelompok
            </button>
          </div>
        </div>
      </div>

      {/* Pure List / Grid View Layout for Task Information Center */}
      <div className="space-y-4">
        {/* Header Tab Switcher (Kapsul Modern) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-2.5 sm:px-4 sm:py-3 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none">
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-zinc-800 rounded-full w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'active'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <span>Tugas Aktif</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'active' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
              }`}>
                {activeTaskCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <span>Riwayat</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'history' ? 'bg-white/20 text-white dark:bg-zinc-800 dark:text-zinc-200' : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
              }`}>
                {historyTaskCount}
              </span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium px-2 hidden sm:block">
            {activeTab === 'active'
              ? 'Tugas aktif dengan tenggat mendatang'
              : 'Arsip tugas yang tenggat waktunya telah berlalu'}
          </p>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-12 text-center text-slate-400 dark:text-zinc-500 text-xs shadow-sm">
            {activeTab === 'active'
              ? 'Tidak ada tugas aktif yang sesuai dengan pencarian / filter Anda.'
              : 'Belum ada riwayat tugas yang telah berlalu.'}
          </div>
        ) : activeTab === 'active' ? (
          /* GRID UNTUK TUGAS AKTIF (UKURAN NORMAL) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map((t) => {
              const badge = getDeadlineBadge(t.deadline);
              const formattedDate = new Date(t.deadline).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedDetailTask(t)}
                  className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] dark:shadow-none space-y-4 border border-slate-100 dark:border-zinc-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Top Meta Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
                        {t.course}
                      </span>
                      {badge && (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>

                    {/* Task Title & Lecturer Name directly below */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                        {t.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">
                        Dosen: {t.assigner}
                      </p>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed bg-slate-50/70 dark:bg-zinc-800/60 p-3 rounded-2xl line-clamp-2">
                      {t.description || 'Klik untuk melihat rincian instruksi tugas lengkap.'}
                    </p>

                    {/* Type Info & Deadline */}
                    <div className="space-y-1 pt-1 text-xs text-slate-500 dark:text-zinc-400 border-t border-slate-50 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">Tugas {t.type}</span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Prioritas: {t.priority}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300 font-medium pt-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Deadline: {formattedDate} WIB</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-3 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 border-t border-slate-100/60 dark:border-zinc-800">
                    <span className="group-hover:underline">Detail Tugas</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* GRID UNTUK RIWAYAT TUGAS (DESAIN KARTU COMPACT & TANPA DESKRIPSI) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTasks.map((t) => {
              const formattedDate = new Date(t.deadline).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedDetailTask(t)}
                  className="bg-white/80 dark:bg-zinc-900/80 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-zinc-800 opacity-80 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 group relative overflow-hidden"
                >
                  <div className="space-y-1.5">
                    {/* Atas: Label Kategori (Mata Kuliah) & Badge Status (Warna Abu-abu "Selesai") */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full truncate max-w-[170px]">
                        {t.course}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 shrink-0">
                        Selesai
                      </span>
                    </div>

                    {/* Tengah: Judul Tugas & Nama Dosen */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-1">
                        {t.title}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 mt-0.5">
                        Dosen: {t.assigner}
                      </p>
                    </div>

                    {/* Bawah: Jenis Tugas & Tenggat Waktu Disejajarkan */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-1.5 border-t border-slate-100 dark:border-zinc-800/80">
                      <span className="font-medium text-slate-500 dark:text-zinc-400">Tugas {t.type}</span>
                      <div className="flex items-center gap-1 font-medium text-slate-400 dark:text-zinc-500">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                        <span>{formattedDate} WIB</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POP-UP MODAL DETAIL TUGAS (Interactive Full Detail Pop-up) */}
      {selectedDetailTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Sticky Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-start justify-between gap-4 shrink-0 bg-white dark:bg-zinc-900">
              <div className="space-y-1.5 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
                    {selectedDetailTask.course}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                    Tugas {selectedDetailTask.type}
                  </span>
                  {getDeadlineBadge(selectedDetailTask.deadline) && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getDeadlineBadge(selectedDetailTask.deadline)?.bg}`}>
                      {getDeadlineBadge(selectedDetailTask.deadline)?.label}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 pt-1 leading-snug">
                  {selectedDetailTask.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDetailTask(null)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
              {/* Task Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 dark:bg-zinc-800/60 p-4 rounded-2xl text-xs border border-slate-100 dark:border-zinc-800">
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block font-medium">Pemberi Tugas / Dosen:</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-100">{selectedDetailTask.assigner}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block font-medium">Prioritas Tugas:</span>
                  <span className={`font-bold ${selectedDetailTask.priority === 'High' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-zinc-100'}`}>
                    {selectedDetailTask.priority}
                  </span>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 dark:border-zinc-700/60">
                  <span className="text-slate-400 dark:text-zinc-500 block font-medium">Tenggat Pengumpulan (Deadline):</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {formatDeadlineDetails(selectedDetailTask.deadline)}
                  </span>
                </div>
              </div>

              {/* Complete Description / Instructions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                  Rincian & Instruksi Tugas Lengkap
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans border border-slate-100 dark:border-zinc-700/60">
                  {selectedDetailTask.description || 'Tidak ada instruksi tambahan.'}
                </div>
              </div>

              {/* Lampiran Tugas / File Attachment */}
              {selectedDetailTask.attachment && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                    Lampiran File / Dokumen
                  </h4>
                  <a
                    href={selectedDetailTask.attachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 text-slate-800 dark:text-zinc-300 text-xs font-semibold transition-all group"
                  >
                    <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 group-hover:rotate-12 transition-transform" />
                    <span className="flex-1 truncate">{selectedDetailTask.attachment.fileName}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                  </a>
                </div>
              )}

              {/* Direct Collection Link */}
              <div className="pt-1">
                <a
                  href={selectedDetailTask.classroomUrl || 'https://classroom.its.ac.id/my/'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <BookOpenCheck className="w-4 h-4" />
                  <span>Link Pengumpulan</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                </a>
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900">
              {isOfficer ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const t = selectedDetailTask;
                      setSelectedDetailTask(null);
                      handleOpenEditModal(t);
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Data</span>
                  </button>
                  <button
                    onClick={() => {
                      onDeleteTask(selectedDetailTask.id);
                      setSelectedDetailTask(null);
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              ) : (
                <div></div>
              )}

              <button
                onClick={() => setSelectedDetailTask(null)}
                className="px-6 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Task (Officer Form) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Sticky Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                {editingTaskId ? 'Revisi / Edit Data Tugas' : 'Tambah Tugas Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleTaskFormSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Judul Tugas</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Misal: Proposal Penelitian / Makalah Wilayah"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Mata Kuliah</label>
                    <input
                      type="text"
                      required
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="Sosiologi Pembangunan"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Jenis Tugas</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Individu">Individu</option>
                      <option value="Kelompok">Kelompok</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Pemberi Tugas (Dosen)</label>
                    <input
                      type="text"
                      value={assigner}
                      onChange={(e) => setAssigner(e.target.value)}
                      placeholder="Dr. Rina Wulandari"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Prioritas</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="High">Tinggi (High)</option>
                      <option value="Medium">Sedang (Medium)</option>
                      <option value="Low">Rendah (Low)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Tanggal Deadline</label>
                    <input
                      type="date"
                      required
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Jam Deadline</label>
                    <input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Link myITS Classroom (Opsional)</label>
                  <input
                    type="url"
                    value={classroomUrl}
                    onChange={(e) => setClassroomUrl(e.target.value)}
                    placeholder="https://classroom.its.ac.id/my/..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Deskripsi / Instruksi Tugas</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Kriteria penulisan, format file, atau link pengumpulan..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
                    <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Lampiran File / Pedoman (Opsional)</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">Nama File Lampiran</label>
                    <input
                      type="text"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      placeholder="Misal: Panduan_Tugas.pdf"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">URL File Lampiran</label>
                    <input
                      type="url"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      placeholder="https://... (Biarkan kosong untuk URL dummy default)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                >
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
