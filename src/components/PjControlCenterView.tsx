import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  CheckSquare, 
  Calendar, 
  Megaphone, 
  Plus, 
  Trash2, 
  Lock,
  LogOut,
  Pencil,
  X,
  Send,
  Users,
  BookOpen,
  Link2,
  UploadCloud,
  Loader2,
  FileIcon,
  AlertTriangle
} from 'lucide-react';
import { Task, ScheduleItem, Contact, MaterialFile } from '../types';
import { sendOfficerNotification } from '../services/oneSignalNotification';

interface AttachmentData {
  fileName: string;
  fileUrl: string;
}

interface DeleteTarget {
  type: 'task' | 'schedule' | 'material';
  id: string;
  title: string;
}

interface PjControlCenterViewProps {
  tasks: Task[];
  schedules: ScheduleItem[];
  contacts: Contact[];
  materials: MaterialFile[];
  isOfficer: boolean;
  setIsOfficer: (val: boolean) => void;
  onNavigateTab: (tab: string) => void;
  onAddTask: (task: Omit<Task, 'id'>) => Promise<void> | void;
  onUpdateTask: (id: string, task: Partial<Task>) => Promise<void> | void;
  onDeleteTask: (id: string) => Promise<void> | void;
  onAddContact: (contact: Omit<Contact, 'id'>) => Promise<void> | void;
  onUpdateContact: (id: string, contact: Partial<Contact>) => Promise<void> | void;
  onDeleteContact?: (id: string) => Promise<void> | void;
  onAddMaterial: (material: Omit<MaterialFile, 'id' | 'uploadDate'>) => Promise<void> | void;
  onDeleteMaterial: (id: string) => Promise<void> | void;
}

const GAS_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbyce8cTZ2F25PwyfISpmVJJDMiIunl8G8lCyzkPKQaiuUl-nxKNM5i9b72MMo4M_xis/exec';
const DEFAULT_CLASSROOM_URL = 'https://classroom.its.ac.id/auth/oidc';
const MAX_ATTACHMENTS = 5;

// HELPER: Convert File ke Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

// HELPER: Get Safe MIME Type
const getMimeType = (file: File): string => {
  if (file.type && file.type.trim() !== '') return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'pdf': return 'application/pdf';
    case 'doc':
    case 'docx': return 'application/msword';
    default: return 'application/octet-stream';
  }
};

