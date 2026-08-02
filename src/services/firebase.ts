// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Mengambil kunci dari brankas .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inisialisasi Aplikasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Layanan yang akan kita pakai
export const db = getFirestore(app); // Untuk Database Dosen & Tugas
export const auth = getAuth(app);    // Untuk Login Pengurus/Admin
export const analytics = getAnalytics(app); // Untuk memantau trafik web

export default app;