import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Inisialisasi Firebase Client
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

// Inisialisasi Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateData() {
  console.log('🚀 Memulai migrasi data dari Firestore ke Supabase...\n');

  // 1. MIGRASI MBUDIARY USERS
  try {
    const usersSnap = await getDocs(collection(db, 'mbudiary_users'));
    console.log(`📦 Memindahkan ${usersSnap.size} user mbudiary...`);
    for (const docSnap of usersSnap.docs) {
      const data = docSnap.data();
      await supabase.from('mbudiary_users').upsert({
        nrp: String(docSnap.id || data.nrp).toLowerCase(),
        username: String(data.username || 'mbuders').toLowerCase(),
        nickname: String(data.nickname || 'Mbuders'),
        is_officer: Boolean(data.isOfficer),
        emoji: String(data.emoji || '😊'),
        is_verified: Boolean(data.isVerified),
        photo_url: data.photoUrl || null,
        header_url: data.headerUrl || null,
        updated_at: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('❌ Gagal migrasi mbudiary_users:', err);
  }

  // 2. MIGRASI MBUDIARY POSTS
  try {
    const postsSnap = await getDocs(collection(db, 'mbudiary_posts'));
    console.log(`📦 Memindahkan ${postsSnap.size} postingan mbudiary...`);
    for (const docSnap of postsSnap.docs) {
      const data = docSnap.data();
      await supabase.from('mbudiary_posts').upsert({
        id: docSnap.id,
        author_nrp: String(data.authorNrp || 'unknown').toLowerCase(),
        content: data.content || '',
        likes: Array.isArray(data.likes) ? data.likes.map((l: string) => String(l).toLowerCase()) : [],
        reply_count: Number(data.replyCount) || 0,
        is_officer_post: Boolean(data.isOfficerPost),
        image_urls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
        is_repost: Boolean(data.isRepost),
        original_post_id: data.originalPostId || null,
        quote_content: data.quoteContent || null,
        created_at: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('❌ Gagal migrasi mbudiary_posts:', err);
  }

  // 3. MIGRASI MBUDIARY REPLIES
  try {
    const repliesSnap = await getDocs(collection(db, 'mbudiary_replies'));
    console.log(`📦 Memindahkan ${repliesSnap.size} balasan mbudiary...`);
    for (const docSnap of repliesSnap.docs) {
      const data = docSnap.data();
      await supabase.from('mbudiary_replies').upsert({
        id: docSnap.id,
        post_id: data.postId || '',
        author_nrp: String(data.authorNrp || 'unknown').toLowerCase(),
        content: data.content || '',
        created_at: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('❌ Gagal migrasi mbudiary_replies:', err);
  }

  // 4. MIGRASI MBUDIARY FOLLOWS
  try {
    const followsSnap = await getDocs(collection(db, 'mbudiary_follows'));
    console.log(`📦 Memindahkan ${followsSnap.size} data follows...`);
    for (const docSnap of followsSnap.docs) {
      const data = docSnap.data();
      await supabase.from('mbudiary_follows').upsert({
        id: docSnap.id,
        follower_nrp: String(data.followerNrp || '').toLowerCase(),
        target_nrp: String(data.targetNrp || '').toLowerCase(),
        created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('❌ Gagal migrasi mbudiary_follows:', err);
  }

  // 5. MIGRASI USER STREAKS
  try {
    const streaksSnap = await getDocs(collection(db, 'user_streaks'));
    console.log(`📦 Memindahkan ${streaksSnap.size} data user streak...`);
    for (const docSnap of streaksSnap.docs) {
      const data = docSnap.data();
      await supabase.from('user_streaks').upsert({
        nrp: String(data.nrp || docSnap.id).toLowerCase(),
        name: data.name || 'Mbuders',
        current_streak: Number(data.currentStreak) || 1,
        longest_streak: Number(data.longestStreak) || 1,
        last_active_date: data.lastActiveDate || '',
        weekly_active_days: Array.isArray(data.weeklyActiveDays) ? data.weeklyActiveDays : [],
        revive_quota: typeof data.reviveQuota === 'number' ? data.reviveQuota : 3,
        revive_month: data.reviveMonth || null,
        last_checked_in_at: data.lastCheckedInAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('❌ Gagal migrasi user_streaks:', err);
  }

  // 6. MIGRASI TASKS & COMPLETIONS
  try {
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    console.log(`📦 Memindahkan ${tasksSnap.size} tugas...`);
    for (const docSnap of tasksSnap.docs) {
      const data = docSnap.data();
      await supabase.from('tasks').upsert({
        id: docSnap.id,
        course_id: data.courseId || null,
        course_name: data.courseName || null,
        title: data.title || '',
        description: data.description || '',
        deadline: data.deadline || '',
        type: data.type || '',
        created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    }

    const taskCompletionsSnap = await getDocs(collection(db, 'mbud_user_task_completions'));
    console.log(`📦 Memindahkan ${taskCompletionsSnap.size} status centang tugas...`);
    for (const docSnap of taskCompletionsSnap.docs) {
      const data = docSnap.data();
      await supabase.from('mbud_user_task_completions').upsert({
        id: docSnap.id,
        nrp: String(data.nrp || '').toLowerCase(),
        task_id: data.taskId,
        completed_at: data.completedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('❌ Gagal migrasi tasks / task completions:', err);
  }

  console.log('\n✨ Migrasi data Firestore ke Supabase SELESAI!');
}

migrateData();