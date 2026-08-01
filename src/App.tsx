/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  const [isOfficer, setIsOfficer] = useState<boolean>(false); // Default to normal student mode

  const handleNavigateTab = useCallback((tab: TabType, courseFilter?: string) => {
    if (tab === 'contacts' && courseFilter) {
      setSelectedContactCourse(courseFilter);
    }
    setActiveTab(tab);
  }, []);
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [previewMaterial, setPreviewMaterial] = useState<MaterialFile | null>(null);

  // Dark Mode State with LocalStorage Persistence
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

  // Poll state from Express backend every 4 seconds
  const syncState = useCallback(async () => {
    setIsSyncing(true);
    const data = await fetchAppState();
    if (data) {
      setAppState(data);
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

  // Urgent task count calculation (< 48 hours remaining)
  const urgentTaskCount = appState.tasks.filter((t) => {
    if (t.status === 'done') return false;
    const diffHours = (new Date(t.deadline).getTime() - Date.now()) / (1000 * 3600);
    return diffHours >= 0 && diffHours < 48;
  }).length;

  // Handler mutations with optimistic update & API calls
  const handleAddAnnouncement = async (ann: Omit<Announcement, 'id' | 'date'>) => {
    const updated = await addAnnouncementApi(ann);
    if (updated) setAppState(updated);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const updated = await deleteAnnouncementApi(id);
    if (updated) setAppState(updated);
  };

  const handleAddContact = async (contact: Omit<Contact, 'id'>) => {
    const updated = await addContactApi(contact);
    if (updated) setAppState(updated);
  };

  const handleUpdateContact = async (id: string, contact: Partial<Contact>) => {
    const updated = await updateContactApi(id, contact);
    if (updated) setAppState(updated);
  };

  const handleDeleteContact = async (id: string) => {
    const updated = await deleteContactApi(id);
    if (updated) setAppState(updated);
  };

  const handleAddMaterial = async (mat: Omit<MaterialFile, 'id' | 'uploadDate'>) => {
    const updated = await addMaterialApi(mat);
    if (updated) setAppState(updated);
  };

  const handleDeleteMaterial = async (id: string) => {
    const updated = await deleteMaterialApi(id);
    if (updated) setAppState(updated);
  };

  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    const updated = await addTaskApi(task);
    if (updated) setAppState(updated);
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const updated = await updateTaskApi(id, updates);
    if (updated) setAppState(updated);
  };

  const handleUpdateTaskStatus = async (id: string, status: 'todo' | 'in_progress' | 'done') => {
    const updated = await updateTaskApi(id, { status });
    if (updated) setAppState(updated);
  };

  const handleDeleteTask = async (id: string) => {
    const updated = await deleteTaskApi(id);
    if (updated) setAppState(updated);
  };

  const handleSaveGroupResult = async (res: Omit<GroupResult, 'id' | 'createdAt'>) => {
    const updated = await saveGroupResultApi(res);
    if (updated) setAppState(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Top Header */}
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

      {/* Main Container Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} urgentTaskCount={urgentTaskCount} />

        {/* Content Area */}
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

      {/* PDF Viewer Modal */}
      <PdfViewerModal material={previewMaterial} onClose={() => setPreviewMaterial(null)} />
    </div>
  );
}
