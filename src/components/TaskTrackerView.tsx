import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Clock,
  Trash2,
  Edit2,
  ExternalLink,
  X,
  ChevronRight,
  ChevronDown,
  Paperclip,
  UploadCloud,
  File as FileIcon,
  Loader2,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Task, Contact } from '../types';
import { toggleTaskCompletion } from '../services/api';

interface TaskTrackerViewProps {
  tasks: Task[];
  contacts?: Contact[];
  isOfficer: boolean;
  completedTaskIds?: string[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask?: (id: string, updatedTask: Partial<Task>) => void;
  onUpdateTaskStatus: (
    id: string,
    newStatus: 'todo' | 'in_progress' | 'done'
  ) => void;
  onDeleteTask: (id: string) => void;
  completionSoundUrl?: string;
}

interface AttachmentData {
  fileName: string;
  fileUrl: string;
}

const DEFAULT_CLASSROOM_URL = 'https://classroom.its.ac.id/auth/oidc';

const getMimeType = (file: File): string => {
  if (file.type && file.type.trim() !== '') {
    return file.type;
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    case 'svg': return 'image/svg+xml';
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'ppt': return 'application/vnd.ms-powerpoint';
    case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'xls': return 'application/vnd.ms-excel';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default: return 'application/octet-stream';
  }
};

const getGoogleDriveImageUrl = (url: string) => {
  if (!url) return url;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
};

const renderTextWithLinks = (text: string) => {
  if (!text) return 'Tidak ada instruksi.';

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 break-all hover:opacity-80 transition-opacity font-medium cursor-pointer"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export const TaskTrackerView: React.FC<TaskTrackerViewProps> = ({
  tasks,
  contacts = [],
  isOfficer,
  completedTaskIds = [],
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  completionSoundUrl = '/task-complete.mp3',
}) => {
  const [search, setSearch] = useState('');
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'Individu' | 'Kelompok'>('ALL');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);

  const currentUserNrp = localStorage.getItem('mymbud_user_nrp') || 'unknown';
  const currentUserName = localStorage.getItem('mymbud_user_name') || 'Aero';

  const [celebrationTask, setCelebrationTask] = useState<Task | null>(null);
  const audioCelebrationRef = useRef<HTMLAudioElement | null>(null);

  const playCelebrationSound = () => {
    if (completionSoundUrl) {
      try {
        const audio = new Audio(completionSoundUrl);
        audioCelebrationRef.current = audio;
        audio.volume = 0.85;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[TaskComplete] SFX autoplay dicegah browser:', err);
          });
        }
      } catch (e) {
        console.warn('[TaskComplete] Gagal memuat audio SFX:', e);
      }
    }
  };

  const handleToggleComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const isDone = completedTaskIds.includes(task.id);
    const nextState = !isDone;

    try {
      await toggleTaskCompletion(currentUserNrp, task.id, nextState);

      if (nextState) {
        setCelebrationTask(task);
        playCelebrationSound();
      }
    } catch (err) {
      console.error('Gagal memperbarui status tugas:', err);
    }
  };

  const [previewAttachment, setPreviewAttachment] = useState<AttachmentData | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingAttachment, setExistingAttachment] = useState<AttachmentData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleForceDownload = async (e: React.MouseEvent, url: string, fileName: string) => {
    e.preventDefault();
    e.stopPropagation();

    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    const fileId = match ? match[1] : null;

    if (!fileId) {
      window.open(url, '_blank');
      return;
    }

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      window.open(downloadUrl, '_blank');
    }
  };

  const getContactCourse = (c: any) => c.course || c.courseName || '';
  const getContactLecturer = (c: any) => c.lecturerName || c.lecturer || c.name || '';

  const availableCourseOptions = Array.from(
    new Set([
      ...contacts.map((c) => getContactCourse(c)).filter((c) => c && c.trim() !== ''),
      ...tasks.map((t) => t.course).filter((c) => c && c.trim() !== ''),
    ])
  ).sort();

  const uniqueCourses = Array.from(new Set(tasks.map((t) => t.course)));

  const handleCourseChange = (selectedCourseName: string) => {
    setCourse(selectedCourseName);
    const matchedContact = contacts.find(
      (c) => getContactCourse(c).toLowerCase() === selectedCourseName.toLowerCase()
    );

    if (matchedContact) {
      setAssigner(getContactLecturer(matchedContact));
    }
  };

  const nowTime = Date.now();

  const isTaskHistory = (task: Task) => {
    const isExplicitlyDone = completedTaskIds.includes(task.id);
    const isDeadlinePassed = new Date(task.deadline).getTime() <= nowTime;
    return isExplicitlyDone || isDeadlinePassed;
  };

  const activeTaskCount = tasks.filter((t) => !isTaskHistory(t)).length;

  const filteredTasks = tasks.filter((t) => {
    const isHistory = isTaskHistory(t);

    if (activeTab === 'active' && isHistory) return false;
    if (activeTab === 'history' && !isHistory) return false;

    const searchLower = search.toLowerCase();
    const matchSearch =
      t.title.toLowerCase().includes(searchLower) ||
      t.course.toLowerCase().includes(searchLower) ||
      t.assigner.toLowerCase().includes(searchLower);

    const matchCourse = filterCourse === 'ALL' || t.course === filterCourse;
    const matchType = filterType === 'ALL' || t.type === filterType;

    return matchSearch && matchCourse && matchType;
  });

  const getDeadlineBadge = (deadlineStr: string) => {
    const nowDate = new Date();
    const deadline = new Date(deadlineStr);

    const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
    const deadlineStart = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()).getTime();

    const diffDays = Math.round((deadlineStart - todayStart) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        label: 'Selesai',
        bg: 'bg-slate-100/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border-slate-200/60 dark:border-white/5',
      };
    }

    if (diffDays <= 2) {
      const dayText = diffDays <= 0 ? 'H-0' : `H-${diffDays}`;
      return {
        label: `URGENT ${dayText}`,
        bg: 'bg-rose-50/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/50 animate-pulse',
      };
    }

    if (diffDays <= 5) {
      return {
        label: `Mepet H-${diffDays}`,
        bg: 'bg-amber-50/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/50',
      };
    }

    return {
      label: `Masih H-${diffDays}`,
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/50',
    };
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

  const getAttachmentData = (attachment: any): AttachmentData | null => {
    if (!attachment) return null;

    if (typeof attachment === 'string') {
      return {
        fileName: attachment.split('/').pop()?.split('?')[0] || 'Dokumen Lampiran',
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

  const getFileExtension = (fileName: string) => fileName.split('.').pop()?.toLowerCase() || '';
  const isImageFile = (fileName: string) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(getFileExtension(fileName));
  const isPdfFile = (fileName: string) => getFileExtension(fileName) === 'pdf';

  const handleOpenAddModal = () => {
    setEditingTaskId(null);
    setTitle('');
    const defaultCourse = availableCourseOptions[0] || '';
    setCourse(defaultCourse);

    if (defaultCourse) {
      const matchedContact = contacts.find(
        (c) => getContactCourse(c).toLowerCase() === defaultCourse.toLowerCase()
      );
      setAssigner(matchedContact ? getContactLecturer(matchedContact) : '');
    } else {
      setAssigner('');
    }

    setDescription('');
    setType('Individu');
    setDeadlineDate('');
    setDeadlineTime('23:59');
    setPriority('High');
    setClassroomUrl('');
    setSelectedFile(null);
    setExistingAttachment(null);
    setUploadProgress(0);
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
    setSelectedFile(null);
    setExistingAttachment(getAttachmentData(t.attachment));
    setUploadProgress(0);
    setShowModal(true);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setExistingAttachment(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadTaskAttachmentToDrive = async (file: File): Promise<string> => {
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbyce8cTZ2F25PwyfISpmVJJDMiIunl8G8lCyzkPKQaiuUl-nxKNM5i9b72MMo4M_xis/exec';

    setUploadProgress(8);
    const base64Data = await fileToBase64(file);
    setUploadProgress(18);

    const safeMimeType = getMimeType(file);

    const payload = {
      fileName: file.name,
      mimeType: safeMimeType,
      base64: base64Data,
      folderName: 'myMbud Task Attachments',
    };

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 92) {
          clearInterval(progressInterval);
          return 92;
        }
        const step = prev < 50 ? Math.random() * 8 + 4 : Math.random() * 3 + 1;
        return Math.min(Math.round(prev + step), 92);
      });
    }, 280);

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      clearInterval(progressInterval);

      if (!response.ok) throw new Error(`Upload Lampiran Tugas gagal (${response.status}).`);

      const data = await response.json();
      setUploadProgress(100);

      if (data.status !== 'success') throw new Error(data.message);

      return data.url;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  const handleTaskFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !course.trim() || !deadlineDate) return;

    setIsUploading(true);
    setUploadProgress(0);

    let finalAttachment: AttachmentData | undefined = existingAttachment || undefined;

    try {
      if (selectedFile) {
        const fileUrl = await uploadTaskAttachmentToDrive(selectedFile);
        finalAttachment = { fileName: selectedFile.name, fileUrl };
      }

      const fullIsoDeadline = new Date(`${deadlineDate}T${deadlineTime || '23:59'}:00`).toISOString();
      const finalClassroomUrl = classroomUrl.trim() || DEFAULT_CLASSROOM_URL;

      const taskData: Omit<Task, 'id'> = {
        title: title.trim(),
        course: course.trim(),
        description: description.trim(),
        type,
        assigner: assigner.trim() || 'Dosen Pengampu',
        deadline: fullIsoDeadline,
        status: 'todo',
        priority,
        classroomUrl: finalClassroomUrl,
        ...(finalAttachment ? { attachment: finalAttachment } : {})
      };

      if (editingTaskId && onUpdateTask) {
        onUpdateTask(editingTaskId, taskData);
      } else {
        onAddTask(taskData);
      }

      setEditingTaskId(null);
      setShowModal(false);
      setSelectedFile(null);
      setExistingAttachment(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Gagal menyimpan tugas:', error);
      alert(`Gagal menyimpan tugas.`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-5 pb-32 sm:pb-36"
    >
      {/* HEADER BANNER */}
      <div className="flex items-center justify-between gap-3 px-1 pt-4 sm:pt-6 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            Tracker Tugas Matkul
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Pantau dan Kelola Deadline Tugas
          </p>
        </div>
      </div>

      {/* DEDICATED UPLOAD / TAMBAH TUGAS BANNER (GLASSMORPHISM) */}
      {isOfficer && (
        <div className="p-4 sm:p-5 rounded-3xl bg-blue-50/80 dark:bg-blue-950/30 backdrop-blur-md border border-blue-100/80 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">
                Kelola & Buat Tugas Perkuliahan
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Tambahkan tugas baru beserta instruksi dan lampiran untuk seluruh mahasiswa.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tugas Baru</span>
          </motion.button>
        </div>
      )}

      {/* FILTER CONTROLS: SINGLE-LINE ROW */}
      <div className="flex items-center gap-2 sm:gap-3 w-full pt-1">
        {/* DESKTOP SEARCH BAR */}
        <div className="relative flex-1 hidden md:block">
          <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tugas atau mata kuliah..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none"
          />
        </div>

        {/* MOBILE EXPANDABLE SEARCH */}
        <div className={`block md:hidden transition-all duration-300 ease-in-out ${isMobileSearchExpanded ? 'flex-1' : 'w-10 shrink-0'}`}>
          {isMobileSearchExpanded ? (
            <div className="relative w-full flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari tugas..."
                className="w-full pl-8 pr-8 py-2 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-blue-500/50 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none shadow-xs"
              />
              <button
                type="button"
                onClick={() => {
                  setIsMobileSearchExpanded(false);
                  setSearch('');
                }}
                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsMobileSearchExpanded(true)}
              className={`w-10 h-9.5 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                search.trim() !== ''
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border-white/60 dark:border-white/10 text-slate-600 dark:text-zinc-300'
              }`}
              title="Cari Tugas"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* DROPDOWN FILTER MATKUL */}
        {(!isMobileSearchExpanded || typeof window === 'undefined' || window.innerWidth >= 768) && (
          <div className="relative flex-1 min-w-0">
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2 md:py-2.5 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none font-semibold truncate appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Matkul</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        )}

        {/* PILL FILTER JENIS TUGAS */}
        {(!isMobileSearchExpanded || typeof window === 'undefined' || window.innerWidth >= 768) && (
          <div className="flex items-center bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 p-1 rounded-2xl gap-0.5 sm:gap-1 shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            {(['ALL', 'Individu', 'Kelompok'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFilterType(option)}
                className={`px-2 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs whitespace-nowrap transition-all cursor-pointer ${
                  filterType === option
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                {option === 'ALL' ? 'Semua' : option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TASK LIST */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 p-2.5 sm:px-4 sm:py-3 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
          <div className="inline-flex items-center p-1 bg-slate-100/80 dark:bg-zinc-800/80 rounded-full w-full sm:w-auto relative border border-slate-200/40 dark:border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`relative z-10 flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'text-white'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              {activeTab === 'active' && (
                <motion.div
                  layoutId="activeTaskTab"
                  className="absolute inset-0 bg-blue-600 rounded-full shadow-md shadow-blue-500/20"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">Tugas Aktif</span>
              <span
                className={`relative z-10 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'active'
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-200/80 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                }`}
              >
                {activeTaskCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`relative z-10 flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'text-white dark:text-zinc-900'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              {activeTab === 'history' && (
                <motion.div
                  layoutId="activeTaskTab"
                  className="absolute inset-0 bg-slate-800 dark:bg-zinc-100 rounded-full shadow-md"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">Riwayat</span>
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl p-12 text-center text-slate-400 dark:text-zinc-500 text-xs shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            {activeTab === 'active'
              ? 'Tidak ada tugas aktif mendatang.'
              : 'Belum ada riwayat tugas yang selesai'}
          </div>
        ) : activeTab === 'active' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((t) => {
                const badge = getDeadlineBadge(t.deadline);
                const isDone = completedTaskIds.includes(t.id);
                const formattedDate = new Date(t.deadline).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    key={t.id}
                    onClick={() => setSelectedDetailTask(t)}
                    className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none space-y-4 border border-white/60 dark:border-white/10 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-100/50 dark:border-blue-900/40">
                          {t.course}
                        </span>

                        {badge && (
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors leading-snug">
                          {t.title}
                        </h3>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed bg-white/60 dark:bg-zinc-800/40 p-3 rounded-2xl line-clamp-2 overflow-hidden text-ellipsis break-words border border-slate-200/50 dark:border-white/5">
                        {t.description ? renderTextWithLinks(t.description) : 'Klik untuk melihat rincian instruksi tugas lengkap.'}
                      </div>

                      <div className="space-y-1 pt-1 text-xs text-slate-500 dark:text-zinc-400 border-t border-slate-200/40 dark:border-white/5">
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="font-semibold text-slate-700 dark:text-zinc-300">
                            Tugas {t.type}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Deadline: {formattedDate} WIB</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-between text-xs font-semibold border-t border-slate-200/40 dark:border-white/5 gap-2">
                      <span className="text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                        Detail Tugas <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>

                      <button
                        onClick={(e) => handleToggleComplete(e, t)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          isDone
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-white/10'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Selesai</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                            <span>Tandai Selesai</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((t) => {
                const isExplicitDone = completedTaskIds.includes(t.id);
                const isDeadlinePassed = new Date(t.deadline).getTime() <= nowTime;
                const formattedDate = new Date(t.deadline).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    key={t.id}
                    onClick={() => setSelectedDetailTask(t)}
                    className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 hover:bg-white/90 dark:hover:bg-zinc-850 backdrop-blur-md border border-white/60 dark:border-white/10 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 bg-slate-100/80 dark:bg-zinc-800/80 px-2.5 py-0.5 rounded-full border border-slate-200/50 dark:border-white/5">
                        {t.course}
                      </span>

                      {isDeadlinePassed && !isExplicitDone ? (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-100/80 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-white/5">
                          Selesai
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleToggleComplete(e, t)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selesai</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {t.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-1.5 border-t border-slate-200/40 dark:border-white/5">
                      <span className="font-medium text-slate-700 dark:text-zinc-300">
                        Tugas {t.type}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formattedDate} WIB</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* DETAIL MODAL (PORTAL) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {selectedDetailTask && (
              <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div 
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                >
                  <div className="px-6 py-5 border-b border-slate-200/40 dark:border-white/10 flex justify-between items-start gap-4 bg-white/50 dark:bg-zinc-900/50">
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-100/50 dark:border-blue-900/40">
                        {selectedDetailTask.course}
                      </span>

                      <h2 className="text-lg font-bold pt-1 text-slate-900 dark:text-zinc-100">
                        {selectedDetailTask.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => setSelectedDetailTask(null)}
                      className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    <div className="bg-white/60 dark:bg-zinc-800/50 p-4 rounded-2xl text-xs border border-slate-200/40 dark:border-white/5 space-y-2">
                      <div>
                        <span className="text-slate-400 dark:text-zinc-400 block mb-0.5">
                          Tenggat:
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                          {formatDeadlineDetails(selectedDetailTask.deadline)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                        Rincian Tugas
                      </h4>

                      <div className="p-4 rounded-2xl bg-white/60 dark:bg-zinc-800/60 text-xs leading-relaxed text-slate-700 dark:text-zinc-300 whitespace-pre-wrap border border-slate-200/40 dark:border-white/5 break-words">
                        {renderTextWithLinks(selectedDetailTask.description)}
                      </div>
                    </div>

                    {selectedDetailTask.attachment && (
                      <div className="space-y-2 pt-1">
                        <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                          Lampiran File PDF
                        </h4>

                        {(() => {
                          const attachment = getAttachmentData(
                            selectedDetailTask.attachment
                          );
                          if (!attachment) return null;

                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewAttachment(attachment);
                                setZoomLevel(1);
                              }}
                              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/60 hover:bg-white/90 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-white/5 text-slate-800 dark:text-zinc-200 text-xs font-semibold transition-all group shadow-xs text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                                <div className="min-w-0">
                                  <span className="truncate block">
                                    {attachment.fileName}
                                  </span>
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

                  <div className="px-6 py-4 border-t border-slate-200/40 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-zinc-900/50">
                    {isOfficer ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const t = selectedDetailTask;
                            setSelectedDetailTask(null);
                            handleOpenEditModal(t);
                          }}
                          className="px-3.5 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            onDeleteTask(selectedDetailTask.id);
                            setSelectedDetailTask(null);
                          }}
                          className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <a
                        href={selectedDetailTask.classroomUrl || DEFAULT_CLASSROOM_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Link Pengumpulan</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* CELEBRATION REWARD POPUP (PORTAL) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {celebrationTask && (
              <div className="fixed inset-0 z-[99999] bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none overflow-hidden">
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="relative max-w-sm sm:max-w-md w-full rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 shadow-2xl p-6 sm:p-8 text-center overflow-hidden flex flex-col items-center z-30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setCelebrationTask(null)}
                    className="absolute top-4 right-4 p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
                    <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100 pt-1 tracking-tight">
                      Tugas Selesai, {currentUserName}! ✨
                    </h3>
                  </div>

                  <div className="mt-4 p-3.5 rounded-2xl bg-white/60 dark:bg-zinc-800/70 border border-slate-200/40 dark:border-white/5 w-full text-center space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                     {celebrationTask.course}
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">
                      {celebrationTask.title}
                    </p>
                  </div>

                  <p className="mt-3.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Selamat istirahat dan jangan lupa self reward ya! 🎉☕
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCelebrationTask(null)}
                    className="mt-6 w-full py-2.5 sm:py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Terima kasih
                  </motion.button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* ATTACHMENT VIEWER MODAL (PORTAL) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {previewAttachment && (
              <div
                className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
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
                  className="relative w-full max-w-6xl h-[92vh] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="shrink-0 h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 shrink-0">
                        {isImageFile(previewAttachment.fileName) ? (
                          <FileIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 truncate max-w-[45vw] sm:max-w-[700px]">
                          {previewAttachment.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                          Pratinjau lampiran
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleForceDownload(e, previewAttachment.fileUrl, previewAttachment.fileName)}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh
                      </button>

                      <a
                        href={previewAttachment.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex sm:hidden p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors items-center justify-center shrink-0"
                        title="Buka di Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setPreviewAttachment(null);
                          setZoomLevel(1);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        aria-label="Tutup viewer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 bg-slate-100/80 dark:bg-zinc-900/80 flex items-center justify-center overflow-hidden relative">
                    {(isImageFile(previewAttachment.fileName) || isPdfFile(previewAttachment.fileName)) && (
                      <div className="absolute top-4 right-4 z-20 flex md:hidden items-center gap-1 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-zinc-700/80">
                        <button
                          onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))}
                          className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95 cursor-pointer"
                          title="Perkecil"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 px-1.5 min-w-[42px] text-center select-none">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <button
                          onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5))}
                          className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95 cursor-pointer"
                          title="Perbesar"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        {zoomLevel !== 1 && (
                          <button
                            onClick={() => setZoomLevel(1)}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all border-l border-slate-200 dark:border-zinc-700 ml-0.5 cursor-pointer"
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
                            src={getGoogleDriveImageUrl(previewAttachment.fileUrl)}
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
                          className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Buka File
                        </a>
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