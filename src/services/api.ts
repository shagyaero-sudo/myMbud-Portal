import {
  AppState,
  Task,
  Contact,
  MaterialFile,
  Announcement,
  GroupResult,
} from '../types';

import { supabase } from './supabase';

// ============================================================
// APP STATE
// ============================================================

export async function fetchAppState(): Promise<AppState | null> {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('Failed to fetch state');
    return await res.json();
  } catch (err) {
    console.error('API fetchAppState error:', err);
    return null;
  }
}

export async function resetAppState(): Promise<AppState | null> {
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    const data = await res.json();
    return data.state || data.data;
  } catch (err) {
    console.error('API reset error:', err);
    return null;
  }
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================

export async function addAnnouncementApi(
  announcement: Omit<Announcement, 'id' | 'date'>
): Promise<AppState | null> {
  try {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcement),
    });
    const data = await res.json();
    return data.state;
  } catch (err) {
    console.error('API addAnnouncement error:', err);
    return null;
  }
}

export async function deleteAnnouncementApi(id: string): Promise<AppState | null> {
  try {
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.state;
  } catch (err) {
    console.error('API deleteAnnouncement error:', err);
    return null;
  }
}

// ============================================================
// COURSES / KONTAK (SUPABASE)
// ============================================================

export async function addContactApi(contact: Omit<Contact, 'id'>): Promise<AppState | null> {
  try {
    const id = crypto.randomUUID();
    const { error } = await supabase.from('courses').insert({
      id,
      ...contact,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return null;
  } catch (err) {
    console.error('Supabase addContact error:', err);
    throw err;
  }
}

export async function updateContactApi(id: string, contact: Partial<Contact>): Promise<AppState | null> {
  try {
    const { error } = await supabase.from('courses').update(contact).eq('id', id);
    if (error) throw error;
    return null;
  } catch (err) {
    console.error('Supabase updateContact error:', err);
    throw err;
  }
}

export async function deleteContactApi(id: string): Promise<AppState | null> {
  try {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
    return null;
  } catch (err) {
    console.error('Supabase deleteContact error:', err);
    throw err;
  }
}

// ============================================================
// MATERIALS (API)
// ============================================================

export async function addMaterialApi(
  material: Omit<MaterialFile, 'id' | 'uploadDate'>
): Promise<AppState | null> {
  try {
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(material),
    });
    const data = await res.json();
    return data.state;
  } catch (err) {
    console.error('API addMaterial error:', err);
    return null;
  }
}

export async function deleteMaterialApi(id: string): Promise<AppState | null> {
  try {
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.state;
  } catch (err) {
    console.error('API deleteMaterial error:', err);
    return null;
  }
}

// ============================================================
// TASKS (SUPABASE)
// ============================================================

export async function addTaskApi(task: Omit<Task, 'id'>): Promise<AppState | null> {
  try {
    const id = crypto.randomUUID();
    const { error } = await supabase.from('tasks').insert({
      id,
      course_id: task.courseId,
      course_name: task.courseName,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      type: task.type,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return null;
  } catch (err) {
    console.error('Supabase addTask error:', err);
    throw err;
  }
}

export async function updateTaskApi(id: string, updates: Partial<Task>): Promise<AppState | null> {
  try {
    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.deadline !== undefined) payload.deadline = updates.deadline;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.courseId !== undefined) payload.course_id = updates.courseId;
    if (updates.courseName !== undefined) payload.course_name = updates.courseName;

    const { error } = await supabase.from('tasks').update(payload).eq('id', id);
    if (error) throw error;
    return null;
  } catch (err) {
    console.error('Supabase updateTask error:', err);
    throw err;
  }
}

export async function deleteTaskApi(id: string): Promise<AppState | null> {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    return null;
  } catch (err) {
    console.error('Supabase deleteTask error:', err);
    throw err;
  }
}

// ============================================================
// TASK COMPLETIONS PER USER (NRP) — SUPABASE
// ============================================================

const TASK_COMPLETIONS_TABLE = 'mbud_user_task_completions';

export function subscribeUserTaskCompletions(userNrp: string, callback: (completedTaskIds: string[]) => void) {
  const normalizedNrp = userNrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') {
    callback([]);
    return () => {};
  }

  const fetchCompletions = async () => {
    const { data } = await supabase
      .from(TASK_COMPLETIONS_TABLE)
      .select('task_id')
      .eq('nrp', normalizedNrp);

    if (data) {
      callback(data.map((item) => item.task_id));
    }
  };

  fetchCompletions();

  const channel = supabase
    .channel(`task-completions-${normalizedNrp}-${Math.random()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: TASK_COMPLETIONS_TABLE }, () => {
      fetchCompletions();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function toggleTaskCompletion(userNrp: string, taskId: string, isCompleted: boolean): Promise<void> {
  const normalizedNrp = userNrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') {
    throw new Error('NRP tidak valid. Harap login terlebih dahulu.');
  }

  const docId = `${normalizedNrp}_${taskId}`;

  if (isCompleted) {
    await supabase.from(TASK_COMPLETIONS_TABLE).upsert({
      id: docId,
      nrp: normalizedNrp,
      task_id: taskId,
      completed_at: new Date().toISOString(),
    });
  } else {
    await supabase.from(TASK_COMPLETIONS_TABLE).delete().eq('id', docId);
  }
}

// ============================================================
// GROUP RESULTS
// ============================================================

export async function saveGroupResultApi(
  groupResult: Omit<GroupResult, 'id' | 'createdAt'>
): Promise<AppState | null> {
  try {
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupResult),
    });
    const data = await res.json();
    return data.state;
  } catch (err) {
    console.error('API saveGroupResult error:', err);
    return null;
  }
}

// ============================================================
// MATERIAL BOOKMARKS PER USER (NRP) — SUPABASE
// ============================================================

const MATERIAL_BOOKMARKS_TABLE = 'mbud_user_material_bookmarks';

export function subscribeUserMaterialBookmarks(userNrp: string, callback: (bookmarkedMaterialIds: string[]) => void) {
  const normalizedNrp = userNrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') {
    callback([]);
    return () => {};
  }

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from(MATERIAL_BOOKMARKS_TABLE)
      .select('material_id')
      .eq('nrp', normalizedNrp);

    if (data) {
      callback(data.map((item) => item.material_id));
    }
  };

  fetchBookmarks();

  const channel = supabase
    .channel(`mat-bookmarks-${normalizedNrp}-${Math.random()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: MATERIAL_BOOKMARKS_TABLE }, () => {
      fetchBookmarks();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function toggleMaterialBookmark(userNrp: string, materialId: string, isBookmarked: boolean): Promise<void> {
  const normalizedNrp = userNrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') {
    throw new Error('NRP tidak valid. Harap login terlebih dahulu.');
  }

  const docId = `${normalizedNrp}_${materialId}`;

  if (isBookmarked) {
    await supabase.from(MATERIAL_BOOKMARKS_TABLE).upsert({
      id: docId,
      nrp: normalizedNrp,
      material_id: materialId,
      bookmarked_at: new Date().toISOString(),
    });
  } else {
    await supabase.from(MATERIAL_BOOKMARKS_TABLE).delete().eq('id', docId);
  }
}