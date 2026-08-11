/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';

import { db } from './services/firebase';
import { subscribeAnnouncements } from './services/announcements';

import {
  initOneSignal,
  loginOneSignal,
  logoutOneSignal,
} from './services/oneSignal';

import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ContactsView } from './components/ContactsView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { TaskTrackerView } from './components/TaskTrackerView';
import { SpinwheelView } from './components/SpinwheelView';
import { GradeCalculatorView } from './components/GradeCalculatorView';
import { LetterGeneratorView } from './components/LetterGeneratorView';
import { PdfViewerModal } from './components/PdfViewerModal';
import { SoftForceModal } from './components/SoftForceModal';
import { BlockBlastView } from './components/blockblast/BlockBlastView';
import { MbudiaryView } from './components/MbudiaryView';
import { GpaCalculatorModal } from './components/GpaCalculatorModal';
import { LoginScreen } from './components/LoginScreen';

import {
  AppState,
  MaterialFile,
  Task,
  Contact,
  GroupResult,
} from './types';

import { initialAppState } from './data/mockData';

import {
  fetchAppState,
  addContactApi,
  updateContactApi,
  deleteContactApi,
  addTaskApi,
  updateTaskApi,
  deleteTaskApi,
  saveGroupResultApi,
  subscribeUserTaskCompletions,
} from './services/api';

const IS_MAINTENANCE = false;

const AppSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-40 bg-slate-200/60 dark:bg-zinc-800/60 rounded-3xl w-full border border-slate-200 dark:border-zinc-800"></div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-64 bg-slate-200/60 dark:bg-zinc-800/60 rounded-3xl w-full border border-slate-200 dark:border-zinc-800"></div>
        <div className="h-48 bg-slate-200/60 dark:bg-zinc-800/60 rounded-3xl w-full border border-slate-200 dark:border-zinc-800"></div>
      </div>

      <div className="h-96 bg-slate-200/60 dark:bg-zinc-800/60 rounded-3xl w-full border border-slate-200 dark:border-zinc-800"></div>
    </div>
  </div>
);

