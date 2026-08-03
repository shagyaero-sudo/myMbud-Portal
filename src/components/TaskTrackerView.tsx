import React, { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Clock,
  Trash2,
  Edit2,
  ExternalLink,
  X,
  ChevronRight,
  BookOpenCheck,
  Paperclip,
  UploadCloud,
  File as FileIcon,
  Loader2,
  Download,
} from 'lucide-react';
import { Task } from '../types';

interface TaskTrackerViewProps {
  tasks: Task[];
  isOfficer: boolean;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask?: (id: string, updatedTask: Partial<Task>) => void;
  onUpdateTaskStatus: (
    id: string,
    newStatus: 'todo' | 'in_progress' | 'done'
  ) => void;
  onDeleteTask: (id: string) => void;
}

interface AttachmentData {
  fileName: string;
  fileUrl: string;
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

  const [filterType, setFilterType] = useState<
    'ALL' | 'Individu' | 'Kelompok'
  >('ALL');

  const [activeTab, setActiveTab] =
    useState<'active' | 'history'>('active');

  const [selectedDetailTask, setSelectedDetailTask] =
    useState<Task | null>(null);

  /* =========================
     ATTACHMENT PREVIEW
  ========================= */

  const [previewAttachment, setPreviewAttachment] =
    useState<AttachmentData | null>(null);

