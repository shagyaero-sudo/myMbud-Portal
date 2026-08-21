import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';

import { subscribeAnnouncements } from './services/announcements';
import { supabase } from './services/supabase';

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
import { OnboardingScreen } from './components/OnboardingScreen';
import { SplashScreen } from './components/SplashScreen';

import {
  AppState,
  MaterialFile,
  Task,
  Contact,
  GroupResult,
  ScheduleItem,
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

import {
  fetchMaterials,
  addMaterialToFirestore,
  deleteMaterialFromFirestore,
} from './services/materials';

const IS_MAINTENANCE = false;

const AppSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-40 bg-slate-200/60 dark:bg-zinc-900/60 rounded-3xl w-full border border-slate-200 dark:border-zinc-800"></div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-64 bg-slate-200/60 dark:bg-zinc-900/60 rounded-3xl w-full border border-slate-200 dark:border-zinc-800"></div>
        <div className="h-48 bg-slate-200/60 dark:bg-zinc-900/60 rounded-3xl w-full border border-slate-200 dark:border-zinc-800"></div>
      </div>

      <div className="h-96 bg-slate-200/60 dark:bg-zinc-900/60 rounded-3xl w-full border border-slate-200 dark:border-zinc-800"></div>
    </div>
  </div>
);

export default function App() {
  if (IS_MAINTENANCE) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
        <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-slate-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-md flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-slate-800 text-slate-300 rounded-2xl flex items-center justify-center text-3xl mb-2 border border-zinc-700">
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

  const [showSplash, setShowSplash] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('mymbud_auth') === 'true';
  });

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('mymbud_onboarded') === 'true';
  });

  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const currentUserNrp = localStorage.getItem('mymbud_user_nrp') || 'unknown';

  useEffect(() => {
    const checkSessionStatus = async () => {
      const userNrp = localStorage.getItem('mymbud_user_nrp');

      if (userNrp && isAuthenticated) {
        try {
          const { data } = await supabase
            .from('revoked_sessions')
            .select('id')
            .eq('id', userNrp)
            .maybeSingle();

          if (data) {
            localStorage.removeItem('mymbud_auth');
            localStorage.removeItem('mymbud_user_name');
            localStorage.removeItem('mymbud_user_nrp');
            localStorage.removeItem('mymbud_onboarded');

            setHasCompletedOnboarding(false);
            setIsAuthenticated(false);
            alert('Ada Pembaruan Sistem, Silakan login kembali yaa! ✨');
          }
        } catch {
          // Abaikan jika tabel revoked_sessions belum dipakai
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
          await loginOneSignal(nrp);
        }
      }
    };

    setupOneSignal();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleOneSignalRedirect = (e: any) => {
      const targetTab = e?.detail?.tab || localStorage.getItem('mbud_target_tab') || 'mbudiary';
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
    localStorage.removeItem('mymbud_onboarded');

    setHasCompletedOnboarding(false);
    setIsAuthenticated(false);
  };

  // DETEKSI MOBILE & TABLET SECARA LENGKAP
  const userAgent = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  const isAndroid =
    /android|samsungbrowser/i.test(userAgent) ||
    /linux arm|android/i.test(platform) ||
    (/linux/i.test(platform) && maxTouchPoints > 1 && !/windows|macintosh/i.test(userAgent));

  const isIOS =
    /ipad|iphone|ipod/.test(userAgent) ||
    (platform === 'macintel' && maxTouchPoints > 1 && !(window as any).MSStream);

  const isMobileOrTabletOS = isAndroid || isIOS;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as any).standalone === true) ||
    document.referrer.includes('android-app://');

  const requiresLogin =
    !isAuthenticated && (!isMobileOrTabletOS || isStandalone);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedContactCourse, setSelectedContactCourse] = useState<string>('ALL');
  const [isOfficer, setIsOfficer] = useState<boolean>(false);
  const [isGpaModalOpen, setIsGpaModalOpen] = useState<boolean>(false);

  const handleNavigateTab = useCallback(
    (tab: TabType, courseFilter?: string) => {
      setSelectedContactCourse(courseFilter || 'ALL');
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

  useEffect(() => {
    const unsubscribe = subscribeAnnouncements((announcementsData) => {
      setAppState((prev) => ({
        ...prev,
        announcements: announcementsData,
      }));
    });

    return () => unsubscribe();
  }, []);

  // --- SUPABASE REAL-TIME LISTENERS ---
  useEffect(() => {
    setIsSyncing(true);

    const loadCourses = async () => {
      const { data, error } = await supabase.from('courses').select('*');
      if (error) {
        console.error('Error fetching courses:', error);
        return;
      }
      if (data) {
        const supabaseSchedules: ScheduleItem[] = [];
        const supabaseContacts: Contact[] = [];

        data.forEach((d: any) => {
          const scheduleDay = d.day || (d.schedule_day_time ? d.schedule_day_time.split(',')[0]?.trim() : 'Senin');
          const scheduleTime = d.time || (d.schedule_day_time ? d.schedule_day_time.split(',').slice(1).join(',').trim() : '');
          const courseName = d.name || d.course || '';
          const pj = d.pj_name || d.pj_matkul || d.pjName || '';
          const pjTel = d.pj_phone || d.pjPhone || '';
          const presensi = d.attendance_url || d.attendanceUrl || '';

          supabaseSchedules.push({
            id: d.id,
            day: scheduleDay,
            course: courseName,
            code: d.code || '',
            time: scheduleTime,
            room: d.room || '',
            lecturer: d.lecturer || d.lecturerName || '',
            lecturer2: d.lecturer2 || d.lecturerName2 || '',
            pjMatkul: pj,
            sks: Number(d.credits || d.sks) || 0,
            attendanceUrl: presensi,
          });

          supabaseContacts.push({
            id: d.id,
            code: d.code || '',
            course: courseName,
            sks: Number(d.credits || d.sks) || 0,
            lecturerName: d.lecturer || d.lecturerName || '',
            lecturerPhone: d.lecturer_phone || d.lecturerPhone || '',
            lecturerName2: d.lecturer2 || d.lecturerName2 || '',
            lecturerPhone2: d.lecturer_phone2 || d.lecturerPhone2 || '',
            pjName: pj,
            pjPhone: pjTel,
            room: d.room || '',
            scheduleDayTime: d.schedule_day_time || (scheduleDay + (scheduleTime ? ', ' + scheduleTime : '')),
            attendanceUrl: presensi,
          });
        });

        setAppState((prev) => ({
          ...prev,
          schedules: supabaseSchedules,
          contacts: supabaseContacts,
          lastUpdated: new Date().toISOString(),
        }));
      }
      setIsSyncing(false);
      setIsInitialLoad(false);
    };

    const loadTasks = async () => {
      const { data, error } = await supabase.from('tasks').select('*');
      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }
      if (data) {
        const list: Task[] = data.map((d: any) => ({
          id: d.id,
          title: d.title || '',
          course: d.course || d.course_name || '',
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
          classroomUrl: d.classroom_url || d.classroomUrl || undefined,
          attachment: d.attachment || undefined,
        }));

        setAppState((prev) => ({
          ...prev,
          tasks: list,
          lastUpdated: new Date().toISOString(),
        }));
      }
    };

    const loadMaterials = async () => {
      const mats = await fetchMaterials();
      setAppState((prev) => ({
        ...prev,
        materials: mats,
        lastUpdated: new Date().toISOString(),
      }));
    };

    loadCourses();
    loadTasks();
    loadMaterials();

    const channel = supabase
      .channel('public:portal_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => {
          loadCourses();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          loadTasks();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'materials' },
        () => {
          loadMaterials();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const syncState = useCallback(async () => {
    setIsSyncing(true);
    try {
      const data = await fetchAppState();
      if (data) {
        setAppState((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Gagal sinkronisasi manual:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

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
    } catch (error) {
      console.error('Gagal menambahkan mata kuliah:', error);
      alert('Gagal menyimpan data mata kuliah.');
    }
  };

  const handleUpdateContact = async (id: string, contact: Partial<Contact>) => {
    try {
      await updateContactApi(id, contact);
    } catch (error) {
      console.error('Gagal mengubah mata kuliah:', error);
      alert('Gagal mengubah data mata kuliah.');
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await deleteContactApi(id);
    } catch (error) {
      console.error('Gagal menghapus mata kuliah:', error);
      alert('Gagal menghapus data mata kuliah.');
    }
  };

  const handleAddMaterial = async (
    material: Omit<MaterialFile, 'id' | 'uploadDate'>
  ) => {
    try {
      await addMaterialToFirestore(material);
    } catch (error) {
      console.error('Gagal menambahkan materi:', error);
      alert('Gagal menyimpan berkas.');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus berkas materi ini?')) return;

    try {
      await deleteMaterialFromFirestore(id);
    } catch (error) {
      console.error('Gagal menghapus materi:', error);
      alert('Gagal menghapus berkas.');
    }
  };

  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    try {
      await addTaskApi(task);
    } catch (error) {
      console.error('[Task] Gagal menambahkan tugas:', error);
      alert('Tugas gagal disimpan.');
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await updateTaskApi(id, updates);
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
    } catch (error) {
      console.error('[Task] Gagal mengubah status tugas:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTaskApi(id);
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
      }
    } catch (error) {
      console.error('Gagal menyimpan hasil kelompok:', error);
    }
  };

  if (requiresLogin) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  if (isAuthenticated && !hasCompletedOnboarding) {
    const currentUserName = localStorage.getItem('mymbud_user_name') || 'Mbuders';
    return (
      <OnboardingScreen
        userName={currentUserName}
        onComplete={() => setHasCompletedOnboarding(true)}
      />
    );
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" soundUrl="/splash-sound.mp3" />}
      </AnimatePresence>

      <div className="relative min-h-screen bg-slate-50 dark:bg-[#0c0e12] text-slate-800 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white transition-colors duration-300">
        
        {/* DYNAMIC AMBIENT THEME GLOW */}
        <div className="fixed top-[-15%] left-1/2 -translate-x-1/2 w-[700px] sm:w-[950px] h-[500px] bg-[radial-gradient(circle,currentColor_0%,transparent_70%)] opacity-[0.06] dark:opacity-[0.11] rounded-full blur-[120px] pointer-events-none -z-10 transition-all duration-700 text-blue-600 dark:text-blue-500" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[450px] sm:w-[600px] h-[450px] bg-[radial-gradient(circle,currentColor_0%,transparent_70%)] opacity-[0.04] dark:opacity-[0.09] rounded-full blur-[130px] pointer-events-none -z-10 transition-all duration-700 text-indigo-600 dark:text-indigo-500" />

        <Header
          isOfficer={isOfficer}
          setIsOfficer={setIsOfficer}
          activeTab={activeTab}
          setActiveTab={(tab) => handleNavigateTab(tab)}
          isSyncing={isSyncing}
          lastUpdated={appState.lastUpdated}
          onRefresh={syncState}
          urgentTaskCount={urgentTaskCount}
          onLogout={handleLogout}
        />

        <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 flex flex-col lg:flex-row gap-6 pt-6 pb-24 lg:pb-8">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => handleNavigateTab(tab)}
            activeTaskCount={activeTaskCount}
            onOpenGpaModal={() => setIsGpaModalOpen(true)}
          />

          <main className="flex-1 space-y-6">
            {isInitialLoad ? (
              <AppSkeleton />
            ) : (
              <div
                key={activeTab}
                className="transition-opacity duration-150 ease-out opacity-100"
              >
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
                    key={`contacts-${selectedContactCourse}`}
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
                    completedTaskIds={completedTaskIds}
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
              </div>
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
    </>
  );
}