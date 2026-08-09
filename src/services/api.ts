import {
  AppState,
  Task,
  Contact,
  MaterialFile,
  Announcement,
  GroupResult,
} from '../types';[cite: 4]

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';[cite: 4]

import { db } from './firebase';[cite: 4]


// ============================================================
// APP STATE
// ============================================================

export async function fetchAppState(): Promise<AppState | null> {
  try {
    const res = await fetch('/api/state');[cite: 4]

    if (!res.ok) {
      throw new Error('Failed to fetch state');[cite: 4]
    }

    return await res.json();[cite: 4]
  } catch (err) {
    console.error('API fetchAppState error:', err);[cite: 4]
    return null;[cite: 4]
  }
}

export async function resetAppState(): Promise<AppState | null> {
  try {
    const res = await fetch('/api/reset', {[cite: 4]
      method: 'POST',[cite: 4]
    });

    const data = await res.json();[cite: 4]

    return data.state || data.data;[cite: 4]
  } catch (err) {
    console.error('API reset error:', err);[cite: 4]
    return null;[cite: 4]
  }
}


// ============================================================
// ANNOUNCEMENTS
// ============================================================

export async function addAnnouncementApi(
  announcement: Omit<Announcement, 'id' | 'date'>
): Promise<AppState | null> {
  try {
    const res = await fetch('/api/announcements', {[cite: 4]
      method: 'POST',[cite: 4]
      headers: {
        'Content-Type': 'application/json',[cite: 4]
      },
      body: JSON.stringify(announcement),[cite: 4]
    });

    const data = await res.json();[cite: 4]

    return data.state;[cite: 4]
  } catch (err) {
    console.error('API addAnnouncement error:', err);[cite: 4]
    return null;[cite: 4]
  }
}

export async function deleteAnnouncementApi(
  id: string
): Promise<AppState | null> {
  try {
    const res = await fetch(`/api/announcements/${id}`, {[cite: 4]
      method: 'DELETE',[cite: 4]
    });

    const data = await res.json();[cite: 4]

    return data.state;[cite: 4]
  } catch (err) {
    console.error('API deleteAnnouncement error:', err);[cite: 4]
    return null;[cite: 4]
  }
}


// ============================================================
// COURSES / KONTAK
// ============================================================

export async function addContactApi(
  contact: Omit<Contact, 'id'>
): Promise<AppState | null> {
  try {
    await addDoc(collection(db, 'courses'), contact);[cite: 4]

    return null;[cite: 4]
  } catch (err) {
    console.error('Firebase addContact error:', err);[cite: 4]
    throw err;[cite: 4]
  }
}

export async function updateContactApi(
  id: string,
  contact: Partial<Contact>
): Promise<AppState | null> {
  try {
    const courseRef = doc(db, 'courses', id);[cite: 4]

    await updateDoc(courseRef, contact);[cite: 4]

    return null;[cite: 4]
  } catch (err) {
    console.error('Firebase updateContact error:', err);[cite: 4]
    throw err;[cite: 4]
  }
}

export async function deleteContactApi(
  id: string
): Promise<AppState | null> {
  try {
    const courseRef = doc(db, 'courses', id);[cite: 4]

    await deleteDoc(courseRef);[cite: 4]

    return null;[cite: 4]
  } catch (err) {
    console.error('Firebase deleteContact error:', err);[cite: 4]
    throw err;[cite: 4]
  }
}


// ============================================================
// MATERIALS
// ============================================================

export async function addMaterialApi(
  material: Omit<MaterialFile, 'id' | 'uploadDate'>
): Promise<AppState | null> {
  try {
    const res = await fetch('/api/materials', {[cite: 4]
      method: 'POST',[cite: 4]
      headers: {
        'Content-Type': 'application/json',[cite: 4]
      },
      body: JSON.stringify(material),[cite: 4]
    });

    const data = await res.json();[cite: 4]

    return data.state;[cite: 4]
  } catch (err) {
    console.error('API addMaterial error:', err);[cite: 4]
    return null;[cite: 4]
  }
}

