import { supabase } from './supabase';

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  activeDates: string[];
  daysMissedToday?: number;
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
  lastActiveDate: string;
  lastCheckedInAt?: string;
}

const STORAGE_KEY = 'mymbud_user_streak_v2';
const POPUP_SEEN_KEY = 'mymbud_streak_popup_seen_date';

const emitStreakChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mbud_streak_change'));
  }
};

const getLocalDateString = (dateObj = new Date()): string => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalStreak = (): UserStreak => {
  const today = getLocalDateString();
  const defaultStreak: UserStreak = {
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: today,
    activeDates: [today],
    daysMissedToday: 0,
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultStreak;
    return JSON.parse(saved);
  } catch {
    return defaultStreak;
  }
};

export const syncUserStreak = async (
  userNrp: string,
  userName: string
): Promise<SyncStreakResult> => {
  const today = getLocalDateString();
  const normalizedNrp = userNrp.trim().toLowerCase();

  let baseStreak = getLocalStreak();
  let supabaseDataLoaded = false;

  // 1. Dapatkan data terbaru dari Supabase
  if (normalizedNrp && normalizedNrp !== 'unknown') {
    try {
      const { data } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('nrp', normalizedNrp)
        .maybeSingle();

      if (data) {
        supabaseDataLoaded = true;
        baseStreak = {
          currentStreak: data.current_streak || 1,
          longestStreak: data.longest_streak || data.current_streak || 1,
          lastActiveDate: data.last_active_date || '',
          activeDates: Array.isArray(data.active_dates)
            ? data.active_dates
            : (data.last_active_date ? [data.last_active_date] : []),
        };
      }
    } catch (err) {
      console.warn('[Streak] Gagal membaca streak dari Supabase:', err);
    }
  }

  // Cek apakah di device INI hari ini sudah pernah muncul popup
  const lastSeenPopupDate = localStorage.getItem(POPUP_SEEN_KEY);
  const isFirstVisitOnThisDevice = lastSeenPopupDate !== today;

  // 2. KUNCI PERBAIKAN: Jika lastActiveDate (dari Supabase / Local) SUDAH TANGGAL HARI INI
  // Berarti user SUDAH klaim streak hari ini di device manapun. JANGAN TAMBAH +1 LAGI!
  if (baseStreak.lastActiveDate === today) {
    if (isFirstVisitOnThisDevice) {
      localStorage.setItem(POPUP_SEEN_KEY, today);
    }
    const resultStreak = { ...baseStreak, daysMissedToday: 0 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resultStreak));
    emitStreakChange();

    // Pastikan data profil nama/timestamp di Supabase tetep sinkron tanpa nambah streak
    if (normalizedNrp && normalizedNrp !== 'unknown' && supabaseDataLoaded) {
      supabase.from('user_streaks').upsert({
        nrp: normalizedNrp,
        name: userName,
        current_streak: resultStreak.currentStreak,
        longest_streak: resultStreak.longestStreak,
        last_active_date: today,
        active_dates: resultStreak.activeDates,
        last_checked_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.warn('[Streak] Gagal update last_checked_in:', error);
      });
    }

    return { 
      streak: resultStreak, 
      isFirstVisitToday: isFirstVisitOnThisDevice 
    };
  }

  // 3. Jika lastActiveDate BUKAN hari ini (Baru pertama kali login di hari yang baru)
  let currentVal = baseStreak.currentStreak || 1;
  let daysMissed = 0;

  if (baseStreak.lastActiveDate) {
    const [ly, lm, ld] = baseStreak.lastActiveDate.split('-').map(Number);
    const [ty, tm, td] = today.split('-').map(Number);
    const lastDate = new Date(ly, lm - 1, ld);
    const currDate = new Date(ty, tm - 1, td);

    const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays > 1) {
      daysMissed = diffDays - 1;
      currentVal = Math.max(1, currentVal - daysMissed);
    }
  }

  const newCurrent = currentVal + 1;
  let newActiveDates = Array.from(new Set([...(baseStreak.activeDates || []), today]));

  if (newActiveDates.length > 60) {
    newActiveDates = newActiveDates.slice(-60);
  }

  const updatedStreak: UserStreak = {
    currentStreak: newCurrent,
    longestStreak: Math.max(baseStreak.longestStreak || 0, newCurrent),
    lastActiveDate: today,
    activeDates: newActiveDates,
    daysMissedToday: daysMissed,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStreak));
  localStorage.setItem(POPUP_SEEN_KEY, today);
  emitStreakChange();

  if (normalizedNrp && normalizedNrp !== 'unknown') {
    try {
      await supabase.from('user_streaks').upsert({
        nrp: normalizedNrp,
        name: userName,
        current_streak: updatedStreak.currentStreak,
        longest_streak: updatedStreak.longestStreak,
        last_active_date: today,
        active_dates: updatedStreak.activeDates,
        last_checked_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Streak] Gagal sinkronisasi Supabase:', err);
    }
  }

  return { streak: updatedStreak, isFirstVisitToday: true };
};

export const fetchStreakLeaderboard = async (): Promise<LeaderboardUser[]> => {
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('nrp, name, current_streak, longest_streak, last_active_date, last_checked_in_at')
      .order('current_streak', { ascending: false })
      .order('last_checked_in_at', { ascending: true })
      .limit(45);

    if (error || !data) return [];

    return data.map((item) => ({
      nrp: item.nrp,
      name: item.name || 'Mbuders',
      currentStreak: item.current_streak || 1,
      longestStreak: item.longest_streak || item.current_streak || 1,
      lastActiveDate: item.last_active_date || '',
      lastCheckedInAt: item.last_checked_in_at || '',
    }));
  } catch (err) {
    console.error('[Streak] Gagal mengambil leaderboard:', err);
    return [];
  }
};