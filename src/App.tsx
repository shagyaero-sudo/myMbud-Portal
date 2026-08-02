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
import { AppState, MaterialFile, Task, Contact, Announcement, GroupResult } from './types';
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
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedContactCourse, setSelectedContactCourse] = useState<string>('ALL');
  const [isOfficer, setIsOfficer] = useState<boolean>(false);

  const handleNavigateTab = useCallback((tab: TabType, courseFilter?: string) => {
    if (tab === 'contacts' && courseFilter) {
      setSelectedContactCourse(courseFilter);
    }
    setActiveTab(tab);
  }, []);
  
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [previewMaterial, setPreviewMaterial] = useState<MaterialFile | null>(null);

  // Dark Mode State
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
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  // Poll & Pull data dari Firebase Firestore
  const syncState = useCallback(async () => {
    setIsSyncing(true);
    const data = await fetchAppState();

    try {
      // 1. Menarik Data Courses & Contacts
      const querySnapshotCourses = await getDocs(collection(db, "courses"));
      const firebaseSchedules: any[] = [];
      const firebaseContacts: any[] = [];

      querySnapshotCourses.forEach((doc) => {
        const d = doc.data();
        
        firebaseSchedules.push({
          id: doc.id,
          day: d.scheduleDay || (d.scheduleDayTime ? d.scheduleDayTime.split(',')[0] : 'Senin'),
          time: d.scheduleTime || (d.scheduleDayTime ? d.scheduleDayTime.split(',')[1] || '' : ''),
          room: d.room || '',
          course: d.name || d.course || '',
          sks: d.sks || 0,
          lecturer: d.lecturerName || '',
          pjMatkul: d.pjName ? d.pjName.trim() : ''
        });

        firebaseContacts.push({
          id: doc.id,
          code: d.code || '',
          course: d.name || d.course || '',
          sks: d.sks || 0,
          lecturerName: d.lecturerName || '',
          lecturerPhone: d.lecturerPhone || '',
          pjName: d.pjName || '',
          pjPhone: d.pjPhone || '',
          room: d.room || '',
          scheduleDayTime: d.scheduleDayTime || `${d.scheduleDay || 'Senin'}, ${d.scheduleTime || ''}`
        });
      });

      // 2. Menarik Data Tasks
      const querySnapshotTasks = await getDocs(collection(db, "tasks"));
      const firebaseTasks: any[] = [];
      querySnapshotTasks.forEach((doc) => {
        firebaseTasks.push({ id: doc.id, ...doc.data() });
      });

      // Gabungkan ke state (Jika Firebase tasks kosong, gunakan initialAppState.tasks sebagai fallback aman)
      setAppState((prevState) => {
        const baseData = data || prevState; 
        return {
          ...baseData,
          schedules: firebaseSchedules,
          contacts: firebaseContacts.length > 0 ? firebaseContacts : baseData.contacts,
          tasks: firebaseTasks.length > 0 ? firebaseTasks : initialAppState.tasks
        };
      });
    } catch (error) {
      console.error("Gagal menarik data dari Firebase:", error);
      setAppState((prevState) => data || prevState); 
    }

    setIsSyncing(false);
  }, []);

  useEffect(() => {
    syncState();
    const interval = setInterval(() => {
      syncState();
    }, 4000);
    return () => clearInterval(interval);
  }, [syncState]);

  const urgentTaskCount = appState.tasks.filter((t) => {
    if (t.status === 'done') return false;
    const diffHours = (new Date(t.deadline).getTime() - Date.now()) / (1000 * 3600);
    return diffHours >= 0 && diffHours < 48;
  }).length;

  // Handlers
  const handleAddAnnouncement = async (ann: Omit<Announcement, 'id' | 'date'>) => {
    const updated = await addAnnouncementApi(ann);
    if (updated) setAppState(updated);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const updated = await deleteAnnouncementApi(id);
    if (updated) setAppState(updated);
  };

  const handleAddContact = async (contact: Omit<Contact, 'id'>) => {
    await addContactApi(contact);
    syncState(); 
  };

  const handleUpdateContact = async (id: string, contact: Partial<Contact>) => {
    await updateContactApi(id, contact);
    syncState(); 
  };

  const handleDeleteContact = async (id: string) => {
    await deleteContactApi(id);
    syncState(); 
  };

  const handleAddMaterial = async (mat: Omit<MaterialFile, 'id' | 'uploadDate'>) => {
    const updated = await addMaterialApi(mat);
    if (updated) setAppState(updated);
  };

  const handleDeleteMaterial = async (id: string) => {
    const updated = await deleteMaterialApi(id);
    if (updated) setAppState(updated);
  };

  // Handler Tasks
  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    await addTaskApi(task);
    syncState();
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    await updateTaskApi(id, updates);
    syncState();
  };

  const handleUpdateTaskStatus = async (id: string, status: 'todo' | 'in_progress' | 'done') => {
    await updateTaskApi(id, { status });
    syncState();
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTaskApi(id);
    syncState();
  };

  const handleSaveGroupResult = async (res: Omit<GroupResult, 'id' | 'createdAt'>) => {
    const updated = await saveGroupResultApi(res);
    if (updated) setAppState(updated);
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
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-6">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} urgentTaskCount={urgentTaskCount} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
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
              onPreviewPdf={(mat) => setPreviewMaterial(mat)}
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
            <GradeCalculatorView courseGrades={appState.courseGrades} />
          )}

          {activeTab === 'letter' && <LetterGeneratorView />}
        </main>
      </div>

      <PdfViewerModal material={previewMaterial} onClose={() => setPreviewMaterial(null)} />
    </div>
  );
}