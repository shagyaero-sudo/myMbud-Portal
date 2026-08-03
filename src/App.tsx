/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './services/firebase';

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

import {
  AppState,
  MaterialFile,
  Task,
  Contact,
  Announcement,
  GroupResult,
} from './types';

import { initialAppState } from './data/mockData';

import {
  fetchAppState,
  addAnnouncementApi,
  deleteAnnouncementApi,
  addContactApi,
  updateContactApi,
  deleteContactApi,
  addMaterialApi,
  deleteMaterialApi,
  addTaskApi,
  updateTaskApi,
  deleteTaskApi,
  saveGroupResultApi,
} from './services/api';

// ============================================================
// KOMPONEN SKELETON LOADER
// ============================================================
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
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedContactCourse, setSelectedContactCourse] = useState<string>('ALL');
  const [isOfficer, setIsOfficer] = useState<boolean>(false);

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
  }));

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [previewMaterial, setPreviewMaterial] = useState<MaterialFile | null>(null);

  // ============================================================
  // THEME SWITCHER LOGIC (Membaca hasil script index.html)
  // ============================================================
  const [theme, setTheme] = useState<'light' | 'dark' | 'pink'>(() => {
    const root = document.documentElement;
    if (root.classList.contains('pink')) return 'pink';
    if (root.classList.contains('dark')) return 'dark';
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'pink');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'pink') {
      root.classList.add('pink');
    }
    
    localStorage.setItem('theme', theme);

    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      if (theme === 'dark') metaThemeColor.setAttribute('content', '#09090b');
      else if (theme === 'pink') metaThemeColor.setAttribute('content', '#fff0f3');
      else metaThemeColor.setAttribute('content', '#f8fafc');
    }
  }, [theme]);

  // ============================================================
  // FIREBASE SYNC
  // ============================================================
  const syncState = useCallback(async () => {
    setIsSyncing(true);

    try {
      const data = await fetchAppState();

      // Fetch Courses
      const querySnapshotCourses = await getDocs(collection(db, 'courses'));
      const firebaseSchedules: AppState['schedules'] = [];
      const firebaseContacts: AppState['contacts'] = [];

      querySnapshotCourses.forEach((courseDoc) => {
        const d = courseDoc.data();
        const scheduleDay = d.scheduleDay || (d.scheduleDayTime ? String(d.scheduleDayTime).split(',')[0]?.trim() : 'Senin');
        const scheduleTime = d.scheduleTime || (d.scheduleDayTime ? String(d.scheduleDayTime).split(',').slice(1).join(',').trim() : '');
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
          scheduleDayTime: d.scheduleDayTime || `${scheduleDay}, ${scheduleTime}`,
        });
      });

      // Fetch Tasks
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
          status: d.status === 'done' ? 'done' : d.status === 'in_progress' ? 'in_progress' : 'todo',
          priority: d.priority === 'Low' ? 'Low' : d.priority === 'Medium' ? 'Medium' : 'High',
          classroomUrl: d.classroomUrl || undefined,
          attachment: d.attachment
            ? { fileName: d.attachment.fileName || '', fileUrl: d.attachment.fileUrl || '' }
            : undefined,
        });
      });

      // Update State
      setAppState((previousState) => {
        const baseData = data || previousState;
        return {
          ...baseData,
          schedules: firebaseSchedules,
          contacts: firebaseContacts.length > 0 ? firebaseContacts : baseData.contacts,
          tasks: firebaseTasks,
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

  const urgentTaskCount = appState.tasks.filter((task) => {
    if (task.status === 'done') return false;
    const deadlineTime = new Date(task.deadline).getTime();
    if (Number.isNaN(deadlineTime)) return false;
    const diffHours = (deadlineTime - Date.now()) / (1000 * 3600);
    return diffHours >= 0 && diffHours < 48;
  }).length;

  const handleAddAnnouncement = async (announcement: Omit<Announcement, 'id' | 'date'>) => {
    try {
      const updated = await addAnnouncementApi(announcement);
      if (updated) setAppState(updated);
      else await syncState();
    } catch (error) {
      console.error('Gagal menambahkan pengumuman:', error);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const updated = await deleteAnnouncementApi(id);
      if (updated) setAppState(updated);
      else await syncState();
    } catch (error) {
      console.error('Gagal menghapus pengumuman:', error);
    }
  };

  const handleAddContact = async (contact: Omit<Contact, 'id'>) => {
    try {
      await addContactApi(contact);
      await syncState();
    } catch (error) {
      console.error('Gagal menambahkan mata kuliah:', error);
      alert('Gagal menyimpan data mata kuliah. Cek koneksi Firebase.');
    }
  };

  const handleUpdateContact = async (id: string, contact: Partial<Contact>) => {
    try {
      await updateContactApi(id, contact);
      await syncState();
    } catch (error) {
      console.error('Gagal mengubah mata kuliah:', error);
      alert('Gagal mengubah data mata kuliah. Cek koneksi Firebase.');
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await deleteContactApi(id);
      await syncState();
    } catch (error) {
      console.error('Gagal menghapus mata kuliah:', error);
      alert('Gagal menghapus data mata kuliah. Cek koneksi Firebase.');
    }
  };

  const handleAddMaterial = async (material: Omit<MaterialFile, 'id' | 'uploadDate'>) => {
    try {
      const updated = await addMaterialApi(material);
      if (updated) setAppState(updated);
      else await syncState();
    } catch (error) {
      console.error('Gagal menambahkan materi:', error);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      const updated = await deleteMaterialApi(id);
      if (updated) setAppState(updated);
      else await syncState();
    } catch (error) {
      console.error('Gagal menghapus materi:', error);
    }
  };

  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    try {
      await addTaskApi(task);
      await syncState();
    } catch (error) {
      console.error('[Task] Gagal menambahkan tugas:', error);
      alert('Tugas gagal disimpan ke Firebase. Cek Console untuk detail error.');
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await updateTaskApi(id, updates);
      await syncState();
    } catch (error) {
      console.error('[Task] Gagal mengubah tugas:', error);
      alert('Tugas gagal diperbarui. Cek Console untuk detail error.');
    }
  };

  const handleUpdateTaskStatus = async (id: string, status: 'todo' | 'in_progress' | 'done') => {
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
      alert('Tugas gagal dihapus. Cek Console untuk detail error.');
    }
  };

  const handleSaveGroupResult = async (result: Omit<GroupResult, 'id' | 'createdAt'>) => {
    try {
      const updated = await saveGroupResultApi(result);
      if (updated) setAppState(updated);
      else await syncState();
    } catch (error) {
      console.error('Gagal menyimpan hasil kelompok:', error);
    }
  };

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
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-6">

        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          urgentTaskCount={urgentTaskCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">

          {isInitialLoad ? (
            <AppSkeleton />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  state={appState}
                  isOfficer={isOfficer}
                  onAddAnnouncement={handleAddAnnouncement}
                  onDeleteAnnouncement={handleDeleteAnnouncement}
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
                  onAddMaterial={handleAddMaterial}
                  onDeleteMaterial={handleDeleteMaterial}
                  onPreviewPdf={(material) =>
                    setPreviewMaterial(material)
                  }
                />
              )}

              {activeTab === 'tasks' && (
                <TaskTrackerView
                  tasks={appState.tasks}
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
                <GradeCalculatorView
                  courseGrades={appState.courseGrades}
                />
              )}

              {activeTab === 'letter' && (
                <LetterGeneratorView />
              )}
            </>
          )}

        </main>
      </div>

      <PdfViewerModal
        material={previewMaterial}
        onClose={() => setPreviewMaterial(null)}
      />
      
      <SoftForceModal />

    </div>
  );
}