import {
  AppState,
  Task,
  Contact,
  MaterialFile,
  Announcement,
  GroupResult,
} from '../types';

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
} from 'firebase/firestore';

import { db } from './firebase';


// ============================================================
// APP STATE
// ============================================================

export async function fetchAppState(): Promise<AppState | null> {
  try {
    const res = await fetch('/api/state');

    if (!res.ok) {
      throw new Error('Failed to fetch state');
    }

    return await res.json();
  } catch (err) {
    console.error('API fetchAppState error:', err);
    return null;
  }
}

export async function resetAppState(): Promise<AppState | null> {
  try {
    const res = await fetch('/api/reset', {
      method: 'POST',
    });

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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(announcement),
    });

    const data = await res.json();

    return data.state;
  } catch (err) {
    console.error('API addAnnouncement error:', err);
    return null;
  }
}

export async function deleteAnnouncementApi(
  id: string
): Promise<AppState | null> {
  try {
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    return data.state;
  } catch (err) {
    console.error('API deleteAnnouncement error:', err);
    return null;
  }
}


// ============================================================
// COURSES / KONTAK
// ============================================================

export async function addContactApi(
  contact: Omit<Contact, 'id'>
): Promise<AppState | null> {
  try {
    await addDoc(collection(db, 'courses'), contact);

    return null;
  } catch (err) {
    console.error('Firebase addContact error:', err);
    throw err;
  }
}

export async function updateContactApi(
  id: string,
  contact: Partial<Contact>
): Promise<AppState | null> {
  try {
    const courseRef = doc(db, 'courses', id);

    await updateDoc(courseRef, contact);

    return null;
  } catch (err) {
    console.error('Firebase updateContact error:', err);
    throw err;
  }
}

export async function deleteContactApi(
  id: string
): Promise<AppState | null> {
  try {
    const courseRef = doc(db, 'courses', id);

    await deleteDoc(courseRef);

    return null;
  } catch (err) {
    console.error('Firebase deleteContact error:', err);
    throw err;
  }
}


// ============================================================
// MATERIALS
// ============================================================

export async function addMaterialApi(
  material: Omit<MaterialFile, 'id' | 'uploadDate'>
): Promise<AppState | null> {
  try {
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(material),
    });

    const data = await res.json();

    return data.state;
  } catch (err) {
    console.error('API addMaterial error:', err);
    return null;
  }
}

export async function deleteMaterialApi(
  id: string
): Promise<AppState | null> {
  try {
    const res = await fetch(`/api/materials/${id}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    return data.state;
  } catch (err) {
    console.error('API deleteMaterial error:', err);
    return null;
  }
}


// ============================================================
// TASKS — FIREBASE
// ============================================================

export async function addTaskApi(
  task: Omit<Task, 'id'>
): Promise<AppState | null> {
  try {
    await addDoc(collection(db, 'tasks'), task);

    return null;
  } catch (err) {
    console.error('Firebase addTask error:', err);

    // Lempar error supaya App.tsx tahu kalau Firebase gagal
    throw err;
  }
}

export async function updateTaskApi(
  id: string,
  updates: Partial<Task>
): Promise<AppState | null> {
  try {
    const taskRef = doc(db, 'tasks', id);

    await updateDoc(taskRef, updates);

    return null;
  } catch (err) {
    console.error('Firebase updateTask error:', err);

    throw err;
  }
}

export async function deleteTaskApi(
  id: string
): Promise<AppState | null> {
  try {
    const taskRef = doc(db, 'tasks', id);

    await deleteDoc(taskRef);

    return null;
  } catch (err) {
    console.error('Firebase deleteTask error:', err);

    throw err;
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
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
// MATERIAL BOOKMARKS PER USER (NRP) — FIREBASE
// ============================================================

const MATERIAL_BOOKMARKS_COLLECTION = 'mbud_user_material_bookmarks';

/**
 * Mendengarkan daftar ID materi yang DIBOOKMARK oleh NRP terkait secara Realtime
 */
export function subscribeUserMaterialBookmarks(userNrp: string, callback: (bookmarkedMaterialIds: string[]) => void) {
  const normalizedNrp = userNrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, MATERIAL_BOOKMARKS_COLLECTION),
    where('nrp', '==', normalizedNrp)
  );

  return onSnapshot(q, (snapshot) => {
    const bookmarkedIds = snapshot.docs.map((docSnap) => docSnap.data().materialId as string);
    callback(bookmarkedIds);
  });
}

/**
 * Toggle Bookmark / Unbookmark materi per NRP
 */
export async function toggleMaterialBookmark(userNrp: string, materialId: string, isBookmarked: boolean): Promise<void> {
  const normalizedNrp = userNrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') {
    throw new Error('NRP tidak valid. Harap login terlebih dahulu.');
  }

  const docId = `${normalizedNrp}_${materialId}`;
  const docRef = doc(db, MATERIAL_BOOKMARKS_COLLECTION, docId);

  if (isBookmarked) {
    await setDoc(docRef, {
      nrp: normalizedNrp,
      materialId,
      bookmarkedAt: serverTimestamp(),
    });
  } else {
    await deleteDoc(docRef);
  }
}