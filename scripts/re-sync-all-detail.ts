import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runReSyncAll() {
  console.log('🚀 Memulai Full Re-Sync (Courses, Tasks, Materials, dan Data Lengkap)...\n');

  // 1. COURSES / JADWAL / KONTAK DOSEN & PJ
  try {
    const coursesSnap = await getDocs(collection(db, 'courses'));
    console.log(`📦 Memproses ${coursesSnap.size} data courses/kontak...`);

    for (const docSnap of coursesSnap.docs) {
      const data = docSnap.data();

      const scheduleDay =
        data.scheduleDay ||
        (data.scheduleDayTime
          ? String(data.scheduleDayTime).split(',')[0]?.trim()
          : 'Senin');

      const scheduleTime =
        data.scheduleTime ||
        (data.scheduleDayTime
          ? String(data.scheduleDayTime).split(',').slice(1).join(',').trim()
          : '');

      const courseName = data.course || data.name || '';
      const pj = data.pjName || data.pj_matkul || '';
      const pjTel = data.pjPhone || data.pj_phone || '';

      await supabase.from('courses').upsert({
        id: docSnap.id,
        code: data.code || '',
        name: courseName,
        lecturer: data.lecturerName || data.lecturer || '',
        lecturer_phone: data.lecturerPhone || data.lecturer_phone || '',
        lecturer2: data.lecturerName2 || data.lecturer2 || '',
        lecturer_phone2: data.lecturerPhone2 || data.lecturer_phone2 || '',
        pj_name: pj,
        pj_matkul: pj,
        pj_phone: pjTel,
        room: data.room || '',
        day: scheduleDay,
        time: scheduleTime,
        schedule_day_time: data.scheduleDayTime || `${scheduleDay}, ${scheduleTime}`,
        attendance_url: data.attendanceUrl || data.attendance_url || '',
        credits: Number(data.sks || data.credits) || 0,
        created_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('❌ Gagal sync courses:', err);
  }

  // 2. TASKS / MANAJEMEN TUGAS
  try {
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    console.log(`📦 Memproses ${tasksSnap.size} data tugas...`);

    for (const docSnap of tasksSnap.docs) {
      const data = docSnap.data();
      const courseVal = data.course || data.course_name || data.courseName || '';

      await supabase.from('tasks').upsert({
        id: docSnap.id,
        title: data.title || '',
        course: courseVal,
        course_name: courseVal,
        description: data.description || '',
        type: data.type === 'Kelompok' ? 'Kelompok' : 'Individu',
        assigner: data.assigner || '',
        deadline: data.deadline || '',
        status: data.status || 'todo',
        priority: data.priority || 'Medium',
        classroom_url: data.classroomUrl || data.classroom_url || null,
        attachment: data.attachment || null,
        created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('❌ Gagal sync tasks:', err);
  }

  // 3. MATERIALS / BANK MATERI PDF
  try {
    const materialsSnap = await getDocs(collection(db, 'materials'));
    console.log(`📦 Memproses ${materialsSnap.size} berkas materi...`);

    for (const docSnap of materialsSnap.docs) {
      const data = docSnap.data();
      await supabase.from('materials').upsert({
        id: docSnap.id,
        course_id: data.courseId || data.course_id || '',
        course_name: data.courseName || data.course_name || '',
        session: data.session || '',
        title: data.title || '',
        file_url: data.fileUrl || data.file_url || '',
        file_type: data.fileType || data.file_type || 'pdf',
        file_size: data.fileSize || data.file_size || '3.0 MB',
        upload_date: data.uploadDate || data.upload_date || new Date().toISOString(),
        uploader: data.uploader || 'Pengurus Kelas A',
        description: data.description || '',
        created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('❌ Gagal sync materials:', err);
  }

  console.log('\n✨ Re-Sync Firestore ke Supabase 100% SELESAI!');
}

runReSyncAll();