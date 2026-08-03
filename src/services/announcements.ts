// src/services/announcements.ts
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Announcement } from '../types';

const ANNOUNCEMENTS_COLLECTION = 'announcements';

// 1. Real-time Subscription ke Firestore (Query tunggal tanpa perlu Composite Index)
export const subscribeAnnouncements = (
  callback: (announcements: Announcement[]) => void
) => {
  const q = query(
    collection(db, ANNOUNCEMENTS_COLLECTION),
    orderBy('date', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Announcement[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || '',
          content: data.content || '',
          date: data.date || new Date().toISOString().split('T')[0],
          category: data.category || 'Penting',
          author: data.author || 'Pengurus Kelas',
          pinned: Boolean(data.pinned),
        };
      });

      // Sorting Pinned secara manual di JS biar gak butuh Composite Index Firebase
      list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

      callback(list);
    },
    (error) => {
      console.error('Error subscribe announcements:', error);
    }
  );
};

// 2. Tambah Pengumuman Baru
export const addAnnouncement = async (
  announcement: Omit<Announcement, 'id' | 'date'>
) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const docRef = await addDoc(collection(db, ANNOUNCEMENTS_COLLECTION), {
    ...announcement,
    date: todayStr,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

// 3. Update / Edit Pengumuman
export const updateAnnouncement = async (
  id: string,
  updatedData: Partial<Omit<Announcement, 'id'>>
) => {
  const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updatedData,
    updatedAt: Timestamp.now(),
  });
};

// 4. Hapus Pengumuman
export const deleteAnnouncement = async (id: string) => {
  const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
  await deleteDoc(docRef);
};