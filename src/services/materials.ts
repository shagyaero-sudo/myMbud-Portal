// src/services/materials.ts
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { MaterialFile } from '../types';

const MATERIALS_COLLECTION = 'materials';

// 1. Fetch seluruh materi dari Firestore
export const fetchMaterials = async (): Promise<MaterialFile[]> => {
  try {
    const q = query(
      collection(db, MATERIALS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        courseId: data.courseId || '',
        courseName: data.courseName || '',
        session: data.session || '',
        title: data.title || '',
        fileUrl: data.fileUrl || '',
        fileType: 'pdf',
        fileSize: data.fileSize || '3.0 MB',
        uploadDate: data.uploadDate || new Date().toISOString(),
        uploader: data.uploader || 'Pengurus Kelas A',
        description: data.description || '',
      };
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return [];
  }
};

// 2. Tambah materi baru ke Firestore
export const addMaterialToFirestore = async (
  material: Omit<MaterialFile, 'id' | 'uploadDate'>
) => {
  const docRef = await addDoc(collection(db, MATERIALS_COLLECTION), {
    ...material,
    uploadDate: new Date().toISOString(),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

// 3. Hapus materi dari Firestore
export const deleteMaterialFromFirestore = async (id: string) => {
  const docRef = doc(db, MATERIALS_COLLECTION, id);
  await deleteDoc(docRef);
};