  /* =========================
     ADD / EDIT STATE
  ========================= */

  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] =
    useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [description, setDescription] = useState('');

  const [type, setType] =
    useState<'Individu' | 'Kelompok'>('Individu');

  const [assigner, setAssigner] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');

  const [priority, setPriority] =
    useState<'High' | 'Medium' | 'Low'>('High');

  const [classroomUrl, setClassroomUrl] = useState('');

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [existingAttachment, setExistingAttachment] =
    useState<AttachmentData | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);

  /* =========================
     BASIC DATA
  ========================= */

  const uniqueCourses = Array.from(
    new Set(tasks.map((t) => t.course))
  );

  const now = Date.now();

  const activeTaskCount = tasks.filter(
    (t) => new Date(t.deadline).getTime() > now
  ).length;

  const historyTaskCount = tasks.filter(
    (t) => new Date(t.deadline).getTime() <= now
  ).length;

  const filteredTasks = tasks.filter((t) => {
    const isPast =
      new Date(t.deadline).getTime() <= now;

    if (activeTab === 'active' && isPast) return false;
    if (activeTab === 'history' && !isPast) return false;

    const searchLower = search.toLowerCase();

    const matchSearch =
      t.title.toLowerCase().includes(searchLower) ||
      t.course.toLowerCase().includes(searchLower) ||
      t.assigner.toLowerCase().includes(searchLower);

    const matchCourse =
      filterCourse === 'ALL' ||
      t.course === filterCourse;

    const matchType =
      filterType === 'ALL' ||
      t.type === filterType;

    return (
      matchSearch &&
      matchCourse &&
      matchType
    );
  });

  /* =========================
     DEADLINE HELPERS
  ========================= */

  const getDeadlineBadge = (
    deadlineStr: string
  ) => {
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
      (deadlineStart - todayStart) /
        (1000 * 3600 * 24)
    );

    if (diffDays < 0) {
      return {
        label: 'Tenggat Lewat',
        bg:
          'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700',
      };
    }

    if (diffDays <= 2) {
      const dayText =
        diffDays <= 0
          ? 'H-0'
          : `H-${diffDays}`;

      return {
        label: `URGENT ${dayText}`,
        bg:
          'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 animate-pulse',
      };
    }

    if (diffDays <= 5) {
      return {
        label: `Mepet H-${diffDays}`,
        bg:
          'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
      };
    }

    return {
      label: `Masih H-${diffDays}`,
      bg:
        'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
    };
  };

  const formatDeadlineDetails = (
    dateStr: string
  ) => {
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

  /* =========================
     ATTACHMENT HELPERS
  ========================= */

  const getAttachmentData = (
    attachment: any
  ): AttachmentData | null => {
    if (!attachment) return null;

    if (typeof attachment === 'string') {
      return {
        fileName:
          attachment
            .split('/')
            .pop()
            ?.split('?')[0] ||
          'Dokumen Lampiran',
        fileUrl: attachment,
      };
    }

    const fileUrl =
      attachment.fileUrl ||
      attachment.url ||
      '';

    if (!fileUrl) return null;

    return {
      fileName:
        attachment.fileName ||
        'Dokumen Lampiran',
      fileUrl,
    };
  };

  const getFileExtension = (
    fileName: string
  ) => {
    return (
      fileName
        .split('.')
        .pop()
        ?.toLowerCase() || ''
    );
  };

  const isImageFile = (
    fileName: string
  ) => {
    return [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'bmp',
      'svg',
      'avif',
    ].includes(
      getFileExtension(fileName)
    );
  };

  const isPdfFile = (
    fileName: string
  ) => {
    return getFileExtension(fileName) === 'pdf';
  };

  /* =========================
     MODAL HANDLERS
  ========================= */

  const handleOpenAddModal = () => {
    setEditingTaskId(null);
    setTitle('');

    if (uniqueCourses.length > 0) {
      setCourse(uniqueCourses[0]);
    } else {
      setCourse('');
    }

    setDescription('');
    setType('Individu');
    setAssigner('');
    setDeadlineDate('');
    setDeadlineTime('23:59');
    setPriority('High');
    setClassroomUrl('');
    setSelectedFile(null);
    setExistingAttachment(null);
    setUploadProgress(0);
    setShowModal(true);
  };

  const handleOpenEditModal = (
    t: Task
  ) => {
    setEditingTaskId(t.id);
    setTitle(t.title);
    setCourse(t.course);
    setDescription(t.description || '');
    setType(t.type);
    setAssigner(t.assigner || '');

    if (t.deadline) {
      const d = new Date(t.deadline);

      if (!isNaN(d.getTime())) {
        const yyyy =
          d.getFullYear();

        const mm = String(
          d.getMonth() + 1
        ).padStart(2, '0');

        const dd = String(
          d.getDate()
        ).padStart(2, '0');

        setDeadlineDate(
          `${yyyy}-${mm}-${dd}`
        );

        const hh = String(
          d.getHours()
        ).padStart(2, '0');

        const min = String(
          d.getMinutes()
        ).padStart(2, '0');

        setDeadlineTime(
          `${hh}:${min}`
        );
      }
    }

    setPriority(
      t.priority || 'High'
    );

    setClassroomUrl(
      t.classroomUrl || ''
    );

    setSelectedFile(null);

    setExistingAttachment(
      getAttachmentData(
        t.attachment
      )
    );

    setUploadProgress(0);
    setShowModal(true);
  };

  /* =========================
     DRAG & DROP
  ========================= */

  const handleDragOver = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
    setIsDragOver(false);

    if (
      e.dataTransfer.files &&
      e.dataTransfer.files.length > 0
    ) {
      setSelectedFile(
        e.dataTransfer.files[0]
      );

      setExistingAttachment(null);
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      e.target.files &&
      e.target.files.length > 0
    ) {
      setSelectedFile(
        e.target.files[0]
      );

      setExistingAttachment(null);
    }
  };

  /* =========================
     GOOGLE DRIVE UPLOAD VIA GAS
  ========================= */

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadTaskAttachmentToDrive = async (file: File): Promise<string> => {
    const GAS_URL = "https://script.google.com/macros/s/AKfycbyce8cTZ2F25PwyfISpmVJJDMiIunl8G8lCyzkPKQaiuUl-nxKNM5i9b72MMo4M_xis/exec";

    setUploadProgress(10);
    const base64Data = await fileToBase64(file);
    setUploadProgress(40);

    const payload = {
      fileName: file.name,
      mimeType: file.type,
      base64: base64Data,
      folderName: "myMbud Task Attachments",
    };

    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setUploadProgress(80);

    if (!response.ok) {
      throw new Error(`Upload Lampiran Tugas gagal (${response.status}).`);
    }

    const data = await response.json();
    setUploadProgress(100);

    if (data.status !== 'success') {
      throw new Error(data.message);
    }

    return data.url;
  };

  /* =========================
     SAVE TASK
  ========================= */

  const handleTaskFormSubmit =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (
        !title.trim() ||
        !course.trim() ||
        !deadlineDate
      ) {
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      let finalAttachment:
        | AttachmentData
        | undefined =
        existingAttachment ||
        undefined;

      try {
        if (selectedFile) {
          const fileUrl =
            await uploadTaskAttachmentToDrive(
              selectedFile
            );

          finalAttachment = {
            fileName:
              selectedFile.name,
            fileUrl,
          };
        }

        const fullIsoDeadline =
          new Date(
            `${deadlineDate}T${
              deadlineTime || '23:59'
            }:00`
          ).toISOString();

        const taskData:
          Omit<Task, 'id'> = {
          title: title.trim(),
          course: course.trim(),
          description:
            description.trim(),
          type,
          assigner:
            assigner.trim() ||
            'Dosen Pengampu',
          deadline:
            fullIsoDeadline,
          status: 'todo',
          priority,

          ...(classroomUrl.trim()
            ? {
                classroomUrl:
                  classroomUrl.trim(),
              }
            : {}),

          ...(finalAttachment
            ? {
                attachment:
                  finalAttachment,
              }
            : {}),
        };

        if (
          editingTaskId &&
          onUpdateTask
        ) {
          const updateData:
            Partial<Task> = {
            title:
              taskData.title,
            course:
              taskData.course,
            description:
              taskData.description,
            type:
              taskData.type,
            assigner:
              taskData.assigner,
            deadline:
              taskData.deadline,
            priority:
              taskData.priority,

            ...(taskData.classroomUrl
              ? {
                  classroomUrl:
                    taskData.classroomUrl,
                }
              : {}),

            ...(taskData.attachment
              ? {
                  attachment:
                    taskData.attachment,
                }
              : {}),
          };

          onUpdateTask(
            editingTaskId,
            updateData
          );
        } else {
          onAddTask(taskData);
        }

        setEditingTaskId(null);
        setShowModal(false);
        setSelectedFile(null);
        setExistingAttachment(null);
        setUploadProgress(0);
      } catch (error) {
        console.error(
          'Gagal menyimpan tugas:',
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat menyimpan tugas.';

        alert(
          `Gagal menyimpan tugas.\n\n${message}`
        );
      } finally {
        setIsUploading(false);
      }
    };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="space-y-6 pb-12">

      {/* =========================
          HEADER BANNER
      ========================= */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            Mading Informasi Tugas
          </h2>

          <a
            href="https://classroom.its.ac.id/auth/oidc"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold border border-slate-200/80 dark:border-zinc-700 transition-all mt-2.5"
          >
            <BookOpenCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              myITS Classroom
            </span>
          </a>
        </div>

        {isOfficer && (
          <button
            onClick={
              handleOpenAddModal
            }
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>
              Tambah Tugas Baru
            </span>
          </button>
        )}
      </div>

      {/* =========================
          FILTER CONTROLS
      ========================= */}

      <div className="space-y-2.5">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Cari nama tugas, mata kuliah, atau dosen..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none"
          />
        </div>

        <div className="flex flex-row items-center gap-2 sm:gap-3 w-full">
          <select
            value={filterCourse}
            onChange={(e) =>
              setFilterCourse(
                e.target.value
              )
            }
            className="flex-1 min-w-0 w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none truncate"
          >
            <option value="ALL">
              Semua Mata Kuliah
            </option>

            {uniqueCourses.map(
              (c) => (
                <option
                  key={c}
                  value={c}
                >
                  {c}
                </option>
              )
            )}
          </select>

          <div className="flex items-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-1 rounded-2xl gap-1 shrink-0 overflow-x-auto shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none">
            {(
              [
                'ALL',
                'Individu',
                'Kelompok',
              ] as const
            ).map((option) => (
              <button
                key={option}
                onClick={() =>
                  setFilterType(
                    option
                  )
                }
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs whitespace-nowrap transition-all ${
                  filterType === option
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                {option === 'ALL'
                  ? 'Semua'
                  : option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =========================
          TASK LIST
      ========================= */}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-2.5 sm:px-4 sm:py-3 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none">
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-zinc-800 rounded-full w-full sm:w-auto">
            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  'active'
                )
              }
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab ===
                'active'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <span>
                Tugas Aktif
              </span>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab ===
                  'active'
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                }`}
              >
                {activeTaskCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  'history'
                )
              }
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab ===
                'history'
                  ? 'bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <span>
                Riwayat
              </span>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab ===
                  'history'
                    ? 'bg-white/20 text-white dark:bg-zinc-800 dark:text-zinc-200'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                }`}
              >
                {historyTaskCount}
              </span>
            </button>
          </div>
        </div>

        {filteredTasks.length ===
        0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-12 text-center text-slate-400 dark:text-zinc-500 text-xs shadow-sm">
            {activeTab ===
            'active'
              ? 'Tidak ada tugas aktif yang sesuai.'
              : 'Belum ada riwayat tugas yang telah berlalu.'}
          </div>
        ) : activeTab ===
          'active' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map(
              (t) => {
                const badge =
                  getDeadlineBadge(
                    t.deadline
                  );

                const formattedDate =
                  new Date(
                    t.deadline
                  ).toLocaleString(
                    'id-ID',
                    {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute:
                        '2-digit',
                    }
                  );

                return (
                  <div
                    key={t.id}
                    onClick={() =>
                      setSelectedDetailTask(
                        t
                      )
                    }
                    className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] dark:shadow-none space-y-4 border border-slate-100 dark:border-zinc-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
                          {t.course}
                        </span>

                        {badge && (
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}
                          >
                            {
                              badge.label
                            }
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors leading-snug">
                          {t.title}
                        </h3>

                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">
                          Dosen:{' '}
                          {
                            t.assigner
                          }
                        </p>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed bg-slate-50/70 dark:bg-zinc-800/60 p-3 rounded-2xl line-clamp-2">
                        {t.description ||
                          'Klik untuk melihat rincian instruksi tugas lengkap.'}
                      </p>

                      <div className="space-y-1 pt-1 text-xs text-slate-500 dark:text-zinc-400 border-t border-slate-50 dark:border-zinc-800">
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="font-semibold text-slate-700 dark:text-zinc-300">
                            Tugas{' '}
                            {
                              t.type
                            }
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />

                            <span>
                              Deadline:{' '}
                              {
                                formattedDate
                              }{' '}
                              WIB
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 border-t border-slate-100/60 dark:border-zinc-800">
                      <span className="group-hover:underline">
                        Detail Tugas
                      </span>

                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map(
              (t) => {
                const formattedDate =
                  new Date(
                    t.deadline
                  ).toLocaleString(
                    'id-ID',
                    {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute:
                        '2-digit',
                    }
                  );

                return (
                  <div
                    key={t.id}
                    onClick={() =>
                      setSelectedDetailTask(
                        t
                      )
                    }
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/80 border border-slate-100 dark:border-zinc-800 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-zinc-700/50">
                        {t.course}
                      </span>

                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-zinc-700/60">
                        Selesai
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {t.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                        Dosen:{' '}
                        {
                          t.assigner
                        }
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-1.5 border-t border-slate-100 dark:border-zinc-800">
                      <span className="font-medium text-slate-700 dark:text-zinc-300">
                        Tugas{' '}
                        {
                          t.type
                        }
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />

                        <span>
                          {
                            formattedDate
                          }{' '}
                          WIB
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          DETAIL MODAL
      ===================================================== */}

      {selectedDetailTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

            {/* HEADER */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-start gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
                  {
                    selectedDetailTask.course
                  }
                </span>

                <h2 className="text-lg font-bold pt-1 text-slate-900 dark:text-zinc-100">
                  {
                    selectedDetailTask.title
                  }
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedDetailTask(
                    null
                  )
                }
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-2xl text-xs border border-slate-100 dark:border-zinc-800">
                <div>
                  <span className="text-slate-400 dark:text-zinc-400 block mb-0.5">
                    Dosen:
                  </span>

                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {
                      selectedDetailTask.assigner
                    }
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 dark:text-zinc-400 block mb-0.5">
                    Prioritas:
                  </span>

                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {
                      selectedDetailTask.priority
                    }
                  </span>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200/50 dark:border-zinc-700/50">
                  <span className="text-slate-400 dark:text-zinc-400 block mb-0.5">
                    Tenggat:
                  </span>

                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {formatDeadlineDetails(
                      selectedDetailTask.deadline
                    )}
                  </span>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Rincian Tugas
                </h4>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 text-xs leading-relaxed text-slate-700 dark:text-zinc-300 whitespace-pre-wrap border border-slate-100 dark:border-zinc-700/60">
                  {
                    selectedDetailTask.description ||
                    'Tidak ada instruksi.'
                  }
                </div>
              </div>

              {/* =================================================
                  ATTACHMENT
              ================================================= */}

              {selectedDetailTask.attachment && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    Lampiran File / Dokumen
                  </h4>

                  {(() => {
                    const attachment =
                      getAttachmentData(
                        selectedDetailTask.attachment
                      );

                    if (!attachment) {
                      return null;
                    }

                    return (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewAttachment(
                            attachment
                          )
                        }
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-semibold transition-all group shadow-xs text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />

                          <div className="min-w-0">
                            <span className="truncate block">
                              {
                                attachment.fileName
                              }
                            </span>

                            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 block mt-0.5">
                              {isImageFile(
                                attachment.fileName
                              )
                                ? 'Klik untuk melihat gambar'
                                : isPdfFile(
                                    attachment.fileName
                                  )
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

            {/* FOOTER */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900">
              {isOfficer ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const t =
                        selectedDetailTask;

                      setSelectedDetailTask(
                        null
                      );

                      handleOpenEditModal(
                        t
                      );
                    }}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      onDeleteTask(
                        selectedDetailTask.id
                      );

                      setSelectedDetailTask(
                        null
                      );
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

              <div className="flex items-center gap-2">
                {selectedDetailTask.classroomUrl && (
                  <a
                    href={
                      selectedDetailTask.classroomUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />

                    <span>
                      Link Pengumpulan
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ATTACHMENT VIEWER MODAL (NATIVE GOOGLE DRIVE ENGINE)
      ===================================================== */}

      {previewAttachment && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() =>
            setPreviewAttachment(null)
          }
        >
          <div
            className="relative w-full max-w-6xl h-[92vh] bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* VIEWER HEADER */}

            <div className="shrink-0 h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 shrink-0">
                  {isImageFile(
                    previewAttachment.fileName
                  ) ? (
                    <FileIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 truncate max-w-[55vw] sm:max-w-[700px]">
                    {
                      previewAttachment.fileName
                    }
                  </p>

                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                    Pratinjau lampiran
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={
                    previewAttachment.fileUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  download={
                    previewAttachment.fileName
                  }
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh
                </a>

                <button
                  type="button"
                  onClick={() =>
                    setPreviewAttachment(
                      null
                    )
                  }
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  aria-label="Tutup viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* VIEWER CONTENT */}

            <div className="flex-1 min-h-0 bg-slate-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
              {isImageFile(
                previewAttachment.fileName
              ) ? (
                <div className="w-full h-full overflow-auto flex items-center justify-center p-4 sm:p-8">
                  <img
                    src={
                      previewAttachment.fileUrl
                    }
                    alt={
                      previewAttachment.fileName
                    }
                    className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                  />
                </div>
              ) : isPdfFile(
                  previewAttachment.fileName
                ) ? (
                /* MENGGUNAKAN NATIVE DRIVE PREVIEW URL */
                <iframe
                  src={previewAttachment.fileUrl}
                  title={
                    previewAttachment.fileName
                  }
                  className="w-full h-full border-0 bg-white"
                />
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
                    href={
                      previewAttachment.fileUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    download={
                      previewAttachment.fileName
                    }
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Unduh File
                  </a>
                </div>
              )}
            </div>

            {/* MOBILE DOWNLOAD */}

            <div className="sm:hidden shrink-0 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
              <a
                href={
                  previewAttachment.fileUrl
                }
                target="_blank"
                rel="noreferrer"
                download={
                  previewAttachment.fileName
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                Unduh Lampiran
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">

            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                {editingTaskId
                  ? 'Edit Tugas'
                  : 'Tambah Tugas Baru'}
              </h3>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={
                handleTaskFormSubmit
              }
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">

                {/* TITLE */}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Judul Tugas
                  </label>

                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* COURSE / TYPE */}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Mata Kuliah
                    </label>

                    <input
                      type="text"
                      required
                      value={course}
                      onChange={(e) =>
                        setCourse(
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Jenis Tugas
                    </label>

                    <select
                      value={type}
                      onChange={(e) =>
                        setType(
                          e.target
                            .value as
                            | 'Individu'
                            | 'Kelompok'
                        )
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Individu">
                        Individu
                      </option>

                      <option value="Kelompok">
                        Kelompok
                      </option>
                    </select>
                  </div>
                </div>

                {/* DEADLINE */}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Tanggal Deadline
                    </label>

                    <input
                      type="date"
                      required
                      value={
                        deadlineDate
                      }
                      onChange={(e) =>
                        setDeadlineDate(
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Jam Deadline
                    </label>

                    <input
                      type="time"
                      value={
                        deadlineTime
                      }
                      onChange={(e) =>
                        setDeadlineTime(
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Instruksi Tugas
                  </label>

                  <textarea
                    rows={2}
                    value={
                      description
                    }
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* CLASSROOM URL */}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Link Pengumpulan (Opsional)
                  </label>

                  <input
                    type="url"
                    value={
                      classroomUrl
                    }
                    onChange={(e) =>
                      setClassroomUrl(
                        e.target.value
                      )
                    }
                    placeholder="https://classroom.google.com/..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* CLOUDINARY ATTACHMENT */}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Lampiran File (Opsional)
                  </label>

                  <div
                    onDragOver={
                      handleDragOver
                    }
                    onDragLeave={
                      handleDragLeave
                    }
                    onDrop={
                      handleDrop
                    }
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700/50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={
                        fileInputRef
                      }
                      onChange={
                        handleFileSelect
                      }
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                          <FileIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>

                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 max-w-[200px] truncate">
                          {
                            selectedFile.name
                          }
                        </p>

                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                          {(
                            selectedFile.size /
                            1024 /
                            1024
                          ).toFixed(
                            2
                          )}{' '}
                          MB • Siap diunggah
                        </p>
                      </div>
                    ) : existingAttachment ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-slate-200 dark:bg-zinc-700 rounded-full">
                          <Paperclip className="w-6 h-6 text-slate-600 dark:text-zinc-400" />
                        </div>

                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 max-w-[200px] truncate">
                          {
                            existingAttachment.fileName
                          }
                        </p>

                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                          File sudah tersimpan sebelumnya. Klik untuk mengganti.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-slate-200 dark:bg-zinc-700 rounded-full">
                          <UploadCloud className="w-6 h-6 text-slate-600 dark:text-zinc-400" />
                        </div>

                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          Klik atau seret file ke sini
                        </p>

                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                          PDF, Word, Excel, Gambar
                        </p>
                      </div>
                    )}
                  </div>

                  {isUploading && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                        <span>
                          Mengunggah ke Google Drive...
                        </span>

                        <span>
                          {Math.round(
                            uploadProgress
                          )}
                          %
                        </span>
                      </div>

                      <div className="bg-slate-100 dark:bg-zinc-800 rounded-full h-2 w-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{
                            width: `${uploadProgress}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FORM FOOTER */}

              <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3 bg-white dark:bg-zinc-900">
                <button
                  type="button"
                  disabled={
                    isUploading
                  }
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs disabled:opacity-50 transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    isUploading
                  }
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 disabled:opacity-70 transition-colors shadow-md shadow-blue-500/20"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    'Simpan Tugas'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};