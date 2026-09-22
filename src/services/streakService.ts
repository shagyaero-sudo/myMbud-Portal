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

// v3: skema lama (v2) dihitung di client, sudah tidak reliable.
// Ganti key supaya cache lama yang berpotensi salah tidak ikut kepakai.
const STORAGE_KEY = 'mymbud_user_streak_v3';

// Menyimpan tanggal terakhir device ini SUKSES konfirmasi ke server.
// Ini kunci utama biar gak fetch berkali-kali dalam hari yang sama.
const SYNCED_DATE_KEY = 'mymbud_streak_synced_date';

// Jangan retry ke server lebih cepat dari ini kalau percobaan sebelumnya gagal.
const MIN_RETRY_INTERVAL_MS = 15_000;

// Cache leaderboard di memori, biar buka-tutup modal gak nembak Supabase tiap kali.
const LEADERBOARD_TTL_MS = 30_000;

// Ini variable in-memory (reset tiap reload halaman), cukup buat menahan
// retry storm dalam satu sesi pemakaian.
let lastSyncAttemptAt = 0;
let leaderboardCache: { data: LeaderboardUser[]; fetchedAt: number } | null = null;

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

/**
 * Baca cache lokal untuk render instan (bukan sumber kebenaran).
 * Sumber kebenaran selalu server, ini cuma biar UI gak blank/kedip
 * sebelum network call selesai.
 */
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

const saveLocalStreak = (streak: UserStreak) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(streak));
  } catch {
    // localStorage penuh / diblokir browser — gapapa, ini cuma cache tampilan.
  }
};

/**
 * syncUserStreak
 *
 * PRINSIP: Supabase (function `claim_daily_streak`) adalah SATU-SATUNYA
 * pihak yang menghitung currentStreak/longestStreak. Client tidak lagi
 * menghitung apa pun sendiri — cuma nampilin apa kata server.
 *
 * Anti-spam fetch (3 lapis):
 * 1. Kalau device ini sudah pernah sukses sync HARI INI -> return cache,
 *    TANPA network call sama sekali.
 * 2. Kalau baru gagal coba dalam <15 detik terakhir -> return cache dulu,
 *    jangan nembak lagi.
 * 3. Leaderboard (fungsi terpisah di bawah) di-cache 30 detik.
 */
export const syncUserStreak = async (
  userNrp: string,
  userName: string
): Promise<SyncStreakResult> => {
  const today = getLocalDateString();
  const normalizedNrp = userNrp.trim().toLowerCase();
  const cachedStreak = getLocalStreak();

  // Lapis 1: sudah konfirmasi ke server hari ini -> stop di sini, gak fetch.
  const syncedDate = localStorage.getItem(SYNCED_DATE_KEY);
  if (syncedDate === today && cachedStreak.lastActiveDate === today) {
    return { streak: cachedStreak, isFirstVisitToday: false };
  }

  if (!normalizedNrp || normalizedNrp === 'unknown') {
    // Gak ada identitas user yang valid, gak ada yang bisa disinkronkan.
    return { streak: cachedStreak, isFirstVisitToday: false };
  }

  // Lapis 2: throttle retry.
  const now = Date.now();
  if (now - lastSyncAttemptAt < MIN_RETRY_INTERVAL_MS) {
    return { streak: cachedStreak, isFirstVisitToday: false };
  }
  lastSyncAttemptAt = now;

  try {
    const { data, error } = await supabase.rpc('claim_daily_streak', {
      p_nrp: normalizedNrp,
      p_name: userName,
    });

    if (error || !data || !data[0]) {
      console.warn('[Streak] RPC claim_daily_streak gagal:', error);
      // Gagal -> tetap kasih cache lama, JANGAN tandai synced supaya
      // percobaan berikutnya (setelah throttle lewat) coba lagi.
      return { streak: cachedStreak, isFirstVisitToday: false };
    }

    const row = data[0] as {
      current_streak: number;
      longest_streak: number;
      last_active_date: string;
      active_dates: string[];
      last_checked_in_at: string;
      is_first_visit_today: boolean;
    };

    const updatedStreak: UserStreak = {
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastActiveDate: row.last_active_date,
      activeDates: row.active_dates || cachedStreak.activeDates,
      daysMissedToday: 0,
    };

    saveLocalStreak(updatedStreak);
    localStorage.setItem(SYNCED_DATE_KEY, today);
    emitStreakChange();

    return { streak: updatedStreak, isFirstVisitToday: row.is_first_visit_today };
  } catch (err) {
    console.warn('[Streak] Gagal sinkronisasi Supabase:', err);
    return { streak: cachedStreak, isFirstVisitToday: false };
  }
};

/**
 * fetchStreakLeaderboard
 * Cache 30 detik di memori — modal leaderboard yang dibuka-tutup
 * berkali-kali dalam waktu singkat gak ikut nembak Supabase tiap kali.
 * Panggil dengan forceRefresh=true kalau memang butuh data paling baru
 * (misal tombol "refresh" manual).
 */
export const fetchStreakLeaderboard = async (
  forceRefresh = false
): Promise<LeaderboardUser[]> => {
  const now = Date.now();
  if (!forceRefresh && leaderboardCache && now - leaderboardCache.fetchedAt < LEADERBOARD_TTL_MS) {
    return leaderboardCache.data;
  }

  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('nrp, name, current_streak, longest_streak, last_active_date, last_checked_in_at')
      .order('current_streak', { ascending: false })
      .order('last_checked_in_at', { ascending: true })
      .limit(45);

    if (error || !data) return leaderboardCache?.data || [];

    const mapped: LeaderboardUser[] = data.map((item) => ({
      nrp: item.nrp,
      name: item.name || 'Mbuders',
      currentStreak: item.current_streak || 1,
      longestStreak: item.longest_streak || item.current_streak || 1,
      lastActiveDate: item.last_active_date || '',
      lastCheckedInAt: item.last_checked_in_at || '',
    }));

    leaderboardCache = { data: mapped, fetchedAt: now };
    return mapped;
  } catch (err) {
    console.error('[Streak] Gagal mengambil leaderboard:', err);
    return leaderboardCache?.data || [];
  }
};