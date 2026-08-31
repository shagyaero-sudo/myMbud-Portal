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
  User,
  Users,
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
const MAX_ATTACHMENTS = 5;

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
  
  // Multi-file state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<AttachmentData[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  // Normalisasi lampiran untuk mendukung baik Single maupun Array Lampiran
  const getAttachmentList = (attachment: any): AttachmentData[] => {
    if (!attachment) return [];

    if (Array.isArray(attachment)) {
      return attachment
        .map((att) => {
          if (typeof att === 'string') {
            return {
              fileName: att.split('/').pop()?.split('?')[0] || 'Dokumen Lampiran',
              fileUrl: att,
            };
          }
          return {
            fileName: att.fileName || 'Dokumen Lampiran',
            fileUrl: att.fileUrl || att.url || '',
          };
        })
        .filter((att) => Boolean(att.fileUrl));
    }

    if (typeof attachment === 'string') {
      return [{
        fileName: attachment.split('/').pop()?.split('?')[0] || 'Dokumen Lampiran',
        fileUrl: attachment,
      }];
    }

    const fileUrl = attachment.fileUrl || attachment.url || '';
    if (!fileUrl) return [];

    return [{
      fileName: attachment.fileName || 'Dokumen Lampiran',
      fileUrl,
    }];
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
    setExistingAttachments(getAttachmentList(t.attachment));
    setUploadProgress(0);
    setShowModal(true);
  };

  const handleAddFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const totalAllowed = MAX_ATTACHMENTS - (existingAttachments.length + selectedFiles.length);

    if (totalAllowed <= 0) {
      alert(`Maksimal ${MAX_ATTACHMENTS} lampiran tercapai.`);
      return;
    }

    if (fileArray.length > totalAllowed) {
      alert(`Hanya ${totalAllowed} file yang ditambahkan. Maksimal total ${MAX_ATTACHMENTS} lampiran.`);
    }

    const filesToAdd = fileArray.slice(0, totalAllowed);
    setSelectedFiles((prev) => [...prev, ...filesToAdd]);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingAttachment = (index: number) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
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

    const base64Data = await fileToBase64(file);
    const safeMimeType = getMimeType(file);

    const payload = {
      fileName: file.name,
      mimeType: safeMimeType,
      base64: base64Data,
      folderName: 'myMbud Task Attachments',
    };

    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Upload ${file.name} gagal (${response.status}).`);

    const data = await response.json();
    if (data.status !== 'success') throw new Error(data.message);

    return data.url;
  };

  const uploadMultipleAttachmentsToDrive = async (files: File[]): Promise<AttachmentData[]> => {
    if (files.length === 0) return [];

    setUploadProgress(10);
    const totalFiles = files.length;
    let completedCount = 0;

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return 90;
        return Math.min(prev + 5, 90);
      });
    }, 300);

    try {
      const uploadPromises = files.map(async (file) => {
        const fileUrl = await uploadTaskAttachmentToDrive(file);
        completedCount++;
        setUploadProgress(10 + Math.round((completedCount / totalFiles) * 80));
        return {
          fileName: file.name,
          fileUrl,
        };
      });

      const results = await Promise.all(uploadPromises);
      clearInterval(progressInterval);
      setUploadProgress(100);
      return results;
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

    try {
      let newlyUploaded: AttachmentData[] = [];
      if (selectedFiles.length > 0) {
        newlyUploaded = await uploadMultipleAttachmentsToDrive(selectedFiles);
      }

      const finalAttachmentsList: AttachmentData[] = [
        ...existingAttachments,
        ...newlyUploaded,
      ];

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
        ...(finalAttachmentsList.length > 0 ? { attachment: finalAttachmentsList as any } : {})
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
                Tambahkan tugas baru beserta instruksi dan hingga 5 lampiran PDF/dokumen.
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
                const attachments = getAttachmentList(t.attachment);
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

                      {attachments.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 px-3 py-1.5 rounded-xl border border-blue-100/40 dark:border-blue-900/30 w-fit">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{attachments.length} File Lampiran</span>
                        </div>
                      )}

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
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Selesai</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5 text-slate-400" />
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
          /* RIWAYAT TUGAS */
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((t) => {
                const isDone = completedTaskIds.includes(t.id);
                const attachments = getAttachmentList(t.attachment);
                const formattedDate = new Date(t.deadline).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <motion.div
                    layout
                    key={t.id}
                    onClick={() => setSelectedDetailTask(t)}
                    className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl p-4 border border-white/60 dark:border-white/10 flex items-center justify-between gap-3 hover:border-blue-500/40 transition-all cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => handleToggleComplete(e, t)}
                        className="p-1 cursor-pointer shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-zinc-600" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-400 dark:text-zinc-500' : 'text-slate-800 dark:text-zinc-200'}`}>
                          {t.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{t.course}</span>
                          <span>•</span>
                          <span>{formattedDate}</span>
                          {attachments.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-blue-500"><Paperclip className="w-3 h-3" /> {attachments.length} File</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* DETAIL TASK MODAL */}
      <AnimatePresence>
        {selectedDetailTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/40 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/40">
                    {selectedDetailTask.course}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mt-2">
                    {selectedDetailTask.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  {isOfficer && (
                    <>
                      <button
                        onClick={() => {
                          const taskToEdit = selectedDetailTask;
                          setSelectedDetailTask(null);
                          handleOpenEditModal(taskToEdit);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="Edit Tugas"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Yakin ingin menghapus tugas ini?')) {
                            onDeleteTask(selectedDetailTask.id);
                            setSelectedDetailTask(null);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Hapus Tugas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedDetailTask(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-700 dark:text-zinc-300">
                <div>
                  <h4 className="font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider text-[10px] mb-1">
                    Instruksi Tugas
                  </h4>
                  <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800 whitespace-pre-wrap leading-relaxed">
                    {renderTextWithLinks(selectedDetailTask.description || '')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Diberikan Oleh</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 mt-0.5 block">{selectedDetailTask.assigner}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Batas Waktu</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 mt-0.5 block">{formatDeadlineDetails(selectedDetailTask.deadline)}</span>
                  </div>
                </div>

                {/* FILE LAMPIRAN LIST */}
                {getAttachmentList(selectedDetailTask.attachment).length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider text-[10px] mb-2 flex items-center justify-between">
                      <span>Dokumen Lampiran ({getAttachmentList(selectedDetailTask.attachment).length})</span>
                    </h4>
                    <div className="space-y-2">
                      {getAttachmentList(selectedDetailTask.attachment).map((att, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shrink-0">
                              <FileIcon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate text-xs">
                              {att.fileName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setPreviewAttachment(att)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                              Pratinjau
                            </button>
                            <button
                              onClick={(e) => handleForceDownload(e, att.fileUrl, att.fileName)}
                              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 rounded-xl transition-colors cursor-pointer"
                              title="Unduh File"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDetailTask.classroomUrl && (
                  <div className="pt-2">
                    <a
                      href={selectedDetailTask.classroomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka Classroom / Portal Perkuliahan</span>
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT TASK MODAL WITH MULTI FILE UPLOAD */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/40 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {editingTaskId ? 'Edit Tugas Perkuliahan' : 'Tambah Tugas Perkuliahan'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTaskFormSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Mata Kuliah
                  </label>
                  <select
                    value={course}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="" disabled>-- Pilih Mata Kuliah --</option>
                    {availableCourseOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Judul Tugas
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Laporan Mingguan Makroekonomi"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Jenis Tugas
                    </label>
                    <select
                      value={type}
                      onChange={(e: any) => setType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="Individu">Individu</option>
                      <option value="Kelompok">Kelompok</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Diberikan Oleh
                    </label>
                    <input
                      type="text"
                      value={assigner}
                      onChange={(e) => setAssigner(e.target.value)}
                      placeholder="Nama Dosen Pengampu"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Tanggal Deadline
                    </label>
                    <input
                      type="date"
                      required
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Jam Deadline
                    </label>
                    <input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Rincian Instruksi Tugas
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Masukkan instruksi, format pengerjaan, atau tautan acuan..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Link Classroom / Submission
                  </label>
                  <input
                    type="url"
                    value={classroomUrl}
                    onChange={(e) => setClassroomUrl(e.target.value)}
                    placeholder="https://classroom.its.ac.id/..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* FILE MULTI-UPLOAD SECTION */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-zinc-300">
                      Lampiran Tugas (PDF / Dokumen)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {existingAttachments.length + selectedFiles.length} / {MAX_ATTACHMENTS} File
                    </span>
                  </div>

                  {/* Existing Attachments */}
                  {existingAttachments.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {existingAttachments.map((att, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs">
                          <span className="truncate font-medium text-slate-700 dark:text-zinc-300">{att.fileName}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingAttachment(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Newly Added Files */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-xs">
                          <span className="truncate font-medium text-blue-700 dark:text-blue-300">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewFile(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Box */}
                  {existingAttachments.length + selectedFiles.length < MAX_ATTACHMENTS && (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                        isDragOver
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                          : 'border-slate-300 dark:border-zinc-700 hover:border-blue-400'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          if (e.target.files) handleAddFiles(e.target.files);
                        }}
                        multiple
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                        className="hidden"
                      />
                      <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                        Klik atau seret file PDF/Materi ke sini
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Maksimal {MAX_ATTACHMENTS} file dokumen sekaligus
                      </p>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-600">
                      <span>Mengunggah dokumen lampiran...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingTaskId ? 'Simpan Perubahan' : 'Tambah Tugas'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREVIEW ATTACHMENT MODAL */}
      <AnimatePresence>
        {previewAttachment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-white/20 dark:border-zinc-800 rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900">
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="font-bold text-xs text-slate-800 dark:text-zinc-200 truncate">
                    {previewAttachment.fileName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleForceDownload(e, previewAttachment.fileUrl, previewAttachment.fileName)}
                    className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 rounded-xl"
                    title="Unduh"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewAttachment(null)}
                    className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 dark:bg-zinc-950 overflow-hidden relative flex items-center justify-center">
                {isPdfFile(previewAttachment.fileName) ? (
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewAttachment.fileUrl)}&embedded=true`}
                    className="w-full h-full border-none"
                    title="PDF Preview"
                  />
                ) : isImageFile(previewAttachment.fileName) ? (
                  <img
                    src={previewAttachment.fileUrl}
                    alt={previewAttachment.fileName}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-500">
                    <FileIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Pratinjau tidak tersedia untuk format file ini.</p>
                    <button
                      onClick={(e) => handleForceDownload(e, previewAttachment.fileUrl, previewAttachment.fileName)}
                      className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                    >
                      Unduh File
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};