export const PjControlCenterView: React.FC<PjControlCenterViewProps> = ({
  tasks,
  schedules,
  contacts,
  materials,
  isOfficer,
  setIsOfficer,
  onNavigateTab,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onAddMaterial,
  onDeleteMaterial,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'schedules' | 'materials' | 'announcements'>('tasks');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // --- STATE CONFIRMATION DELETE MODAL ---
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // --- STATE MODAL TUGAS ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    course: '',
    type: 'Individu' as 'Individu' | 'Kelompok',
    deadlineDate: '',
    deadlineTime: '23:59',
    description: '',
    assigner: '',
    priority: 'High' as 'High' | 'Medium' | 'Low',
  });
  const [selectedTaskFiles, setSelectedTaskFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<AttachmentData[]>([]);
  const [isUploadingTask, setIsUploadingTask] = useState(false);
  const [uploadProgressTask, setUploadProgressTask] = useState(0);
  const [uploadingFileIndexTask, setUploadingFileIndexTask] = useState(0);
  const [isTaskDragOver, setIsTaskDragOver] = useState(false);
  const taskFileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE MODAL JADWAL / KONTAK ---
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    code: '',
    course: '',
    lecturerName: '',
    lecturerPhone: '',
    lecturerName2: '',
    lecturerPhone2: '',
    pjName: '',
    pjPhone: '',
    room: '',
    scheduleDayTime: '',
    sks: 3 as number | '',
    attendanceUrl: '',
    targetNrps: '',
  });

  // --- STATE MODAL MATERI / KNOWLEDGE BASE ---
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    courseName: '',
    weekNum: '',
    title: '',
  });
  const [selectedMaterialFile, setSelectedMaterialFile] = useState<File | null>(null);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [uploadProgressMaterial, setUploadProgressMaterial] = useState(0);
  const [isMaterialDragOver, setIsMaterialDragOver] = useState(false);
  const materialFileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE BROADCAST ---
  const [targetNrp, setTargetNrp] = useState('ALL');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // AUTH PIN
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === '2025' || pinInput === '2026') {
      setIsOfficer(true);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('PIN salah! Silakan coba lagi.');
    }
  };

  // UPLOAD TO GAS DRIVE
  const uploadFileToGAS = async (file: File, folderName: string, setProgress: (val: number) => void): Promise<string> => {
    setProgress(8);
    const base64Data = await fileToBase64(file);
    setProgress(18);

    const payload = {
      fileName: file.name,
      mimeType: getMimeType(file),
      base64: base64Data,
      folderName,
    };

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 92 ? 92 : Math.min(Math.round(prev + (prev < 50 ? 8 : 3)), 92)));
    }, 280);

    try {
      const response = await fetch(GAS_UPLOAD_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      clearInterval(interval);
      if (!response.ok) throw new Error(`Upload gagal (${response.status})`);
      const data = await response.json();
      setProgress(100);
      if (data.status !== 'success') throw new Error(data.message);
      return data.url;
    } catch (err) {
      clearInterval(interval);
      throw err;
    }
  };

  // HANDLER PROSES HAPUS SETELAH KONFIRMASI
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'task') {
        await onDeleteTask(deleteTarget.id);
      } else if (deleteTarget.type === 'schedule') {
        if (onDeleteContact) {
          await onDeleteContact(deleteTarget.id);
        }
      } else if (deleteTarget.type === 'material') {
        await onDeleteMaterial(deleteTarget.id);
      }
    } catch (err) {
      console.error('Gagal menghapus item:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  // HANDLER MODAL TUGAS
  const handleOpenTaskModal = (task?: Task) => {
    if (task) {
      setEditingTaskId(task.id);
      const d = task.deadline ? new Date(task.deadline) : new Date();
      setTaskForm({
        title: task.title,
        course: task.course,
        type: task.type || 'Individu',
        deadlineDate: !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '',
        deadlineTime: !isNaN(d.getTime()) ? d.toTimeString().slice(0, 5) : '23:59',
        description: task.description || '',
        assigner: task.assigner || '',
        priority: task.priority || 'High',
      });
      const rawAtts = task.attachments ?? task.attachment;
      const attsArr = Array.isArray(rawAtts) ? rawAtts : rawAtts ? [rawAtts] : [];
      setExistingAttachments(attsArr.map((a: any) => typeof a === 'string' ? { fileName: 'Dokumen', fileUrl: a } : { fileName: a.fileName || 'Dokumen', fileUrl: a.fileUrl || a.url || '' }));
    } else {
      setEditingTaskId(null);
      setTaskForm({
        title: '',
        course: schedules[0]?.course || contacts[0]?.course || '',
        type: 'Individu',
        deadlineDate: new Date().toISOString().split('T')[0],
        deadlineTime: '23:59',
        description: '',
        assigner: '',
        priority: 'High',
      });
      setExistingAttachments([]);
    }
    setSelectedTaskFiles([]);
    setUploadProgressTask(0);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.course || !taskForm.deadlineDate) return;

    setIsUploadingTask(true);
    setUploadProgressTask(0);
    const finalAttachments: AttachmentData[] = [...existingAttachments];

    try {
      for (let i = 0; i < selectedTaskFiles.length; i++) {
        setUploadingFileIndexTask(i + 1);
        const url = await uploadFileToGAS(selectedTaskFiles[i], 'myMbud Task Attachments', setUploadProgressTask);
        finalAttachments.push({ fileName: selectedTaskFiles[i].name, fileUrl: url });
      }

      const fullIsoDeadline = new Date(`${taskForm.deadlineDate}T${taskForm.deadlineTime}:00`).toISOString();
      const payload: Omit<Task, 'id'> = {
        title: taskForm.title.trim(),
        course: taskForm.course.trim(),
        description: taskForm.description.trim(),
        type: taskForm.type,
        assigner: taskForm.assigner.trim() || 'Dosen Pengampu',
        deadline: fullIsoDeadline,
        status: 'todo',
        priority: taskForm.priority,
        classroomUrl: DEFAULT_CLASSROOM_URL,
        attachment: finalAttachments[0],
        attachments: finalAttachments,
      };

      if (editingTaskId) {
        await onUpdateTask(editingTaskId, payload);
      } else {
        await onAddTask(payload);
      }
      setIsTaskModalOpen(false);
    } catch (err) {
      alert('Gagal menyimpan tugas.');
    } finally {
      setIsUploadingTask(false);
    }
  };

  // HANDLER MODAL JADWAL / KONTAK
  const handleOpenScheduleModal = (sched?: ScheduleItem) => {
    const matchedContact = sched ? contacts.find((c) => c.course === sched.course) : null;
    if (sched || matchedContact) {
      const c = matchedContact || (sched as any);
      setEditingScheduleId(c.id || sched?.id || null);
      setScheduleForm({
        code: c.code || sched?.code || '',
        course: c.course || sched?.course || '',
        lecturerName: c.lecturerName || c.lecturer || sched?.lecturer || '',
        lecturerPhone: c.lecturerPhone || '',
        lecturerName2: c.lecturerName2 || c.lecturer2 || sched?.lecturer2 || '',
        lecturerPhone2: c.lecturerPhone2 || '',
        pjName: c.pjName || sched?.pjMatkul || '',
        pjPhone: c.pjPhone || '',
        room: c.room || sched?.room || '',
        scheduleDayTime: c.scheduleDayTime || (sched ? `${sched.day}, ${sched.time}` : ''),
        sks: c.sks || sched?.sks || 3,
        attendanceUrl: c.attendanceUrl || sched?.attendanceUrl || '',
        targetNrps: Array.isArray(c.target_nrps || c.targetNrps) 
          ? (c.target_nrps || c.targetNrps).join('\n') 
          : typeof (c.target_nrps || c.targetNrps) === 'string' 
          ? (c.target_nrps || c.targetNrps).replace(/[{}"']/g, '').split(',').map((s: string) => s.trim()).join('\n')
          : '',
      });
    } else {
      setEditingScheduleId(null);
      setScheduleForm({
        code: '',
        course: '',
        lecturerName: '',
        lecturerPhone: '',
        lecturerName2: '',
        lecturerPhone2: '',
        pjName: '',
        pjPhone: '',
        room: '',
        scheduleDayTime: 'Senin, 08:00 - 10:30 WIB',
        sks: 3,
        attendanceUrl: '',
        targetNrps: '',
      });
    }
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.course.trim() || !scheduleForm.lecturerName.trim()) return;

    const parsedNrps = scheduleForm.targetNrps
      .split(/[\n,]+/)
      .map((line) => {
        const match = line.match(/\d{7,14}/);
        return match ? match[0].trim() : '';
      })
      .filter((nrp) => nrp.length > 0);

    const payload: any = {
      code: scheduleForm.code.trim(),
      course: scheduleForm.course.trim(),
      lecturerName: scheduleForm.lecturerName.trim(),
      lecturerPhone: scheduleForm.lecturerPhone.trim(),
      lecturerName2: scheduleForm.lecturerName2.trim(),
      lecturerPhone2: scheduleForm.lecturerPhone2.trim(),
      pjName: scheduleForm.pjName.trim(),
      pjPhone: scheduleForm.pjPhone.trim(),
      room: scheduleForm.room.trim(),
      scheduleDayTime: scheduleForm.scheduleDayTime.trim(),
      sks: Number(scheduleForm.sks) || 0,
      attendanceUrl: scheduleForm.attendanceUrl.trim(),
      target_nrps: parsedNrps.length > 0 ? parsedNrps : null,
      targetNrps: parsedNrps.length > 0 ? parsedNrps : null,
    };

    if (editingScheduleId) {
      await onUpdateContact(editingScheduleId, payload);
    } else {
      await onAddContact(payload);
    }
    setIsScheduleModalOpen(false);
  };

  // HANDLER MODAL MATERI / KNOWLEDGE BASE
  const handleOpenMaterialModal = () => {
    setMaterialForm({
      courseName: schedules[0]?.course || contacts[0]?.course || 'Umum',
      weekNum: '',
      title: '',
    });
    setSelectedMaterialFile(null);
    setUploadProgressMaterial(0);
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.courseName.trim() || !materialForm.title.trim() || !materialForm.weekNum) return;

    setIsUploadingMaterial(true);
    setUploadProgressMaterial(0);

    try {
      let finalFileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      let fileSizeStr = '3.2 MB';

      if (selectedMaterialFile) {
        finalFileUrl = await uploadFileToGAS(selectedMaterialFile, 'myMbud Materials', setUploadProgressMaterial);
        fileSizeStr = `${(selectedMaterialFile.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      await onAddMaterial({
        courseId: materialForm.courseName.slice(0, 6).toUpperCase().replace(/\s+/g, ''),
        courseName: materialForm.courseName,
        session: `WEEK ${materialForm.weekNum}`,
        title: materialForm.title.endsWith('.pdf') ? materialForm.title : `${materialForm.title}.pdf`,
        fileUrl: finalFileUrl,
        fileType: 'pdf',
        fileSize: fileSizeStr,
        uploader: 'Pengurus Kelas',
      });
      setIsMaterialModalOpen(false);
    } catch (err) {
      alert('Gagal mengunggah berkas PDF materi.');
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  // HANDLER BROADCAST
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNrp || !notifTitle || !notifMessage || isSendingNotif) return;

    setIsSendingNotif(true);
    try {
      await sendOfficerNotification({
        targetNrp: targetNrp.trim(),
        title: notifTitle.trim(),
        message: notifMessage.trim(),
      });
      alert('Pengumuman Broadcast Berhasil Dikirim!');
      setNotifTitle('');
      setNotifMessage('');
    } catch {
      alert('Gagal mengirim broadcast pengumuman.');
    } finally {
      setIsSendingNotif(false);
    }
  };

  // LOCK SCREEN PIN
  if (!isOfficer) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-2xl text-center space-y-5"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/40 flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-zinc-100">Pusat Kendali PJ</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Masukkan PIN Penanggung Jawab untuk mengelola data portal.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-3">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan 6 digit PIN..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-center font-mono text-lg text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-rose-500 font-semibold">{pinError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              Masuk Control Center
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-24 w-full"
    >
      {/* BANNER HEADER */}
      <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Pusat Kendali PJ</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
                Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Pusat terpadu untuk mengelola tugas, jadwal, materi, dan pengumuman.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsOfficer(false);
            onNavigateTab('dashboard');
          }}
          className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-rose-500 border border-slate-200 dark:border-zinc-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sesi</span>
        </button>
      </div>

      {/* TAB SWITCHER */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tugas ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'schedules'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadwal ({schedules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'materials'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Materi ({materials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Broadcast</span>
        </button>
      </div>

      {/* TAB 1: KELOLA TUGAS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              Daftar Tugas Keseluruhan ({tasks.length})
            </h3>
            <button 
              onClick={() => handleOpenTaskModal()}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tugas Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0 space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                    {task.course}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{task.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                    Deadline: {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => handleOpenTaskModal(task)}
                    className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                    title="Edit Tugas"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDeleteTarget({ type: 'task', id: task.id, title: task.title })}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Hapus Tugas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA JADWAL */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              Daftar Mata Kuliah & Jadwal ({schedules.length})
            </h3>
            <button 
              onClick={() => handleOpenScheduleModal()}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Matkul / Jadwal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {schedules.map((schedule) => {
              const matchedContact = contacts.find((c) => c.course === schedule.course);
              const targetId = matchedContact?.id || schedule.id;

              return (
                <div 
                  key={schedule.id}
                  className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/40">
                        {schedule.day}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                        {schedule.time}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{schedule.course}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                      Ruang: {schedule.room} • PJ: {schedule.pjMatkul || '-'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => handleOpenScheduleModal(schedule)}
                      className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                      title="Edit Matkul"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {onDeleteContact && (
                      <button 
                        onClick={() => setDeleteTarget({ type: 'schedule', id: targetId, title: schedule.course })}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Hapus Matkul"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: KELOLA MATERI / KNOWLEDGE BASE */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              Daftar Materi Perkuliahan ({materials.length})
            </h3>
            <button 
              onClick={() => handleOpenMaterialModal()}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah Materi Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {materials.map((mat) => (
              <div 
                key={mat.id}
                className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/40">
                      {mat.session || 'MODUL'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      {mat.courseName}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{mat.title}</h4>
                  <a href={mat.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 truncate">
                    <Link2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{mat.fileUrl}</span>
                  </a>
                </div>

                <button 
                  onClick={() => setDeleteTarget({ type: 'material', id: mat.id, title: mat.title })}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
                  title="Hapus Berkas Materi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BROADCAST PENGUMUMAN DIRECT */}
      {activeTab === 'announcements' && (
        <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-xl space-y-4 max-w-xl mx-auto">
          <div className="flex items-center gap-3 border-b border-slate-200/40 dark:border-zinc-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Kirim Broadcast Push Notification</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Pesan akan terkirim langsung ke HP / Browser teman-teman.</p>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Target Receiver:</label>
                <button
                  type="button"
                  onClick={() => setTargetNrp('ALL')}
                  className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-500 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-3 h-3" />
                  <span>Semua Teman (ALL)</span>
                </button>
              </div>
              <input
                type="text"
                value={targetNrp}
                onChange={(e) => setTargetNrp(e.target.value)}
                placeholder="NRP Spesifik atau ketik ALL"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Judul Pengumuman:</label>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Contoh: Perubahan Jam Kuliah Statistik"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Isi Pesan:</label>
              <textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="Tuliskan isi pengumuman lengkap..."
                rows={3}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingNotif}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingNotif ? 'Mengirim Broadcast...' : 'Kirim Pengumuman Sekarang'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CONFIRMATION DELETE (POPUP ALA IOS) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deleteTarget && (
          <div 
            className="fixed inset-0 z-[999999] bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center p-6 select-none"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="w-full max-w-[290px] sm:max-w-[320px] rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-900 dark:text-zinc-100 shadow-2xl overflow-hidden flex flex-col text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                  Konfirmasi Hapus
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Apakah kamu yakin ingin menghapus {deleteTarget.type === 'task' ? 'tugas' : deleteTarget.type === 'schedule' ? 'mata kuliah' : 'materi'}{' '}
                  <span className="font-bold text-slate-800 dark:text-zinc-200">"{deleteTarget.title}"</span>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="grid grid-cols-2 border-t border-slate-200/60 dark:border-zinc-800 divide-x divide-slate-200/60 dark:divide-zinc-800">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="py-3.5 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="py-3.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 1: FORM EDIT / TAMBAH TUGAS */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isTaskModalOpen && (
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
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 custom-scrollbar">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Judul Tugas</label>
                    <input
                      type="text"
                      required
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      placeholder="Misal: Paper Analisis Kebijakan / Tugas Resume"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Mata Kuliah</label>
                      <select
                        required
                        value={taskForm.course}
                        onChange={(e) => setTaskForm({ ...taskForm, course: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from(new Set([...schedules.map((s) => s.course), ...contacts.map((c) => c.course)])).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Jenis Tugas</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Individu', 'Kelompok'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTaskForm({ ...taskForm, type: t })}
                            className={`py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                              taskForm.type === t
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Tanggal Deadline</label>
                      <input
                        type="date"
                        required
                        value={taskForm.deadlineDate}
                        onChange={(e) => setTaskForm({ ...taskForm, deadlineDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Jam Deadline (WIB)</label>
                      <input
                        type="time"
                        required
                        value={taskForm.deadlineTime}
                        onChange={(e) => setTaskForm({ ...taskForm, deadlineTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Instruksi & Keterangan</label>
                    <textarea
                      rows={4}
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      placeholder="Tuliskan format pengerjaan, panduan, dsb..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Lampiran Soal / Panduan (Opsional)
                      </label>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                        {existingAttachments.length + selectedTaskFiles.length}/{MAX_ATTACHMENTS} file
                      </span>
                    </div>

                    {(existingAttachments.length > 0 || selectedTaskFiles.length > 0) && (
                      <div className="space-y-1.5 mb-2">
                        {existingAttachments.map((att, idx) => (
                          <div key={`exist-${idx}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="text-[11px] text-slate-700 dark:text-zinc-300 truncate">{att.fileName}</span>
                            </div>
                            <button type="button" onClick={() => setExistingAttachments((prev) => prev.filter((_, i) => i !== idx))} className="p-1 rounded-lg text-slate-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                        {selectedTaskFiles.map((file, idx) => (
                          <div key={`sel-${idx}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="text-[11px] text-slate-700 dark:text-zinc-300 truncate">{file.name}</span>
                            </div>
                            <button type="button" onClick={() => setSelectedTaskFiles((prev) => prev.filter((_, i) => i !== idx))} className="p-1 rounded-lg text-slate-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    {existingAttachments.length + selectedTaskFiles.length < MAX_ATTACHMENTS && (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsTaskDragOver(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsTaskDragOver(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsTaskDragOver(false);
                          if (e.dataTransfer.files?.length) {
                            const newFiles = Array.from(e.dataTransfer.files).slice(0, MAX_ATTACHMENTS - existingAttachments.length - selectedTaskFiles.length);
                            setSelectedTaskFiles((prev) => [...prev, ...newFiles]);
                          }
                        }}
                        onClick={() => taskFileInputRef.current?.click()}
                        className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                          isTaskDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/40'
                        }`}
                      >
                        <input type="file" ref={taskFileInputRef} multiple className="hidden" onChange={(e) => {
                          if (e.target.files?.length) {
                            const newFiles = Array.from(e.target.files).slice(0, MAX_ATTACHMENTS - existingAttachments.length - selectedTaskFiles.length);
                            setSelectedTaskFiles((prev) => [...prev, ...newFiles]);
                          }
                        }} />
                        <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Pilih atau Tarik File ke Sini</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Bisa lebih dari 1 file, maks {MAX_ATTACHMENTS} file · @10 MB</p>
                      </div>
                    )}

                    {isUploadingTask && (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-blue-600">
                          <span>Mengunggah file {uploadingFileIndexTask} dari {selectedTaskFiles.length}...</span>
                          <span>{uploadProgressTask}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgressTask}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-4 border-t border-slate-200/40 dark:border-white/10 flex items-center justify-end gap-3 shrink-0 bg-white/50 dark:bg-zinc-900/50">
                  <button type="button" disabled={isUploadingTask} onClick={() => setIsTaskModalOpen(false)} className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold">Batal</button>
                  <button type="submit" disabled={isUploadingTask} className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold shadow-md flex items-center gap-2">
                    {isUploadingTask ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Menyimpan...</span></> : editingTaskId ? 'Simpan Perubahan' : 'Terbitkan Tugas'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: FORM EDIT / TAMBAH JADWAL MATKUL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-slate-200/40 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-900/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  {editingScheduleId ? 'Edit Data Kontak Matkul' : 'Tambah Kontak Matkul Baru'}
                </h3>
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveSchedule} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Kode Matkul</label>
                      <input type="text" value={scheduleForm.code} onChange={(e) => setScheduleForm({ ...scheduleForm, code: e.target.value })} placeholder="DS234316" className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Nama Mata Kuliah</label>
                      <input type="text" required value={scheduleForm.course} onChange={(e) => setScheduleForm({ ...scheduleForm, course: e.target.value })} placeholder="Manusia dan Ruang Hidup" className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Nama Dosen 1</label>
                      <input type="text" required value={scheduleForm.lecturerName} onChange={(e) => setScheduleForm({ ...scheduleForm, lecturerName: e.target.value })} placeholder="Prof. Dr. Hendra, M.T." className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">WhatsApp Dosen 1</label>
                      <input type="text" required value={scheduleForm.lecturerPhone} onChange={(e) => setScheduleForm({ ...scheduleForm, lecturerPhone: e.target.value })} placeholder="081234567890" className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Nama Dosen 2 (Opsional)</label>
                      <input type="text" value={scheduleForm.lecturerName2} onChange={(e) => setScheduleForm({ ...scheduleForm, lecturerName2: e.target.value })} placeholder="Dr. Suprapto, M.Si." className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">WhatsApp Dosen 2 (Opsional)</label>
                      <input type="text" value={scheduleForm.lecturerPhone2} onChange={(e) => setScheduleForm({ ...scheduleForm, lecturerPhone2: e.target.value })} placeholder="081298765432" className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Nama PJ Matkul</label>
                      <input type="text" required value={scheduleForm.pjName} onChange={(e) => setScheduleForm({ ...scheduleForm, pjName: e.target.value })} placeholder="Dimas Ardiansyah" className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">WhatsApp PJ Matkul</label>
                      <input type="text" required value={scheduleForm.pjPhone} onChange={(e) => setScheduleForm({ ...scheduleForm, pjPhone: e.target.value })} placeholder="085712345678" className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Ruang Perkuliahan</label>
                      <input type="text" value={scheduleForm.room} onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })} placeholder="R. 301 Gedung Utama" className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Jadwal Hari/Jam</label>
                      <input type="text" value={scheduleForm.scheduleDayTime} onChange={(e) => setScheduleForm({ ...scheduleForm, scheduleDayTime: e.target.value })} placeholder="Senin, 08:00 - 10:30 WIB" className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">SKS</label>
                      <input type="number" min="1" max="6" value={scheduleForm.sks} onChange={(e) => setScheduleForm({ ...scheduleForm, sks: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="3" className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Link Presensi Khusus (Opsional)</label>
                      <input type="url" value={scheduleForm.attendanceUrl} onChange={(e) => setScheduleForm({ ...scheduleForm, attendanceUrl: e.target.value })} placeholder="https://mia.its.ac.id/presensi/" className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-white/5 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200">Target NRP Khusus (Opsional)</label>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Kosongkan jika matkul ini untuk seluruh kelas. Tulis <strong>1 NRP per baris (tekan Enter)</strong> jika hanya untuk mahasiswa tertentu. Nama setelah NRP akan diabaikan secara otomatis.
                    </p>
                    <textarea rows={4} value={scheduleForm.targetNrps} onChange={(e) => setScheduleForm({ ...scheduleForm, targetNrps: e.target.value })} placeholder={`5026211001\n5026211002 NARA\n5026211003`} className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-4 border-t border-slate-200/40 dark:border-white/10 flex items-center justify-end gap-3 shrink-0 bg-white/50 dark:bg-zinc-900/50">
                  <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold">Batal</button>
                  <button type="submit" className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20">Simpan Kontak</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: FORM TAMBAH MATERI / KNOWLEDGE BASE */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMaterialModalOpen && (
          <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-slate-200/40 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-900/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Unggah Materi / Slide PDF</h3>
                <button type="button" onClick={() => setIsMaterialModalOpen(false)} className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveMaterial} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 custom-scrollbar">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Mata Kuliah</label>
                    <select value={materialForm.courseName} onChange={(e) => setMaterialForm({ ...materialForm, courseName: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {Array.from(new Set([...schedules.map((s) => s.course), ...contacts.map((c) => c.course)])).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Pertemuan ke-</label>
                    <input type="number" required min={1} value={materialForm.weekNum} onChange={(e) => setMaterialForm({ ...materialForm, weekNum: e.target.value })} placeholder="Masukkan angka (misal: 8)" className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Judul / Nama File Materi</label>
                    <input type="text" required value={materialForm.title} onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })} placeholder="Pengantar Teori Pembangunan.pdf" className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Berkas File PDF</label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsMaterialDragOver(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsMaterialDragOver(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsMaterialDragOver(false);
                        if (e.dataTransfer.files?.length) setSelectedMaterialFile(e.dataTransfer.files[0]);
                      }}
                      onClick={() => materialFileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isMaterialDragOver ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20' : 'border-slate-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/40'
                      }`}
                    >
                      <input type="file" ref={materialFileInputRef} accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.length) setSelectedMaterialFile(e.target.files[0]); }} />
                      {selectedMaterialFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 max-w-[200px] truncate">{selectedMaterialFile.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400">{(selectedMaterialFile.size / 1024 / 1024).toFixed(2)} MB • Siap diunggah</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <UploadCloud className="w-6 h-6 text-slate-600 dark:text-zinc-400" />
                          <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Klik atau seret file PDF di sini</p>
                          <p className="text-[10px] text-slate-400">Format PDF ONLY dan maks 10 MB</p>
                        </div>
                      )}
                    </div>

                    {isUploadingMaterial && (
                      <div className="mt-3 space-y-1.5 p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                          <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Mengunggah ke Storage...</span>
                          <span className="font-mono text-xs tabular-nums font-bold">{Math.round(uploadProgressMaterial)}%</span>
                        </div>
                        <div className="bg-blue-100 dark:bg-zinc-800 rounded-full h-2 w-full overflow-hidden">
                          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgressMaterial}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-4 border-t border-slate-200/40 dark:border-white/10 flex items-center justify-end gap-3 shrink-0 bg-white/50 dark:bg-zinc-900/50">
                  <button type="button" disabled={isUploadingMaterial} onClick={() => setIsMaterialModalOpen(false)} className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold">Batal</button>
                  <button type="submit" disabled={isUploadingMaterial} className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold shadow-md flex items-center gap-2">
                    {isUploadingMaterial ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Mengunggah...</span></> : 'Unggah Berkas'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};