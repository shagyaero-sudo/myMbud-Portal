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
    const scheduleParts = (contact.scheduleDayTime || '').split(',');
    const day = scheduleParts[0]?.trim() || 'Senin';
    const time = scheduleParts.slice(1).join(',').trim() || '';

    // Handle target_nrps
    const targetNrps = (contact as any).target_nrps || (contact as any).targetNrps || null;

    const { error } = await supabase.from('courses').insert({
      id,
      code: contact.code || '',
      name: contact.course || '',
      lecturer: contact.lecturerName || '',
      lecturer_phone: contact.lecturerPhone || '',
      lecturer2: contact.lecturerName2 || '',
      lecturer_phone2: contact.lecturerPhone2 || '',
      pj_name: contact.pjName || '',
      pj_matkul: contact.pjName || '',
      pj_phone: contact.pjPhone || '',
      room: contact.room || '',
      day,
      time,
      schedule_day_time: contact.scheduleDayTime || `${day}, ${time}`,
      attendance_url: contact.attendanceUrl || '',
      credits: Number(contact.sks) || 0,
      target_nrps: targetNrps,
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
    const payload: Record<string, any> = {};
    if (contact.code !== undefined) payload.code = contact.code;
    if (contact.course !== undefined) payload.name = contact.course;
    if (contact.lecturerName !== undefined) payload.lecturer = contact.lecturerName;
    if (contact.lecturerPhone !== undefined) payload.lecturer_phone = contact.lecturerPhone;
    if (contact.lecturerName2 !== undefined) payload.lecturer2 = contact.lecturerName2;
    if (contact.lecturerPhone2 !== undefined) payload.lecturer_phone2 = contact.lecturerPhone2;
    if (contact.pjName !== undefined) {
      payload.pj_name = contact.pjName;
      payload.pj_matkul = contact.pjName;
    }
    if (contact.pjPhone !== undefined) payload.pj_phone = contact.pjPhone;
    if (contact.room !== undefined) payload.room = contact.room;
    if (contact.scheduleDayTime !== undefined) {
      payload.schedule_day_time = contact.scheduleDayTime;
      payload.day = contact.scheduleDayTime.split(',')[0]?.trim() || 'Senin';
      payload.time = contact.scheduleDayTime.split(',').slice(1).join(',').trim() || '';
    }
    if (contact.attendanceUrl !== undefined) payload.attendance_url = contact.attendanceUrl;
    if (contact.sks !== undefined) payload.credits = Number(contact.sks) || 0;

    if ((contact as any).target_nrps !== undefined || (contact as any).targetNrps !== undefined) {
      payload.target_nrps = (contact as any).target_nrps ?? (contact as any).targetNrps ?? null;
    }

    const { error } = await supabase.from('courses').update(payload).eq('id', id);
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
    const courseValue = (task as any).course || (task as any).courseName || '';

    const attachmentsArray =
      task.attachments && task.attachments.length > 0
        ? task.attachments
        : task.attachment
        ? [task.attachment]
        : [];

    const { error } = await supabase.from('tasks').insert({
      id,
      title: task.title || '',
      course: courseValue,
      course_name: courseValue,
      description: task.description || '',
      type: task.type || 'Individu',
      assigner: task.assigner || '',
      deadline: task.deadline || '',
      status: task.status || 'todo',
      priority: task.priority || 'Medium',
      classroom_url: task.classroomUrl || null,
      attachment: attachmentsArray[0] || null,
      attachments: attachmentsArray,
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
    if ((updates as any).course !== undefined || (updates as any).courseName !== undefined) {
      const courseVal = (updates as any).course || (updates as any).courseName;
      payload.course = courseVal;
      payload.course_name = courseVal;
    }
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.assigner !== undefined) payload.assigner = updates.assigner;
    if (updates.deadline !== undefined) payload.deadline = updates.deadline;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.classroomUrl !== undefined) payload.classroom_url = updates.classroomUrl;

    if (updates.attachments !== undefined || updates.attachment !== undefined) {
      const attachmentsArray =
        updates.attachments && updates.attachments.length > 0
          ? updates.attachments
          : updates.attachment
          ? [updates.attachment]
          : [];

      payload.attachment = attachmentsArray[0] || null;
      payload.attachments = attachmentsArray;
    }

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
// TASK COMPLETIONS PER USER & ALL (SUPABASE)
// ============================================================

const TASK_COMPLETIONS_TABLE = 'mbud_user_task_completions';

export type TaskCompletionCounts = Record<string, number>;

export function subscribeAllTaskCompletions(
  callback: (completionCounts: TaskCompletionCounts) => void
) {
  const fetchAllCounts = async () => {
    try {
      const { data, error } = await supabase
        .from(TASK_COMPLETIONS_TABLE)
        .select('task_id, nrp');

      if (error) {
        console.error('Gagal mengambil data agregat penyelesaian tugas:', error);
        return;
      }

      if (data) {
        const counts: TaskCompletionCounts = {};
        data.forEach((item) => {
          if (item.task_id) {
            counts[item.task_id] = (counts[item.task_id] || 0) + 1;
          }
        });
        callback(counts);
      }
    } catch (err) {
      console.error('Error fetchAllCounts:', err);
    }
  };

  fetchAllCounts();

  const channel = supabase
    .channel(`all-task-completions-realtime-${Math.random()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TASK_COMPLETIONS_TABLE },
      () => {
        fetchAllCounts();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

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

// ============================================================
// ASPIRATION FEEDBACKS (SUPABASE)
// ============================================================

export interface AspirationPayload {
  nrp: string;
  nama: string;
  rating: number;
  favorite_feature: string;
  issues_found: string;
  aspirations: string;
}

export async function checkAspirationStatus(nrp: string): Promise<boolean> {
  const normalizedNrp = nrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') return true;

  try {
    const { data, error } = await supabase
      .from('aspiration_feedbacks')
      .select('id')
      .ilike('nrp', normalizedNrp)
      .limit(1);

    if (error) {
      console.error('[AspirationCheck] Supabase Error:', error.message);
      // Fail-safe: jika ada error kueri, izinkan user masuk agar tidak ke-lock
      return true;
    }

    return Boolean(data && data.length > 0);
  } catch (err) {
    console.error('[AspirationCheck] Catch Error:', err);
    return true; // Fail-safe fallback
  }
}

export async function submitAspirationFeedback(payload: AspirationPayload): Promise<void> {
  const normalizedPayload = {
    ...payload,
    nrp: payload.nrp.trim().toLowerCase(),
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('aspiration_feedbacks')
    .insert([normalizedPayload]);

  if (error) {
    console.error('Error submitting aspiration to Supabase:', error);
    throw error;
  }
}