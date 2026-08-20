// src/services/streakService.ts
import {
  doc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // Format: "YYYY-MM-DD"
  weeklyActiveDays: number[]; // Index hari (0 = Min, 1 = Sen, ..., 6 = Sab)
}

export interface LeaderboardUser {
  nrp: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
}

const STORAGE_KEY = 'mymbud_user_streak';

export const getLocalStreak = (): UserStreak => {
  const defaultStreak: UserStreak = {
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: '',
    weeklyActiveDays: [new Date().getDay()],
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultStreak;
  } catch {
    return defaultStreak;
  }
};

export const syncUserStreak = async (
  userNrp: string,
  userName: string
): Promise<UserStreak> => {
  const today = new Date().toISOString().split('T')[0];
  const currentDayIndex = new Date().getDay();
  const normalizedNrp = userNrp.trim().toLowerCase();

  const cached = getLocalStreak();

  // Jika hari ini sudah terhitung di cache lokal, 0 READ & 0 WRITE ke Firestore
  if (cached.lastActiveDate === today) {
    return cached;
  }

  let newCurrent = cached.currentStreak;
  let newLongest = cached.longestStreak || 1;
  let newWeeklyDays = [...(cached.weeklyActiveDays || [])];

  if (!cached.lastActiveDate) {
    newCurrent = 1;
    newLongest = 1;
    newWeeklyDays = [currentDayIndex];
  } else {
    const lastDate = new Date(cached.lastActiveDate);
    const currDate = new Date(today);
    const diffTime = currDate.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      newCurrent += 1;
      if (!newWeeklyDays.includes(currentDayIndex)) {
        newWeeklyDays.push(currentDayIndex);
      }
    } else if (diffDays > 1) {
      newCurrent = 1;
      newWeeklyDays = [currentDayIndex];
    }

    if (newCurrent > newLongest) {
      newLongest = newCurrent;
    }
  }

  const updatedStreak: UserStreak = {
    currentStreak: newCurrent,
    longestStreak: newLongest,
    lastActiveDate: today,
    weeklyActiveDays: newWeeklyDays,
  };

  // Simpan ke LocalStorage seketika
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStreak));

  // Sync ke Firestore di latar belakang jika ada NRP valid (Hanya 1x per hari)
  if (normalizedNrp && normalizedNrp !== 'unknown') {
    try {
      const streakRef = doc(db, 'user_streaks', normalizedNrp);
      await setDoc(
        streakRef,
        {
          nrp: normalizedNrp,
          name: userName,
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastActiveDate: today,
          weeklyActiveDays: newWeeklyDays,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[Streak] Gagal sinkronisasi Firestore:', err);
    }
  }

  return updatedStreak;
};

export const fetchStreakLeaderboard = async (): Promise<LeaderboardUser[]> => {
  try {
    const q = query(
      collection(db, 'user_streaks'),
      orderBy('currentStreak', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    const leaderboard: LeaderboardUser[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      leaderboard.push({
        nrp: data.nrp || docSnap.id,
        name: data.name || 'Mbuders',
        currentStreak: data.currentStreak || 1,
        longestStreak: data.longestStreak || 1,
      });
    });

    return leaderboard;
  } catch (err) {
    console.error('[Streak] Gagal mengambil leaderboard:', err);
    return [];
  }
};