export default function App() {
  if (IS_MAINTENANCE) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-md flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center text-3xl mb-2 border border-blue-500/20">
            🛠️
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Mohon Maaf...
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            myMbud Portal sedang dalam perbaikan dan pemeliharaan. Web sementara tidak dapat diakses, mohon kembali lagi nanti ya!
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping mr-2"></span>
              UNDER MAINTENANCE
            </span>
          </div>
        </div>
      </div>
    );
  }

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('mymbud_auth') === 'true';
  });

  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const currentUserNrp = localStorage.getItem('mymbud_user_nrp') || 'unknown';

  // --- CHECK INDIVIDUAL SESSION TERMINATION (KILL-SWITCH) ---
  useEffect(() => {
    const checkSessionStatus = async () => {
      const userNrp = localStorage.getItem('mymbud_user_nrp');

      if (userNrp && isAuthenticated) {
        try {
          const revokedRef = doc(db, 'revoked_sessions', userNrp);
          const revokedDoc = await getDoc(revokedRef);

          if (revokedDoc.exists()) {
            localStorage.removeItem('mymbud_auth');
            localStorage.removeItem('mymbud_user_name');
            localStorage.removeItem('mymbud_user_nrp');

            setIsAuthenticated(false);
            alert('Sesi kamu telah diakhiri oleh sistem. Silakan login kembali.');
          }
        } catch (err) {
          console.error('Gagal memeriksa status sesi:', err);
        }
      }
    };

    checkSessionStatus();
  }, [isAuthenticated]);

  useEffect(() => {
    const unsub = subscribeUserTaskCompletions(currentUserNrp, (ids) => {
      setCompletedTaskIds(ids);
    });
    return () => unsub();
  }, [currentUserNrp]);

  useEffect(() => {
    const setupOneSignal = async () => {
      await initOneSignal();

      if (isAuthenticated) {
        const nrp = localStorage.getItem('mymbud_user_nrp');

        if (nrp) {
          console.log('[OneSignal] Linking user NRP:', nrp);
          await loginOneSignal(nrp);
        } else {
          console.warn('[OneSignal] NRP user tidak ditemukan di localStorage.');
        }
      }
    };

    setupOneSignal();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleOneSignalRedirect = (e: any) => {
      const targetTab = e?.detail?.tab || localStorage.getItem('mbud_target_tab') || 'mbudiary';
      
      console.log('[App Router] Redirecting to tab:', targetTab);
      setActiveTab(targetTab as TabType);

      window.dispatchEvent(new Event('mbud_notification_navigate'));
    };

    window.addEventListener('mbud_onesignal_redirect', handleOneSignalRedirect);
    window.addEventListener('mbud_notification_navigate', () => {
      const targetTab = localStorage.getItem('mbud_target_tab');
      if (targetTab) {
        setActiveTab(targetTab as TabType);
        localStorage.removeItem('mbud_target_tab');
      }
    });

    return () => {
      window.removeEventListener('mbud_onesignal_redirect', handleOneSignalRedirect);
    };
  }, []);

  const handleLogout = async () => {
    await logoutOneSignal();

    localStorage.removeItem('mymbud_auth');
    localStorage.removeItem('mymbud_user_name');
    localStorage.removeItem('mymbud_user_nrp');

    setIsAuthenticated(false);
  };

  // --- LOGIKA DETEKSI PERANGKAT & GATEKEEPING PWA ---
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  
  const isMobileOrTabletOS = isAndroid || isIOS || isIPadOS;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as any).standalone === true);

  const requiresLogin =
    !isAuthenticated && (!isMobileOrTabletOS || isStandalone);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedContactCourse, setSelectedContactCourse] = useState<string>('ALL');

  const [isOfficer, setIsOfficer] = useState<boolean>(false);
  const [isGpaModalOpen, setIsGpaModalOpen] = useState<boolean>(false);

  const handleNavigateTab = useCallback(
    (tab: TabType, courseFilter?: string) => {
      if (tab === 'contacts' && courseFilter) {
        setSelectedContactCourse(courseFilter);
      }
      setActiveTab(tab);
    },
    []
  );

  const [appState, setAppState] = useState<AppState>(() => ({
    ...initialAppState,
    tasks: [],
    announcements: [],
    materials: [],
  }));

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [previewMaterial, setPreviewMaterial] = useState<MaterialFile | null>(null);

  const [theme, setTheme] = useState<
    'light' | 'dark' | 'pink' | 'purple' | 'green'
  >(() => {
    const root = document.documentElement;

    if (root.classList.contains('green')) return 'green';
    if (root.classList.contains('purple')) return 'purple';
    if (root.classList.contains('pink')) return 'pink';
    if (root.classList.contains('dark')) return 'dark';

    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove('dark', 'pink', 'purple', 'green');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'pink') {
      root.classList.add('pink');
    } else if (theme === 'purple') {
      root.classList.add('purple');
    } else if (theme === 'green') {
      root.classList.add('green');
    }

    localStorage.setItem('theme', theme);

    const metaThemeColor = document.querySelector("meta[name='theme-color']");

    if (metaThemeColor) {
      if (theme === 'dark') {
        metaThemeColor.setAttribute('content', '#09090b');
      } else if (theme === 'pink') {
        metaThemeColor.setAttribute('content', '#fff0f3');
      } else if (theme === 'purple') {
        metaThemeColor.setAttribute('content', '#f8f0fe');
      } else if (theme === 'green') {
        metaThemeColor.setAttribute('content', '#f7fcf5');
      } else {
        metaThemeColor.setAttribute('content', '#f8fafc');
      }
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = subscribeAnnouncements((announcementsData) => {
      setAppState((prev) => ({
        ...prev,
        announcements: announcementsData,
      }));
    });

    return () => unsubscribe();
  }, []);

  const syncState = useCallback(async () => {
    setIsSyncing(true);

    try {
      const data = await fetchAppState();

      const querySnapshotCourses = await getDocs(collection(db, 'courses'));

      const firebaseSchedules: AppState['schedules'] = [];
      const firebaseContacts: AppState['contacts'] = [];

      querySnapshotCourses.forEach((courseDoc) => {
        const d = courseDoc.data();

        const scheduleDay =
          d.scheduleDay ||
          (d.scheduleDayTime
            ? String(d.scheduleDayTime).split(',')[0]?.trim()
            : 'Senin');

        const scheduleTime =
          d.scheduleTime ||
          (d.scheduleDayTime
            ? String(d.scheduleDayTime).split(',').slice(1).join(',').trim()
            : '');

        const courseName = d.name || d.course || '';

        firebaseSchedules.push({
          id: courseDoc.id,
          day: scheduleDay,
          course: courseName,
          code: d.code || '',
          time: scheduleTime,
          room: d.room || '',
          lecturer: d.lecturerName || '',
          pjMatkul: d.pjName ? String(d.pjName).trim() : '',
          sks: Number(d.sks) || 0,
        });

        firebaseContacts.push({
          id: courseDoc.id,
          code: d.code || '',
          course: courseName,
          sks: Number(d.sks) || 0,
          lecturerName: d.lecturerName || '',
          lecturerPhone: d.lecturerPhone || '',
          pjName: d.pjName || '',
          pjPhone: d.pjPhone || '',
          room: d.room || '',
          scheduleDayTime:
            d.scheduleDayTime || scheduleDay + ', ' + scheduleTime,
        });
      });

      const querySnapshotTasks = await getDocs(collection(db, 'tasks'));
      const firebaseTasks: Task[] = [];

      querySnapshotTasks.forEach((taskDoc) => {
        const d = taskDoc.data();

        firebaseTasks.push({
          id: taskDoc.id,
          title: d.title || '',
          course: d.course || '',
          description: d.description || '',
          type: d.type === 'Kelompok' ? 'Kelompok' : 'Individu',
          assigner: d.assigner || '',
          deadline: d.deadline || '',
          status:
            d.status === 'done'
              ? 'done'
              : d.status === 'in_progress'
              ? 'in_progress'
              : 'todo',
          priority:
            d.priority === 'Low'
              ? 'Low'
              : d.priority === 'Medium'
              ? 'Medium'
              : 'High',
          classroomUrl: d.classroomUrl || undefined,
          attachment: d.attachment
            ? {
                fileName: d.attachment.fileName || '',
                fileUrl: d.attachment.fileUrl || '',
              }
            : undefined,
        });
      });

      const querySnapshotMaterials = await getDocs(collection(db, 'materials'));
      const firebaseMaterials: MaterialFile[] = [];

      querySnapshotMaterials.forEach((matDoc) => {
        const d = matDoc.data();

        firebaseMaterials.push({
          id: matDoc.id,
          courseId: d.courseId || '',
          courseName: d.courseName || '',
          session: d.session || '',
          title: d.title || '',
          fileUrl: d.fileUrl || '',
          fileType: 'pdf',
          fileSize: d.fileSize || '3.0 MB',
          uploadDate: d.uploadDate || new Date().toISOString(),
          uploader: d.uploader || 'Pengurus Kelas A',
          description: d.description || '',
        });
      });

      setAppState((previousState) => {
        const baseData = data || previousState;

        return {
          ...baseData,
          schedules: firebaseSchedules,
          contacts:
            firebaseContacts.length > 0
              ? firebaseContacts
              : baseData.contacts,
          tasks: firebaseTasks,
          materials: firebaseMaterials,
          lastUpdated: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Gagal melakukan sinkronisasi:', error);
      setAppState((previousState) => previousState);
    } finally {
      setIsSyncing(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    syncState();

    const interval = window.setInterval(() => {
      syncState();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [syncState]);

  // HITUNG SELURUH TUGAS AKTIF MENDATANG (BELUM DONE & DEADLINE BELUM LEWAT)
  const activeTaskCount = appState.tasks.filter((task) => {
    const isExplicitlyDone = completedTaskIds.includes(task.id);
    if (task.status === 'done' || isExplicitlyDone) return false;

    const deadlineTime = new Date(task.deadline).getTime();
    if (Number.isNaN(deadlineTime)) return false;

    return deadlineTime > Date.now();
  }).length;

  const urgentTaskCount = appState.tasks.filter((task) => {
    if (task.status === 'done') return false;

    const deadlineTime = new Date(task.deadline).getTime();
    if (Number.isNaN(deadlineTime)) return false;

    const diffHours = (deadlineTime - Date.now()) / (1000 * 3600);
    return diffHours >= 0 && diffHours < 48;
  }).length;

  const handleAddContact = async (contact: Omit<Contact, 'id'>) => {
    try {
      await addContactApi(contact);
      await syncState();
    } catch (error) {
      console.error('Gagal menambahkan mata kuliah:', error);
      alert('Gagal menyimpan data mata kuliah.');
    }
  };

  const handleUpdateContact = async (id: string, contact: Partial<Contact>) => {
    try {
      await updateContactApi(id, contact);
      await syncState();
    } catch (error) {
      console.error('Gagal mengubah mata kuliah:', error);
      alert('Gagal mengubah data mata kuliah.');
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await deleteContactApi(id);
      await syncState();
    } catch (error) {
      console.error('Gagal menghapus mata kuliah:', error);
      alert('Gagal menghapus data mata kuliah.');
    }
  };

  const handleAddMaterial = async (
    material: Omit<MaterialFile, 'id' | 'uploadDate'>
  ) => {
    try {
      await addDoc(collection(db, 'materials'), {
        ...material,
        uploadDate: new Date().toISOString(),
        createdAt: Timestamp.now(),
      });
      await syncState();
    } catch (error) {
      console.error('Gagal menambahkan materi:', error);
      alert('Gagal menyimpan berkas ke Firebase.');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus berkas materi ini?')) return;

    try {
      await deleteDoc(doc(db, 'materials', id));
      await syncState();
    } catch (error) {
      console.error('Gagal menghapus materi:', error);
      alert('Gagal menghapus berkas.');
    }
  };

  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    try {
      await addTaskApi(task);
      await syncState();
    } catch (error) {
      console.error('[Task] Gagal menambahkan tugas:', error);
      alert('Tugas gagal disimpan.');
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await updateTaskApi(id, updates);
      await syncState();
    } catch (error) {
      console.error('[Task] Gagal mengubah tugas:', error);
      alert('Tugas gagal diperbarui.');
    }
  };

  const handleUpdateTaskStatus = async (
    id: string,
    status: 'todo' | 'in_progress' | 'done'
  ) => {
    try {
      await updateTaskApi(id, { status });
      await syncState();
    } catch (error) {
      console.error('[Task] Gagal mengubah status tugas:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTaskApi(id);
      await syncState();
    } catch (error) {
      console.error('[Task] Gagal menghapus tugas:', error);
      alert('Tugas gagal dihapus.');
    }
  };

  const handleSaveGroupResult = async (
    result: Omit<GroupResult, 'id' | 'createdAt'>
  ) => {
    try {
      const updated = await saveGroupResultApi(result);
      if (updated) {
        setAppState(updated);
      } else {
        await syncState();
      }
    } catch (error) {
      console.error('Gagal menyimpan hasil kelompok:', error);
    }
  };

  if (requiresLogin) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white transition-colors duration-200">
      <Header
        isOfficer={isOfficer}
        setIsOfficer={setIsOfficer}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSyncing={isSyncing}
        lastUpdated={appState.lastUpdated}
        onRefresh={syncState}
        urgentTaskCount={urgentTaskCount}
        theme={theme}
        setTheme={setTheme}
        onLogout={handleLogout}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 flex flex-col lg:flex-row gap-6">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeTaskCount={activeTaskCount}
          onOpenGpaModal={() => setIsGpaModalOpen(true)}
        />

        <main className="flex-1 py-6 lg:pt-2 lg:pb-8 overflow-y-auto space-y-6">
          {isInitialLoad ? (
            <AppSkeleton />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  state={appState}
                  isOfficer={isOfficer}
                  onAddAnnouncement={() => {}}
                  onDeleteAnnouncement={() => {}}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'contacts' && (
                <ContactsView
                  contacts={appState.contacts}
                  isOfficer={isOfficer}
                  initialCourseFilter={selectedContactCourse}
                  onAddContact={handleAddContact}
                  onUpdateContact={handleUpdateContact}
                  onDeleteContact={handleDeleteContact}
                />
              )}

              {activeTab === 'materials' && (
                <KnowledgeBaseView
                  materials={appState.materials}
                  isOfficer={isOfficer}
                  availableCourses={appState.schedules.map((s) => s.course)}
                  onAddMaterial={handleAddMaterial}
                  onDeleteMaterial={handleDeleteMaterial}
                  onPreviewPdf={(material) => setPreviewMaterial(material)}
                />
              )}

              {activeTab === 'tasks' && (
                <TaskTrackerView
                  tasks={appState.tasks}
                  contacts={appState.contacts}
                  isOfficer={isOfficer}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onDeleteTask={handleDeleteTask}
                />
              )}

              {activeTab === 'spinwheel' && (
                <SpinwheelView
                  onSaveGroupResult={handleSaveGroupResult}
                  savedResults={appState.groupResults}
                  isOfficer={isOfficer}
                />
              )}

              {activeTab === 'calculator' && (
                <GradeCalculatorView courseGrades={appState.courseGrades} />
              )}

              {activeTab === 'letter' && <LetterGeneratorView />}

              {activeTab === 'blockblast' && <BlockBlastView />}

              {activeTab === 'mbudiary' && <MbudiaryView />}
            </>
          )}
        </main>
      </div>

      <PdfViewerModal
        material={previewMaterial}
        onClose={() => setPreviewMaterial(null)}
      />

      <SoftForceModal />

      <GpaCalculatorModal
        isOpen={isGpaModalOpen}
        onClose={() => setIsGpaModalOpen(false)}
      />
    </div>
  );
}