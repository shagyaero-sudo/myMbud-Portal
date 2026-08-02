import { AppState, Task, Contact, MaterialFile, Announcement, ScheduleItem, GroupResult } from '../types';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase'; // Pastikan path ini sesuai

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

export async function addAnnouncementApi(announcement: Omit<Announcement, 'id' | 'date'>): Promise<AppState | null> {
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

// --- FIREBASE INTEGRATION UNTUK COURSES / KONTAK ---

export async function addContactApi(contact: Omit<Contact, 'id'>): Promise<AppState | null> {
  try {
    await addDoc(collection(db, 'courses'), contact);
    // Mengembalikan null agar App.tsx mengandalkan sinkronisasi berkala (polling) untuk memperbarui layar
    return null; 
  } catch (err) {
    console.error('Firebase addContact error:', err);
    return null;
  }
}

export async function updateContactApi(id: string, contact: Partial<Contact>): Promise<AppState | null> {
  try {
    const courseRef = doc(db, 'courses', id);
    await updateDoc(courseRef, contact);
    return null;
  } catch (err) {
    console.error('Firebase updateContact error:', err);
    return null;
  }
}

export async function deleteContactApi(id: string): Promise<AppState | null> {
  try {
    const courseRef = doc(db, 'courses', id);
    await deleteDoc(courseRef);
    return null;
  } catch (err) {
    console.error('Firebase deleteContact error:', err);
    return null;
  }
}

// --- AKHIR FIREBASE INTEGRATION ---

export async function addMaterialApi(material: Omit<MaterialFile, 'id' | 'uploadDate'>): Promise<AppState | null> {
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

export async function addTaskApi(task: Omit<Task, 'id'>): Promise<AppState | null> {
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    const data = await res.json();
    return data.state;
  } catch (err) {
    console.error('API addTask error:', err);
    return null;
  }
}

export async function updateTaskApi(id: string, task: Partial<Task>): Promise<AppState | null> {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    const data = await res.json();
    return data.state;
  } catch (err) {
    console.error('API updateTask error:', err);
    return null;
  }
}

export async function deleteTaskApi(id: string): Promise<AppState | null> {
  try {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.state;
  } catch (err) {
    console.error('API deleteTask error:', err);
    return null;
  }
}

export async function saveGroupResultApi(groupResult: Omit<GroupResult, 'id' | 'createdAt'>): Promise<AppState | null> {
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