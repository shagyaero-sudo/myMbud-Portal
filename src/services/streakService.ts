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
  lastActiveDate: string; // Format: "YYYY-MM-DD" (Local Timezone)
  weeklyActiveDays: number[]; // Index hari (0 = Min, 1 = Sen, ..., 6 = Sab)
  reviveQuota: number; // 3x jatah per bulan
  reviveMonth?: string; // Format: "YYYY-MM"
  previousBrokenStreak?: number;
  canRevive?: boolean;
}

export interface SyncStreakResult {
  streak: UserStreak;
  isFirstVisitToday: boolean;
}

export interface LeaderboardUser {
  nrp: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
}

const STORAGE_KEY = 'mymbud_user_streak_v1';
const POPUP_SEEN_KEY = 'mymbud_streak_popup_seen_date';

// HELPER: Tanggal & Bulan berdasarkan Waktu Lokal (WIB / Perangkat)
const getLocalDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalMonthString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getLocalStreak = (): UserStreak => {
  const currentMonthKey = getLocalMonthString();
  const defaultStreak: UserStreak = {
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: '',
    weeklyActiveDays: [new Date().getDay()],
    reviveQuota: 3,
    reviveMonth: currentMonthKey,
    canRevive: false,
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultStreak;

    const parsed: UserStreak = JSON.parse(saved);

    // Auto reset kuota jadi 3x jika sudah masuk bulan baru
    if (parsed.reviveMonth !== currentMonthKey) {
      parsed.reviveQuota = 3;
      parsed.reviveMonth = currentMonthKey;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch {
    return defaultStreak;
  }
};

export const syncUserStreak = async (
  userNrp: string,
  userName: string
): Promise<SyncStreakResult> => {
  const today = getLocalDateString(); // Fix: Waktu lokal hari ini
  const currentMonthKey = getLocalMonthString();
  const currentDayIndex = new Date().getDay();
  const normalizedNrp = userNrp.trim().toLowerCase();

  const cached = getLocalStreak();
  const lastSeenPopupDate = localStorage.getItem(POPUP_SEEN_KEY);
  const isFirstVisitToday = lastSeenPopupDate !== today;

  let reviveQuota = typeof cached.reviveQuota === 'number' ? cached.reviveQuota : 3;
  if (cached.reviveMonth !== currentMonthKey) {
    reviveQuota = 3;
  }

  // Jika hari ini sudah tercatat di cache lokal (0 READ & 0 WRITE)
  if (cached.lastActiveDate === today) {
    if (isFirstVisitToday) {
      localStorage.setItem(POPUP_SEEN_KEY, today);
    }
    const syncedCached: UserStreak = {
      ...cached,
      reviveQuota,
      reviveMonth: currentMonthKey,
    };
    return { streak: syncedCached, isFirstVisitToday };
  }

  let newCurrent = cached.currentStreak;
  let newLongest = cached.longestStreak || 1;
  let newWeeklyDays = [...(cached.weeklyActiveDays || [])];
  let canRevive = false;
  let previousBrokenStreak = cached.previousBrokenStreak || 0;

  if (!cached.lastActiveDate) {
    newCurrent = 1;
    newLongest = 1;
    newWeeklyDays = [currentDayIndex];
  } else {
    const [ly, lm, ld] = cached.lastActiveDate.split('-').map(Number);
    const [ty, tm, td] = today.split('-').map(Number);

    const lastDate = new Date(ly, lm - 1, ld);
    const currDate = new Date(ty, tm - 1, td);

    const diffTime = currDate.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      // Normal berturut-turut
      newCurrent += 1;
      canRevive = false;
      if (!newWeeklyDays.includes(currentDayIndex)) {
        newWeeklyDays.push(currentDayIndex);
      }
    } else if (diffDays > 1) {
      // Terputus: Simpan streak terakhir sebelum reset ke 1
      previousBrokenStreak = cached.currentStreak;
      canRevive = reviveQuota > 0 && previousBrokenStreak > 1;
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
    reviveQuota,
    reviveMonth: currentMonthKey,
    canRevive,
    previousBrokenStreak,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStreak));
  localStorage.setItem(POPUP_SEEN_KEY, today);

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
          reviveQuota,
          reviveMonth: currentMonthKey,
          lastCheckedInAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[Streak] Gagal sinkronisasi Firestore:', err);
    }
  }

  return { streak: updatedStreak, isFirstVisitToday: true };
};

export const useStreakRevive = async (
  userNrp: string,
  userName: string
): Promise<UserStreak | null> => {
  const cached = getLocalStreak();

  if (!cached.canRevive || !cached.previousBrokenStreak || cached.reviveQuota <= 0) {
    return null;
  }

  const normalizedNrp = userNrp.trim().toLowerCase();
  const today = getLocalDateString();
  const currentMonthKey = getLocalMonthString();

  const restoredStreakCount = cached.previousBrokenStreak;
  const newQuota = cached.reviveQuota - 1;

  const updatedStreak: UserStreak = {
    ...cached,
    currentStreak: restoredStreakCount,
    longestStreak: Math.max(cached.longestStreak, restoredStreakCount),
    reviveQuota: newQuota,
    reviveMonth: currentMonthKey,
    canRevive: false,
    previousBrokenStreak: 0,
    lastActiveDate: today,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStreak));

  if (normalizedNrp && normalizedNrp !== 'unknown') {
    try {
      const streakRef = doc(db, 'user_streaks', normalizedNrp);
      await setDoc(
        streakRef,
        {
          nrp: normalizedNrp,
          name: userName,
          currentStreak: restoredStreakCount,
          longestStreak: updatedStreak.longestStreak,
          reviveQuota: newQuota,
          reviveMonth: currentMonthKey,
          lastActiveDate: today,
          lastCheckedInAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[Streak] Gagal update revive ke Firestore:', err);
    }
  }

  return updatedStreak;
};

export const fetchStreakLeaderboard = async (): Promise<LeaderboardUser[]> => {
  try {
    const q = query(
      collection(db, 'user_streaks'),
      orderBy('currentStreak', 'desc'),
      orderBy('lastCheckedInAt', 'asc'),
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
  } catch (err: any) {
    console.warn('[Streak] Fallback ke single index leaderboard:', err?.message);
    try {
      const fallbackQuery = query(
        collection(db, 'user_streaks'),
        orderBy('currentStreak', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(fallbackQuery);
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
    } catch (fallbackErr) {
      console.error('[Streak] Gagal mengambil leaderboard:', fallbackErr);
      return [];
    }
  }
};