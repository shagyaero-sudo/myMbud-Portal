import React, { useState } from 'react';
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
  CheckCircle2,
  BookOpen,
  Link2
} from 'lucide-react';
import { Task, ScheduleItem, Contact, MaterialFile } from '../types';
import { sendOfficerNotification } from '../services/oneSignalNotification';

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
  onAddMaterial: (material: Omit<MaterialFile, 'id' | 'uploadDate'>) => Promise<void> | void;
  onDeleteMaterial: (id: string) => Promise<void> | void;
}

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
  onAddMaterial,
  onDeleteMaterial,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'schedules' | 'materials' | 'announcements'>('tasks');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // --- STATE MODAL TUGAS ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    course: '',
    description: '',
    deadline: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    type: 'Individu' as 'Individu' | 'Kelompok',
  });

  // --- STATE MODAL JADWAL / MATKUL ---
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    course: '',
    code: '',
    day: 'Senin',
    time: '07:00 - 09:30',
    room: '',
    sks: 3,
    lecturer: '',
    lecturerPhone: '',
    pjMatkul: '',
    pjPhone: '',
    attendanceUrl: '',
  });

  // --- STATE MODAL MATERI / KNOWLEDGE BASE ---
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    course: '',
    category: 'PPT/Slide' as 'PPT/Slide' | 'PDF/Ebook' | 'Video' | 'Dokumen' | 'Lainnya',
    url: '',
    uploader: 'PJ Matkul',
  });

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

  // HANDLER TUGAS
  const handleOpenTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        course: task.course,
        description: task.description || '',
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
        priority: task.priority || 'Medium',
        type: task.type || 'Individu',
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: '',
        course: schedules[0]?.course || '',
        description: '',
        deadline: new Date().toISOString().slice(0, 16),
        priority: 'Medium',
        type: 'Individu',
      });
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.course || !taskForm.deadline) return;

    if (editingTask) {
      await onUpdateTask(editingTask.id, {
        ...taskForm,
        deadline: new Date(taskForm.deadline).toISOString(),
      });
    } else {
      await onAddTask({
        ...taskForm,
        deadline: new Date(taskForm.deadline).toISOString(),
        status: 'todo',
        assigner: 'PJ Matkul',
      });
    }
    setIsTaskModalOpen(false);
  };

  // HANDLER JADWAL
  const handleOpenScheduleModal = (sched?: ScheduleItem) => {
    if (sched) {
      setEditingSchedule(sched);
      const matchedContact = contacts.find((c) => c.course === sched.course);
      setScheduleForm({
        course: sched.course,
        code: sched.code || '',
        day: sched.day,
        time: sched.time,
        room: sched.room,
        sks: sched.sks || 3,
        lecturer: sched.lecturer || '',
        lecturerPhone: matchedContact?.lecturerPhone || '',
        pjMatkul: sched.pjMatkul || '',
        pjPhone: matchedContact?.pjPhone || '',
        attendanceUrl: sched.attendanceUrl || '',
      });
    } else {
      setEditingSchedule(null);
      setScheduleForm({
        course: '',
        code: '',
        day: 'Senin',
        time: '07:00 - 09:30',
        room: 'B201',
        sks: 3,
        lecturer: '',
        lecturerPhone: '',
        pjMatkul: '',
        pjPhone: '',
        attendanceUrl: '',
      });
    }
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.course) return;

    const matchedContact = contacts.find((c) => c.course === scheduleForm.course || c.id === editingSchedule?.id);

    if (matchedContact) {
      await onUpdateContact(matchedContact.id, {
        course: scheduleForm.course,
        code: scheduleForm.code,
        room: scheduleForm.room,
        sks: Number(scheduleForm.sks),
        lecturerName: scheduleForm.lecturer,
        lecturerPhone: scheduleForm.lecturerPhone,
        pjName: scheduleForm.pjMatkul,
        pjPhone: scheduleForm.pjPhone,
        scheduleDayTime: `${scheduleForm.day}, ${scheduleForm.time}`,
        attendanceUrl: scheduleForm.attendanceUrl,
      });
    } else {
      await onAddContact({
        course: scheduleForm.course,
        code: scheduleForm.code,
        room: scheduleForm.room,
        sks: Number(scheduleForm.sks),
        lecturerName: scheduleForm.lecturer,
        lecturerPhone: scheduleForm.lecturerPhone,
        pjName: scheduleForm.pjMatkul,
        pjPhone: scheduleForm.pjPhone,
        scheduleDayTime: `${scheduleForm.day}, ${scheduleForm.time}`,
        attendanceUrl: scheduleForm.attendanceUrl,
      });
    }
    setIsScheduleModalOpen(false);
  };

  // HANDLER MATERI / KNOWLEDGE BASE
  const handleOpenMaterialModal = () => {
    setMaterialForm({
      title: '',
      course: schedules[0]?.course || '',
      category: 'PPT/Slide',
      url: '',
      uploader: 'PJ Matkul',
    });
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.title || !materialForm.course || !materialForm.url) return;

    await onAddMaterial({
      title: materialForm.title,
      course: materialForm.course,
      category: materialForm.category,
      url: materialForm.url,
      uploader: materialForm.uploader,
    });
    setIsMaterialModalOpen(false);
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
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-zinc-100">PJ Control Center</h2>
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">PJ Control Center</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
                Sesi Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Pusat kendali terpadu untuk mengelola tugas, jadwal, materi, dan pengumuman.
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
          <span>Keluar Sesi PJ</span>
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
            {tasks.map((task) => {
              const deadlineTime = new Date(task.deadline).getTime();
              const isExpired = !isNaN(deadlineTime) && (deadlineTime < Date.now() || task.status === 'done');

              return (
                <div 
                  key={task.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs transition-all ${
                    isExpired 
                      ? 'bg-white/40 dark:bg-zinc-900/40 border-slate-200/40 dark:border-white/5 opacity-75' 
                      : 'bg-white/70 dark:bg-zinc-800/50 border-slate-200/60 dark:border-white/10'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                      {task.course}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{task.title}</h4>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                        Deadline: {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                      </p>
                      
                      {/* BADGE PERIODE BERAKHIR */}
                      {isExpired && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-500/10 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                          (Periode Berakhir)
                        </span>
                      )}
                    </div>
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
                      onClick={() => {
                        if (confirm(`Hapus tugas "${task.title}"?`)) onDeleteTask(task.id);
                      }}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
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
            {schedules.map((schedule) => (
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

                <button 
                  onClick={() => handleOpenScheduleModal(schedule)}
                  className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer shrink-0"
                  title="Edit Matkul"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
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
                      {mat.category || 'Berkas'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      {mat.course}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{mat.title}</h4>
                  <a href={mat.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 truncate">
                    <Link2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{mat.url}</span>
                  </a>
                </div>

                <button 
                  onClick={() => onDeleteMaterial(mat.id)}
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

      {/* MODAL FORM EDIT / TAMBAH TUGAS */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTaskModalOpen(false)} className="fixed inset-0 bg-slate-950/75 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{editingTask ? 'Edit Tugas' : 'Tambah Tugas Baru'}</h3>
                <button onClick={() => setIsTaskModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-3">
                <input type="text" placeholder="Judul Tugas..." value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100" />
                <select value={taskForm.course} onChange={(e) => setTaskForm({ ...taskForm, course: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100">
                  {schedules.map((s) => (<option key={s.id} value={s.course}>{s.course}</option>))}
                </select>
                <input type="datetime-local" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} required className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100" />
                <textarea placeholder="Deskripsi tugas..." value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 resize-none" />
                <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Simpan Tugas</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL FORM EDIT / TAMBAH JADWAL MATKUL */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsScheduleModalOpen(false)} className="fixed inset-0 bg-slate-950/75 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{editingSchedule ? 'Edit Matkul & Jadwal' : 'Tambah Matkul Baru'}</h3>
                <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveSchedule} className="space-y-3">
                <input type="text" placeholder="Nama Mata Kuliah..." value={scheduleForm.course} onChange={(e) => setScheduleForm({ ...scheduleForm, course: e.target.value })} required className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={scheduleForm.day} onChange={(e) => setScheduleForm({ ...scheduleForm, day: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                  <input type="text" placeholder="Jam (cth: 07:00 - 09:30)" value={scheduleForm.time} onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Ruang Kelas..." value={scheduleForm.room} onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100" />
                  <input type="number" placeholder="SKS" value={scheduleForm.sks} onChange={(e) => setScheduleForm({ ...scheduleForm, sks: Number(e.target.value) })} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100" />
                </div>
                <input type="text" placeholder="Nama Dosen..." value={scheduleForm.lecturer} onChange={(e) => setScheduleForm({ ...scheduleForm, lecturer: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100" />
                <input type="text" placeholder="Nama PJ Matkul..." value={scheduleForm.pjMatkul} onChange={(e) => setScheduleForm({ ...scheduleForm, pjMatkul: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100" />
                <input type="url" placeholder="URL Presensi Matkul..." value={scheduleForm.attendanceUrl} onChange={(e) => setScheduleForm({ ...scheduleForm, attendanceUrl: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100" />
                <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Simpan Matkul</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL FORM TAMBAH MATERI / KNOWLEDGE BASE */}
      <AnimatePresence>
        {isMaterialModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMaterialModalOpen(false)} className="fixed inset-0 bg-slate-950/75 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Unggah Materi Perkuliahan</h3>
                <button onClick={() => setIsMaterialModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveMaterial} className="space-y-3">
                <input type="text" placeholder="Judul Berkas / Modul..." value={materialForm.title} onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })} required className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100" />
                <select value={materialForm.course} onChange={(e) => setMaterialForm({ ...materialForm, course: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100">
                  {schedules.map((s) => (<option key={s.id} value={s.course}>{s.course}</option>))}
                </select>
                <select value={materialForm.category} onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100">
                  {['PPT/Slide', 'PDF/Ebook', 'Video', 'Dokumen', 'Lainnya'].map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
                <input type="url" placeholder="Tautan Drive / Cloud PDF/PPT..." value={materialForm.url} onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })} required className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100" />
                <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Simpan Materi</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};