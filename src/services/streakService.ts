import { supabase } from './supabase';

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  weeklyActiveDays: number[];
  reviveQuota: number;
  reviveMonth?: string;
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
  const today = getLocalDateString();
  const currentMonthKey = getLocalMonthString();
  const currentDayIndex = new Date().getDay();
  const normalizedNrp = userNrp.trim().toLowerCase();

  let baseStreak = getLocalStreak();

  if (normalizedNrp && normalizedNrp !== 'unknown') {
    try {
      const { data } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('nrp', normalizedNrp)
        .maybeSingle();

      if (data) {
        baseStreak = {
          currentStreak: data.current_streak || 1,
          longestStreak: data.longest_streak || 1,
          lastActiveDate: data.last_active_date || '',
          weeklyActiveDays: data.weekly_active_days || [currentDayIndex],
          reviveQuota: typeof data.revive_quota === 'number' ? data.revive_quota : 3,
          reviveMonth: data.revive_month || currentMonthKey,
          canRevive: false,
          previousBrokenStreak: 0,
        };
      }
    } catch (err) {
      console.warn('[Streak] Gagal membaca streak dari Supabase:', err);
    }
  }

  const lastSeenPopupDate = localStorage.getItem(POPUP_SEEN_KEY);
  const isFirstVisitToday = lastSeenPopupDate !== today;

  let reviveQuota = typeof baseStreak.reviveQuota === 'number' ? baseStreak.reviveQuota : 3;
  if (baseStreak.reviveMonth !== currentMonthKey) {
    reviveQuota = 3;
  }

  if (baseStreak.lastActiveDate === today) {
    if (isFirstVisitToday) {
      localStorage.setItem(POPUP_SEEN_KEY, today);
    }
    const syncedCached: UserStreak = {
      ...baseStreak,
      reviveQuota,
      reviveMonth: currentMonthKey,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedCached));
    return { streak: syncedCached, isFirstVisitToday };
  }

  let newCurrent = baseStreak.currentStreak;
  let newLongest = baseStreak.longestStreak || 1;
  let newWeeklyDays = [...(baseStreak.weeklyActiveDays || [])];
  let canRevive = false;
  let previousBrokenStreak = baseStreak.previousBrokenStreak || 0;

  if (!baseStreak.lastActiveDate) {
    newCurrent = 1;
    newLongest = 1;
    newWeeklyDays = [currentDayIndex];
  } else {
    const [ly, lm, ld] = baseStreak.lastActiveDate.split('-').map(Number);
    const [ty, tm, td] = today.split('-').map(Number);

    const lastDate = new Date(ly, lm - 1, ld);
    const currDate = new Date(ty, tm - 1, td);

    const diffTime = currDate.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      newCurrent += 1;
      canRevive = false;
      if (!newWeeklyDays.includes(currentDayIndex)) {
        newWeeklyDays.push(currentDayIndex);
      }
    } else if (diffDays > 1) {
      previousBrokenStreak = baseStreak.currentStreak;
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
      await supabase.from('user_streaks').upsert({
        nrp: normalizedNrp,
        name: userName,
        current_streak: newCurrent,
        longest_streak: newLongest,
        last_active_date: today,
        weekly_active_days: newWeeklyDays,
        revive_quota: reviveQuota,
        revive_month: currentMonthKey,
        last_checked_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Streak] Gagal sinkronisasi Supabase:', err);
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
      await supabase.from('user_streaks').upsert({
        nrp: normalizedNrp,
        name: userName,
        current_streak: restoredStreakCount,
        longest_streak: updatedStreak.longestStreak,
        revive_quota: newQuota,
        revive_month: currentMonthKey,
        last_active_date: today,
        last_checked_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Streak] Gagal update revive ke Supabase:', err);
    }
  }

  return updatedStreak;
};

export const fetchStreakLeaderboard = async (): Promise<LeaderboardUser[]> => {
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('nrp, name, current_streak, longest_streak')
      .order('current_streak', { ascending: false })
      .order('last_checked_in_at', { ascending: true })
      .limit(20);

    if (error || !data) return [];

    return data.map((item) => ({
      nrp: item.nrp,
      name: item.name || 'Mbuders',
      currentStreak: item.current_streak || 1,
      longestStreak: item.longest_streak || 1,
    }));
  } catch (err) {
    console.error('[Streak] Gagal mengambil leaderboard:', err);
    return [];
  }
};