import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  User,
  Users,
} from 'lucide-react';
import { Task, Contact } from '../types';
import { toggleTaskCompletion, subscribeAllTaskCompletions, TaskCompletionCounts } from '../services/api';

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

// Safe date parser untuk mencegah NaN pada pendaftaran sort
const getSafeTime = (dateStr?: string) => {
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  return isNaN(t) ? 0 : t;
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

  // Real-time task completions count map untuk seluruh mahasiswa
  const [allCompletionCounts, setAllCompletionCounts] = useState<TaskCompletionCounts>({});

  const currentUserNrp = localStorage.getItem('mymbud_user_nrp') || 'unknown';
  const currentUserName = localStorage.getItem('mymbud_user_name') || 'Aero';

  const [celebrationTask, setCelebrationTask] = useState<Task | null>(null);
  const audioCelebrationRef = useRef<HTMLAudioElement | null>(null);

  // Subscribe real-time penyelesaian tugas seluruh mahasiswa dari Supabase
  useEffect(() => {
    const unsubscribe = subscribeAllTaskCompletions((counts) => {
      setAllCompletionCounts(counts);
    });
    return () => {
      unsubscribe();
    };
  }, []);

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
  const MAX_ATTACHMENTS = 5;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileIndex, setUploadingFileIndex] = useState(0);
  const [existingAttachments, setExistingAttachments] = useState<AttachmentData[]>([]);

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
    const isDeadlinePassed = getSafeTime(task.deadline) <= nowTime;
    return isExplicitlyDone || isDeadlinePassed;
  };

  const activeTaskCount = tasks.filter((t) => !isTaskHistory(t)).length;

  // Optimasi Memoization & Stable Sorting Ascending berdasarkan Deadline Terdekat
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
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
      })
      .sort((a, b) => getSafeTime(a.deadline) - getSafeTime(b.deadline));
  }, [tasks, completedTaskIds, activeTab, search, filterCourse, filterType, nowTime]);

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

  const getAttachmentsList = (task: any): AttachmentData[] => {
    if (!task) return [];
    const raw = task.attachments ?? task.attachment;
    if (!raw) return [];
    const rawArray = Array.isArray(raw) ? raw : [raw];
    return rawArray
      .map((item) => getAttachmentData(item))
      .filter((item): item is AttachmentData => item !== null);
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
    setSelectedFiles([]);
    setExistingAttachments([]);
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
    setSelectedFiles([]);
    setExistingAttachments(getAttachmentsList(t));
    setUploadProgress(0);
    setShowModal(true);
  };

  const addFiles = (files: File[]) => {
    setSelectedFiles((prev) => {
      const remainingSlots = MAX_ATTACHMENTS - existingAttachments.length - prev.length;
      if (remainingSlots <= 0) {
        alert(`Maksimal ${MAX_ATTACHMENTS} file lampiran per tugas.`);
        return prev;
      }
      const filesToAdd = files.slice(0, remainingSlots);
      if (files.length > filesToAdd.length) {
        alert(`Hanya ${filesToAdd.length} file yang bisa ditambahkan. Maksimal ${MAX_ATTACHMENTS} file lampiran per tugas.`);
      }
      return [...prev, ...filesToAdd];
    });
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
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
    setUploadingFileIndex(0);

    const finalAttachments: AttachmentData[] = [...existingAttachments];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadingFileIndex(i + 1);
        setUploadProgress(0);
        const fileUrl = await uploadTaskAttachmentToDrive(file);
        finalAttachments.push({ fileName: file.name, fileUrl });
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
        attachment: finalAttachments[0],
        attachments: finalAttachments,
      };

      if (editingTaskId && onUpdateTask) {
        onUpdateTask(editingTaskId, taskData);
      } else {
        onAddTask(taskData);
      }

      setEditingTaskId(null);
      setShowModal(false);
      setSelectedFiles([]);
      setExistingAttachments([]);
      setUploadProgress(0);
      setUploadingFileIndex(0);
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

      {/* DEDICATED UPLOAD / TAMBAH TUGAS BANNER */}
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

      {/* FILTER CONTROLS */}
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
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredTasks.map((t) => {
                const badge = getDeadlineBadge(t.deadline);
                const isDone = completedTaskIds.includes(t.id);

                // Hitung real-time dari Supabase (dengan fallback ke lokal jika belum dimuat)
                const completedCount = allCompletionCounts[t.id] ?? (isDone ? 1 : 0);

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
                    transition={{ duration: 0.2 }}
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
                          <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                            {t.type === 'Kelompok' ? (
                              <Users className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                            )}
                            <span>Tugas {t.type}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 font-medium flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>Deadline: {formattedDate} WIB</span>
                          </span>

                          {badge && (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-between text-xs font-semibold border-t border-slate-200/40 dark:border-white/5 gap-2">
                      <span className="text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                        Detail Tugas <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>

                      <div className="flex flex-col items-end gap-1">
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
                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 select-none">
                          {completedCount}/45 Menandai Selesai
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredTasks.map((t) => {
                const isExplicitDone = completedTaskIds.includes(t.id);
                const isDeadlinePassed = getSafeTime(t.deadline) <= nowTime;
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
                    transition={{ duration: 0.2 }}
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
                      <span className="font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                        {t.type === 'Kelompok' ? (
                          <Users className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                        )}
                        <span>Tugas {t.type}</span>
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

      {/* FORM MODAL: TAMBAH & EDIT TUGAS (PORTAL) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showModal && (
              <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                >
                  <div className="px-6 sm:px-8 py-5 border-b border-slate-200/40 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-900/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                      {editingTaskId ? 'Edit Tugas Perkuliahan' : 'Tambah Tugas Baru'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleTaskFormSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 custom-scrollbar">
                      {/* Judul Tugas */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                          Judul Tugas
                        </label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Misal: Paper Analisis Kebijakan / Tugas Resume"
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Mata Kuliah & Jenis */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                            Mata Kuliah
                          </label>
                          <select
                            required
                            value={course}
                            onChange={(e) => handleCourseChange(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Pilih Mata Kuliah</option>
                            {availableCourseOptions.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                            Jenis Tugas
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['Individu', 'Kelompok'] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                                  type === t
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                                    : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Deadline Tanggal & Jam */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                            Tanggal Deadline
                          </label>
                          <input
                            type="date"
                            required
                            value={deadlineDate}
                            onChange={(e) => setDeadlineDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                            Jam Deadline (WIB)
                          </label>
                          <input
                            type="time"
                            required
                            value={deadlineTime}
                            onChange={(e) => setDeadlineTime(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* HIDDEN INPUTS: Dosen Pemberi Tugas & Prioritas */}
                      <div className="hidden">
                        <input
                          type="text"
                          value={assigner}
                          onChange={(e) => setAssigner(e.target.value)}
                        />
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as any)}
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>

                      {/* Deskripsi & Instruksi */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                          Instruksi & Keterangan
                        </label>
                        <textarea
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Tuliskan format pengerjaan, panduan, dsb..."
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>

                      {/* Link Pengumpulan Khusus */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                          Link Pengumpulan GDrive (Opsional)
                        </label>
                        <input
                          type="url"
                          value={classroomUrl}
                          onChange={(e) => setClassroomUrl(e.target.value)}
                          placeholder="Khusus G-Drive (abaikan jika di Classroom)"
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>

                      {/* Upload File Lampiran */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Lampiran Soal / Panduan (Opsional)
                          </label>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                            {existingAttachments.length + selectedFiles.length}/{MAX_ATTACHMENTS} file
                          </span>
                        </div>

                        {(existingAttachments.length > 0 || selectedFiles.length > 0) && (
                          <div className="space-y-1.5 mb-2">
                            {existingAttachments.map((att, idx) => (
                              <div
                                key={`existing-${idx}`}
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span className="text-[11px] text-slate-700 dark:text-zinc-300 truncate">
                                    {att.fileName}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeExistingAttachment(idx)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                                  title="Hapus lampiran"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}

                            {selectedFiles.map((file, idx) => (
                              <div
                                key={`selected-${idx}`}
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span className="text-[11px] text-slate-700 dark:text-zinc-300 truncate">
                                    {file.name}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSelectedFile(idx)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                                  title="Batalkan file ini"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {existingAttachments.length + selectedFiles.length < MAX_ATTACHMENTS ? (
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                              isDragOver
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                                : 'border-slate-300 dark:border-zinc-700 hover:border-blue-500 bg-slate-50/50 dark:bg-zinc-800/40'
                            }`}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  addFiles(Array.from(e.target.files));
                                }
                                e.target.value = '';
                              }}
                            />
                            <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                            <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                              Pilih atau Tarik File ke Sini
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Bisa lebih dari 1 file, maks {MAX_ATTACHMENTS} file &middot; @10 MB
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 text-center py-2">
                            Lampiran sudah mencapai batas maksimal ({MAX_ATTACHMENTS} file).
                          </p>
                        )}
                      </div>

                      {isUploading && selectedFiles.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-blue-600">
                            <span>
                              Mengunggah file {uploadingFileIndex} dari {selectedFiles.length}...
                            </span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-6 sm:px-8 py-4 border-t border-slate-200/40 dark:border-white/10 flex items-center justify-end gap-3 shrink-0 bg-white/50 dark:bg-zinc-900/50">
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => setShowModal(false)}
                        className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isUploading}
                        className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : editingTaskId ? (
                          'Simpan Perubahan'
                        ) : (
                          'Terbitkan Tugas'
                        )}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

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

                    {(() => {
                      const attachments = getAttachmentsList(selectedDetailTask);
                      if (attachments.length === 0) return null;

                      return (
                        <div className="space-y-2 pt-1">
                          <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                            Lampiran File {attachments.length > 1 ? `(${attachments.length})` : ''}
                          </h4>

                          <div className="space-y-2">
                            {attachments.map((attachment, idx) => (
                              <button
                                key={`${attachment.fileUrl}-${idx}`}
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
                            ))}
                          </div>
                        </div>
                      );
                    })()}
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