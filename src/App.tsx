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
import { InstallPrompt } from './components/InstallPrompt';

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

export default function App() {
  // ============================================================
  // NAVIGATION
  // ============================================================

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const [selectedContactCourse, setSelectedContactCourse] =
    useState<string>('ALL');

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

  // ============================================================
  // APP STATE
  // ============================================================

  const [appState, setAppState] = useState<AppState>(() => ({
    ...initialAppState,

    // IMPORTANT:
    // Tasks sekarang 100% berasal dari Firebase.
    // Tidak ada lagi dummy/mock task sebagai fallback.
    tasks: [],
  }));

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [previewMaterial, setPreviewMaterial] =
    useState<MaterialFile | null>(null);

  // ============================================================
  // DARK MODE
  // ============================================================

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');

    if (saved !== null) {
      return saved === 'dark';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // PENYESUAIAN DINAMIS STATUS BAR ANDROID 
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        darkMode ? '#09090b' : '#f8fafc' // #09090b = zinc-950, #f8fafc = slate-50
      );
    }
  }, [darkMode]);

  // ============================================================
  // FIREBASE SYNC
  // ============================================================

  const syncState = useCallback(async () => {
    setIsSyncing(true);

    try {
      // ----------------------------------------------------------
      // 1. Ambil state lama/API untuk data lain
      // ----------------------------------------------------------

      const data = await fetchAppState();

      // ----------------------------------------------------------
      // 2. Ambil COURSES dari Firebase
      // ----------------------------------------------------------

      const querySnapshotCourses = await getDocs(
        collection(db, 'courses')
      );

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
            d.scheduleDayTime ||
            `${scheduleDay}, ${scheduleTime}`,
        });
      });

      // ----------------------------------------------------------
      // 3. Ambil TASKS dari Firebase
      // ----------------------------------------------------------

      const querySnapshotTasks = await getDocs(
        collection(db, 'tasks')
      );

      const firebaseTasks: Task[] = [];

      querySnapshotTasks.forEach((taskDoc) => {
        const d = taskDoc.data();

        firebaseTasks.push({
          id: taskDoc.id,
          title: d.title || '',
          course: d.course || '',
          description: d.description || '',
          type:
            d.type === 'Kelompok'
              ? 'Kelompok'
              : 'Individu',
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

      // ----------------------------------------------------------
      // 4. Update App State
      // ----------------------------------------------------------

      setAppState((previousState) => {
        const baseData = data || previousState;

        return {
          ...baseData,

          // Courses dari Firebase
          schedules: firebaseSchedules,

          // Kalau Firebase courses kosong, pertahankan data lama.
          contacts:
            firebaseContacts.length > 0
              ? firebaseContacts
              : baseData.contacts,

          // ======================================================
          // PENTING:
          // TASKS SELALU Firebase.
          //
          // Kalau Firestore kosong → [].
          // Tidak kembali ke mockData.
          // ======================================================
          tasks: firebaseTasks,

          lastUpdated: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Gagal melakukan sinkronisasi:', error);

      // Jangan menghancurkan state yang sedang tampil
      // kalau sync gagal.
      setAppState((previousState) => previousState);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ============================================================
  // INITIAL LOAD + POLLING
  // ============================================================

  useEffect(() => {
    syncState();

    const interval = window.setInterval(() => {
      syncState();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [syncState]);

  // ============================================================
  // URGENT TASK COUNT
  // ============================================================

  const urgentTaskCount = appState.tasks.filter((task) => {
    if (task.status === 'done') {
      return false;
    }

    const deadlineTime = new Date(task.deadline).getTime();

    if (Number.isNaN(deadlineTime)) {
      return false;
    }

    const diffHours =
      (deadlineTime - Date.now()) / (1000 * 3600);

    return diffHours >= 0 && diffHours < 48;
  }).length;

  // ============================================================
  // ANNOUNCEMENTS
  // ============================================================

  const handleAddAnnouncement = async (
    announcement: Omit<Announcement, 'id' | 'date'>
  ) => {
    try {
      const updated = await addAnnouncementApi(announcement);

      if (updated) {
        setAppState(updated);
      } else {
        await syncState();
      }
    } catch (error) {
      console.error('Gagal menambahkan pengumuman:', error);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const updated = await deleteAnnouncementApi(id);

      if (updated) {
        setAppState(updated);
      } else {
        await syncState();
      }
    } catch (error) {
      console.error('Gagal menghapus pengumuman:', error);
    }
  };

  // ============================================================
  // CONTACTS / COURSES
  // ============================================================

  const handleAddContact = async (
    contact: Omit<Contact, 'id'>
  ) => {
    try {
      await addContactApi(contact);
      await syncState();
    } catch (error) {
      console.error('Gagal menambahkan mata kuliah:', error);
      alert(
        'Gagal menyimpan data mata kuliah. Cek koneksi Firebase.'
      );
    }
  };

  const handleUpdateContact = async (
    id: string,
    contact: Partial<Contact>
  ) => {
    try {
      await updateContactApi(id, contact);
      await syncState();
    } catch (error) {
      console.error('Gagal mengubah mata kuliah:', error);
      alert(
        'Gagal mengubah data mata kuliah. Cek koneksi Firebase.'
      );
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await deleteContactApi(id);
      await syncState();
    } catch (error) {
      console.error('Gagal menghapus mata kuliah:', error);
      alert(
        'Gagal menghapus data mata kuliah. Cek koneksi Firebase.'
      );
    }
  };

  // ============================================================
  // MATERIALS
  // ============================================================

  const handleAddMaterial = async (
    material: Omit<MaterialFile, 'id' | 'uploadDate'>
  ) => {
    try {
      const updated = await addMaterialApi(material);

      if (updated) {
        setAppState(updated);
      } else {
        await syncState();
      }
    } catch (error) {
      console.error('Gagal menambahkan materi:', error);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      const updated = await deleteMaterialApi(id);

      if (updated) {
        setAppState(updated);
      } else {
        await syncState();
      }
    } catch (error) {
      console.error('Gagal menghapus materi:', error);
    }
  };

  // ============================================================
  // TASKS — FIREBASE
  // ============================================================

  const handleAddTask = async (
    task: Omit<Task, 'id'>
  ) => {
    try {
      console.log('[Task] Menambahkan tugas:', task);

      await addTaskApi(task);

      console.log('[Task] Berhasil tersimpan ke Firebase');

      await syncState();
    } catch (error) {
      console.error('[Task] Gagal menambahkan tugas:', error);

      alert(
        'Tugas gagal disimpan ke Firebase. Cek Console untuk detail error.'
      );
    }
  };

  const handleUpdateTask = async (
    id: string,
    updates: Partial<Task>
  ) => {
    try {
      console.log('[Task] Mengubah tugas:', id, updates);

      await updateTaskApi(id, updates);

      console.log('[Task] Berhasil diubah di Firebase');

      await syncState();
    } catch (error) {
      console.error('[Task] Gagal mengubah tugas:', error);

      alert(
        'Tugas gagal diperbarui. Cek Console untuk detail error.'
      );
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
      console.error(
        '[Task] Gagal mengubah status tugas:',
        error
      );
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      console.log('[Task] Menghapus tugas:', id);

      await deleteTaskApi(id);

      console.log('[Task] Berhasil dihapus dari Firebase');

      await syncState();
    } catch (error) {
      console.error('[Task] Gagal menghapus tugas:', error);

      alert(
        'Tugas gagal dihapus. Cek Console untuk detail error.'
      );
    }
  };

  // ============================================================
  // GROUP RESULTS
  // ============================================================

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
      console.error(
        'Gagal menyimpan hasil kelompok:',
        error
      );
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

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
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-6">

        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          urgentTaskCount={urgentTaskCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">

          {/* ====================================================
              DASHBOARD
          ==================================================== */}

          {activeTab === 'dashboard' && (
            <DashboardView
              state={appState}
              isOfficer={isOfficer}
              onAddAnnouncement={handleAddAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {/* ====================================================
              CONTACTS
          ==================================================== */}

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

          {/* ====================================================
              MATERIALS
          ==================================================== */}

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

          {/* ====================================================
              TASK TRACKER
          ==================================================== */}

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

          {/* ====================================================
              SPINWHEEL
          ==================================================== */}

          {activeTab === 'spinwheel' && (
            <SpinwheelView
              onSaveGroupResult={handleSaveGroupResult}
              savedResults={appState.groupResults}
              isOfficer={isOfficer}
            />
          )}

          {/* ====================================================
              GRADE CALCULATOR
          ==================================================== */}

          {activeTab === 'calculator' && (
            <GradeCalculatorView
              courseGrades={appState.courseGrades}
            />
          )}

          {/* ====================================================
              LETTER GENERATOR
          ==================================================== */}

          {activeTab === 'letter' && (
            <LetterGeneratorView />
          )}

        </main>
      </div>

      {/* ========================================================
          PDF VIEWER
      ======================================================== */}

      <PdfViewerModal
        material={previewMaterial}
        onClose={() => setPreviewMaterial(null)}
      />

      {/* ========================================================
          PWA INSTALL PROMPT
      ======================================================== */}
      
      <InstallPrompt />

    </div>
  );
}