export async function deleteMaterialApi(
  id: string
): Promise<AppState | null> {
  try {
    const res = await fetch(`/api/materials/${id}`, {[cite: 4]
      method: 'DELETE',[cite: 4]
    });

    const data = await res.json();[cite: 4]

    return data.state;[cite: 4]
  } catch (err) {
    console.error('API deleteMaterial error:', err);[cite: 4]
    return null;[cite: 4]
  }
}


// ============================================================
// TASKS — FIREBASE
// ============================================================

export async function addTaskApi(
  task: Omit<Task, 'id'>
): Promise<AppState | null> {
  try {
    await addDoc(collection(db, 'tasks'), task);[cite: 4]

    return null;[cite: 4]
  } catch (err) {
    console.error('Firebase addTask error:', err);[cite: 4]

    // Lempar error supaya App.tsx tahu kalau Firebase gagal
    throw err;[cite: 4]
  }
}

export async function updateTaskApi(
  id: string,
  updates: Partial<Task>
): Promise<AppState | null> {
  try {
    const taskRef = doc(db, 'tasks', id);[cite: 4]

    await updateDoc(taskRef, updates);[cite: 4]

    return null;[cite: 4]
  } catch (err) {
    console.error('Firebase updateTask error:', err);[cite: 4]

    throw err;[cite: 4]
  }
}

export async function deleteTaskApi(
  id: string
): Promise<AppState | null> {
  try {
    const taskRef = doc(db, 'tasks', id);[cite: 4]

    await deleteDoc(taskRef);[cite: 4]

    return null;[cite: 4]
  } catch (err) {
    console.error('Firebase deleteTask error:', err);[cite: 4]

    throw err;[cite: 4]
  }
}


// ============================================================
// TASK COMPLETIONS PER USER (NRP) — FIREBASE
// ============================================================

const TASK_COMPLETIONS_COLLECTION = 'mbud_user_task_completions';

/**
 * Mendengarkan daftar ID tugas yang SUDAH DICENTANG SELESAI oleh NRP terkait secara Realtime
 */
export function subscribeUserTaskCompletions(userNrp: string, callback: (completedTaskIds: string[]) => void) {
  const normalizedNrp = userNrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, TASK_COMPLETIONS_COLLECTION),
    where('nrp', '==', normalizedNrp)
  );

  return onSnapshot(q, (snapshot) => {
    const completedIds = snapshot.docs.map((docSnap) => docSnap.data().taskId as string);
    callback(completedIds);
  });
}

/**
 * Toggle Centang / Uncentang status selesai tugas per NRP
 */
export async function toggleTaskCompletion(userNrp: string, taskId: string, isCompleted: boolean): Promise<void> {
  const normalizedNrp = userNrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') {
    throw new Error('NRP tidak valid. Harap login terlebih dahulu.');
  }

  const docId = `${normalizedNrp}_${taskId}`;
  const docRef = doc(db, TASK_COMPLETIONS_COLLECTION, docId);

  if (isCompleted) {
    await setDoc(docRef, {
      nrp: normalizedNrp,
      taskId,
      completedAt: serverTimestamp(),
    });
  } else {
    await deleteDoc(docRef);
  }
}


// ============================================================
// GROUP RESULTS
// ============================================================

export async function saveGroupResultApi(
  groupResult: Omit<GroupResult, 'id' | 'createdAt'>
): Promise<AppState | null> {
  try {
    const res = await fetch('/api/groups', {[cite: 4]
      method: 'POST',[cite: 4]
      headers: {
        'Content-Type': 'application/json',[cite: 4]
      },
      body: JSON.stringify(groupResult),[cite: 4]
    });

    const data = await res.json();[cite: 4]

    return data.state;[cite: 4]
  } catch (err) {
    console.error('API saveGroupResult error:', err);[cite: 4]
    return null;[cite: 4]
  }
}