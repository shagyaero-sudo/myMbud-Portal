import { supabase } from '../../../services/supabase';
import {
  MbudiaryFollow,
  MbudiaryPost,
  MbudiaryReply,
  MbudiaryUser,
  UserProfile,
  MbudiaryNotification,
} from '../types';

export const USER_NAME_KEY = 'mymbud_user_name';
export const USER_NRP_KEY = 'mymbud_user_nrp';
export const USER_OFFICER_KEY = 'mymbud_is_officer';
export const USER_EMOJI_KEY = 'mymbud_user_emoji';
export const USER_USERNAME_KEY = 'mymbud_user_username';
export const USER_PHOTO_URL_KEY = 'mymbud_user_photo_url';
export const USER_HEADER_URL_KEY = 'mymbud_user_header_url';

// STORAGE KEYS UNTUK PERSISTENT INSTANT CACHE
const CACHED_POSTS_KEY = 'mymbud_cache_posts';
const CACHED_USERS_KEY = 'mymbud_cache_users';
const CACHED_REPLIES_KEY = 'mymbud_cache_replies';
const CACHED_FOLLOWS_KEY = 'mymbud_cache_follows';

function loadLocalCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocalCache(key: string, data: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('[mbudiary] Gagal menyimpan local cache:', e);
  }
}

let postsCache: MbudiaryPost[] = loadLocalCache<MbudiaryPost[]>(CACHED_POSTS_KEY, []);
let repliesCache: MbudiaryReply[] = loadLocalCache<MbudiaryReply[]>(CACHED_REPLIES_KEY, []);
let followsCache: MbudiaryFollow[] = loadLocalCache<MbudiaryFollow[]>(CACHED_FOLLOWS_KEY, []);
let usersCache: Record<string, MbudiaryUser> = loadLocalCache<Record<string, MbudiaryUser>>(CACHED_USERS_KEY, {});
let notificationsCache: MbudiaryNotification[] = [];

let initialized = false;
let channels: any[] = [];

function emit(name: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(name));
  }
}

// DUKUNG TIPE VERIFIKASI STRING ('gold' | 'blue' | false) DENGAN STRICT PARSING
function normalizeUser(data: Record<string, any>): MbudiaryUser {
  let isVerifiedValue: 'gold' | 'blue' | false = false;

  const rawVerified = data.is_verified;
  if (rawVerified === 'gold') {
    isVerifiedValue = 'gold';
  } else if (rawVerified === 'blue' || rawVerified === true || rawVerified === 'true') {
    isVerifiedValue = 'blue';
  } else {
    isVerifiedValue = false;
  }

  return {
    nrp: String(data.nrp || '').toLowerCase(),
    username: String(data.username || 'mbuders').toLowerCase(),
    nickname: String(data.nickname || 'Mbuders'),
    isOfficer: Boolean(data.is_officer),
    emoji: String(data.emoji || '😊'),
    isVerified: isVerifiedValue,
    photoUrl: data.photo_url || undefined,
    headerUrl: data.header_url || undefined,
    updatedAt: data.updated_at || undefined,
  };
}

function normalizePost(data: Record<string, any>): MbudiaryPost {
  return {
    id: data.id,
    authorNrp: String(data.author_nrp || 'unknown').toLowerCase(),
    content: data.content || '',
    likes: Array.isArray(data.likes) ? data.likes.map((like: string) => String(like).toLowerCase()) : [],
    replyCount: Number(data.reply_count) || 0,
    isOfficerPost: Boolean(data.is_officer_post),
    imageUrls: Array.isArray(data.image_urls) ? data.image_urls : [],
    isRepost: Boolean(data.is_repost),
    originalPostId: data.original_post_id || undefined,
    quoteContent: data.quote_content || undefined,
    createdAt: data.created_at || new Date().toISOString(),
  };
}

function normalizeReply(data: Record<string, any>): MbudiaryReply {
  return {
    id: data.id,
    postId: data.post_id || '',
    authorNrp: String(data.author_nrp || 'unknown').toLowerCase(),
    content: data.content || '',
    createdAt: data.created_at || new Date().toISOString(),
  };
}

function normalizeFollow(data: Record<string, any>): MbudiaryFollow {
  return {
    followerNrp: String(data.follower_nrp || '').toLowerCase(),
    targetNrp: String(data.target_nrp || '').toLowerCase(),
    createdAt: data.created_at || new Date().toISOString(),
  };
}

export function getUserProfile(): UserProfile {
  const nrp = localStorage.getItem(USER_NRP_KEY) || 'unknown';
  const nickname = localStorage.getItem(USER_NAME_KEY) || 'Mbuders';
  const username = localStorage.getItem(USER_USERNAME_KEY) || 'mbuders';
  const isOfficer = localStorage.getItem(USER_OFFICER_KEY) === 'true';
  const emoji = localStorage.getItem(USER_EMOJI_KEY) || '😊';
  const photoUrl = localStorage.getItem(USER_PHOTO_URL_KEY) || undefined;
  const headerUrl = localStorage.getItem(USER_HEADER_URL_KEY) || undefined;

  return { nrp, username, nickname, isOfficer, emoji, photoUrl, headerUrl };
}

export async function getUserByNrp(userNrp: string): Promise<MbudiaryUser | null> {
  const normalizedNrp = userNrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') return null;

  const cached = usersCache[normalizedNrp];
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('mbudiary_users')
      .select('*')
      .eq('nrp', normalizedNrp)
      .maybeSingle();

    if (error || !data) return null;

    const user = normalizeUser(data);
    usersCache[normalizedNrp] = user;
    saveLocalCache(CACHED_USERS_KEY, usersCache);
    return user;
  } catch (error) {
    console.error('[mbudiary] Gagal mengambil user berdasarkan NRP:', error);
    return null;
  }
}

export function getCachedUserByNrp(userNrp: string): MbudiaryUser | null {
  const normalizedNrp = userNrp.trim().toLowerCase();
  return usersCache[normalizedNrp] || null;
}

export async function getUserByUsername(username: string): Promise<MbudiaryUser | null> {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) return null;

  const { data, error } = await supabase
    .from('mbudiary_users')
    .select('*')
    .eq('username', normalizedUsername)
    .maybeSingle();

  if (error || !data) return null;

  const user = normalizeUser(data);
  usersCache[user.nrp] = user;
  saveLocalCache(CACHED_USERS_KEY, usersCache);
  return user;
}

export async function isUsernameAvailable(newUsername: string, currentNrp: string): Promise<boolean> {
  const normalizedUsername = newUsername.trim().toLowerCase();
  const normalizedNrp = currentNrp.trim().toLowerCase();
  if (!normalizedUsername) return false;

  const { data, error } = await supabase
    .from('mbudiary_users')
    .select('nrp')
    .eq('username', normalizedUsername);

  if (error || !data || data.length === 0) return true;
  return data.every((item) => item.nrp.toLowerCase() === normalizedNrp);
}

export async function syncUserProfileWithFirebase(): Promise<UserProfile> {
  const currentProfile = getUserProfile();
  if (!currentProfile.nrp || currentProfile.nrp === 'unknown') return currentProfile;

  const normalizedNrp = currentProfile.nrp.trim().toLowerCase();

  try {
    const { data: cloudUserRaw } = await supabase
      .from('mbudiary_users')
      .select('*')
      .eq('nrp', normalizedNrp)
      .maybeSingle();

    if (cloudUserRaw) {
      const cloudUser = normalizeUser(cloudUserRaw);
      usersCache[normalizedNrp] = cloudUser;
      saveLocalCache(CACHED_USERS_KEY, usersCache);

      const syncedProfile: UserProfile = {
        nrp: normalizedNrp,
        username: cloudUser.username,
        nickname: cloudUser.nickname,
        isOfficer: cloudUser.isOfficer,
        emoji: cloudUser.emoji,
        isVerified: cloudUser.isVerified,
        photoUrl: cloudUser.photoUrl,
        headerUrl: cloudUser.headerUrl,
      };

      localStorage.setItem(USER_NRP_KEY, syncedProfile.nrp);
      localStorage.setItem(USER_USERNAME_KEY, syncedProfile.username);
      localStorage.setItem(USER_NAME_KEY, syncedProfile.nickname);
      localStorage.setItem(USER_OFFICER_KEY, String(syncedProfile.isOfficer));
      localStorage.setItem(USER_EMOJI_KEY, syncedProfile.emoji);

      if (syncedProfile.photoUrl) localStorage.setItem(USER_PHOTO_URL_KEY, syncedProfile.photoUrl);
      else localStorage.removeItem(USER_PHOTO_URL_KEY);

      if (syncedProfile.headerUrl) localStorage.setItem(USER_HEADER_URL_KEY, syncedProfile.headerUrl);
      else localStorage.removeItem(USER_HEADER_URL_KEY);

      emit('mbud_user_change');
      return syncedProfile;
    }

    const initialUser: MbudiaryUser = {
      nrp: normalizedNrp,
      username: currentProfile.username.trim().toLowerCase() || `mbuder_${normalizedNrp}`,
      nickname: currentProfile.nickname.trim() || 'Mbuders',
      isOfficer: currentProfile.isOfficer,
      emoji: currentProfile.emoji || '😊',
      isVerified: currentProfile.isVerified || false,
      photoUrl: currentProfile.photoUrl || undefined,
      headerUrl: currentProfile.headerUrl || undefined,
    };

    const initialPayloadVerified = initialUser.isVerified === 'gold' ? 'gold' : initialUser.isVerified === 'blue' || initialUser.isVerified === true ? 'blue' : null;

    await supabase.from('mbudiary_users').upsert({
      nrp: initialUser.nrp,
      username: initialUser.username,
      nickname: initialUser.nickname,
      is_officer: initialUser.isOfficer,
      emoji: initialUser.emoji,
      is_verified: initialPayloadVerified,
      photo_url: initialUser.photoUrl || null,
      header_url: initialUser.headerUrl || null,
      updated_at: new Date().toISOString(),
    });
    usersCache[normalizedNrp] = initialUser;
    saveLocalCache(CACHED_USERS_KEY, usersCache);

    localStorage.setItem(USER_USERNAME_KEY, initialUser.username);
    localStorage.setItem(USER_NAME_KEY, initialUser.nickname);
    localStorage.setItem(USER_OFFICER_KEY, String(initialUser.isOfficer));
    localStorage.setItem(USER_EMOJI_KEY, initialUser.emoji);
    if (initialUser.photoUrl) localStorage.setItem(USER_PHOTO_URL_KEY, initialUser.photoUrl);
    if (initialUser.headerUrl) localStorage.setItem(USER_HEADER_URL_KEY, initialUser.headerUrl);

    emit('mbud_user_change');
    return initialUser;
  } catch (error) {
    console.error('[mbudiary] Gagal sync profil Supabase:', error);
    return currentProfile;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const normalizedNrp = profile.nrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') throw new Error('NRP user tidak valid.');

  const normalizedUsername = profile.username.trim().toLowerCase();
  if (!normalizedUsername) throw new Error('Username tidak boleh kosong.');

  const available = await isUsernameAvailable(normalizedUsername, normalizedNrp);
  if (!available) throw new Error('Username tersebut sudah digunakan user lain.');

  const cloudUser: MbudiaryUser = {
    nrp: normalizedNrp,
    username: normalizedUsername,
    nickname: profile.nickname.trim() || 'Mbuders',
    isOfficer: Boolean(profile.isOfficer),
    emoji: profile.emoji || '😊',
    isVerified: profile.isVerified || false,
    photoUrl: profile.photoUrl || undefined,
    headerUrl: profile.headerUrl || undefined,
  };

  const payloadVerified = cloudUser.isVerified === 'gold' ? 'gold' : cloudUser.isVerified === 'blue' || cloudUser.isVerified === true ? 'blue' : null;

  const { error } = await supabase.from('mbudiary_users').upsert({
    nrp: cloudUser.nrp,
    username: cloudUser.username,
    nickname: cloudUser.nickname,
    is_officer: cloudUser.isOfficer,
    emoji: cloudUser.emoji,
    is_verified: payloadVerified,
    photo_url: cloudUser.photoUrl || null,
    header_url: cloudUser.headerUrl || null,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  usersCache[normalizedNrp] = cloudUser;
  saveLocalCache(CACHED_USERS_KEY, usersCache);

  localStorage.setItem(USER_NRP_KEY, normalizedNrp);
  localStorage.setItem(USER_USERNAME_KEY, cloudUser.username);
  localStorage.setItem(USER_NAME_KEY, cloudUser.nickname);
  localStorage.setItem(USER_OFFICER_KEY, String(cloudUser.isOfficer));
  localStorage.setItem(USER_EMOJI_KEY, cloudUser.emoji);

  if (cloudUser.photoUrl) localStorage.setItem(USER_PHOTO_URL_KEY, cloudUser.photoUrl);
  else localStorage.removeItem(USER_PHOTO_URL_KEY);

  if (cloudUser.headerUrl) localStorage.setItem(USER_HEADER_URL_KEY, cloudUser.headerUrl);
  else localStorage.removeItem(USER_HEADER_URL_KEY);

  emit('mbud_user_change');
}

export async function setUserVerified(userNrp: string, verified: boolean | string | null): Promise<void> {
  const normalizedNrp = userNrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') throw new Error('NRP user tidak valid.');

  const payloadValue = verified === 'gold' ? 'gold' : verified === 'blue' || verified === true || verified === 'true' ? 'blue' : null;

  const { error } = await supabase
    .from('mbudiary_users')
    .update({ is_verified: payloadValue, updated_at: new Date().toISOString() })
    .eq('nrp', normalizedNrp);

  if (error) {
    console.error('[Supabase] Gagal update verifikasi user:', error);
  }

  const cachedUser = usersCache[normalizedNrp];
  if (cachedUser) {
    usersCache[normalizedNrp] = { ...cachedUser, isVerified: (payloadValue || false) as any };
    saveLocalCache(CACHED_USERS_KEY, usersCache);
  }

  emit('mbud_users_change');
  emit('mbud_user_change');
}

export async function createNotification({
  recipientNrp,
  senderNrp,
  type,
  postId,
}: {
  recipientNrp: string;
  senderNrp: string;
  type: 'like' | 'reply' | 'repost' | 'follow' | 'mention';
  postId?: string;
}) {
  if (recipientNrp.toLowerCase() === senderNrp.toLowerCase()) return;

  try {
    await supabase.from('mbudiary_notifications').insert({
      id: crypto.randomUUID(),
      recipient_nrp: recipientNrp.toLowerCase(),
      sender_nrp: senderNrp.toLowerCase(),
      type,
      post_id: postId || null,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[mbudiary] Gagal membuat notifikasi:', err);
  }
}

export async function processMentionsInContent({
  content,
  senderNrp,
  senderName,
  postId,
}: {
  content: string;
  senderNrp: string;
  senderName: string;
  postId: string;
}) {
  if (!content) return;
  const matches = content.match(/@([a-zA-Z0-9_.]+)/g);
  if (!matches || matches.length === 0) return;

  const uniqueUsernames = Array.from(new Set(matches.map((m) => m.substring(1).toLowerCase())));

  for (const username of uniqueUsernames) {
    try {
      const targetUser = await getUserByUsername(username);
      if (targetUser && targetUser.nrp !== senderNrp.toLowerCase()) {
        await createNotification({
          recipientNrp: targetUser.nrp,
          senderNrp: senderNrp,
          type: 'mention',
          postId: postId,
        });

        const { notifyUserMentioned } = await import('../../../services/oneSignalNotification');
        void notifyUserMentioned({
          targetNrp: targetUser.nrp,
          actorNrp: senderNrp,
          actorName: senderName,
          postId: postId,
        });
      }
    } catch (err) {
      console.error('[mbudiary] Gagal memproses mention untuk @' + username, err);
    }
  }
}

export function searchUsersForMention(queryText: string): MbudiaryUser[] {
  const q = queryText.trim().toLowerCase();
  const allUsers = Object.values(usersCache);
  if (!q) return allUsers.slice(0, 5);

  return allUsers
    .filter(
      (user) =>
        user.username.toLowerCase().includes(q) ||
        user.nickname.toLowerCase().includes(q)
    )
    .slice(0, 5);
}

export function subscribeNotifications(userNrp: string, callback: (notifs: MbudiaryNotification[]) => void) {
  const normalizedNrp = userNrp.trim().toLowerCase();

  const fetchNotifs = async () => {
    const { data } = await supabase
      .from('mbudiary_notifications')
      .select('*')
      .eq('recipient_nrp', normalizedNrp)
      .order('created_at', { ascending: false });

    if (data) {
      notificationsCache = data.map((item) => ({
        id: item.id,
        recipientNrp: item.recipient_nrp,
        senderNrp: item.sender_nrp,
        type: item.type,
        postId: item.post_id,
        isRead: item.is_read || false,
        createdAt: item.created_at,
      }));
      callback(notificationsCache);
      window.dispatchEvent(new Event('mbud_notifications_change'));
    }
  };

  fetchNotifs();

  const channel = supabase
    .channel(`notifs-${normalizedNrp}-${Math.random()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mbudiary_notifications' }, () => {
      fetchNotifs();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function markNotificationAsRead(notifId: string) {
  try {
    await supabase.from('mbudiary_notifications').update({ is_read: true }).eq('id', notifId);
  } catch (err) {
    console.error('[mbudiary] Gagal update notifikasi:', err);
  }
}

export function initializeMbudiary(): () => void {
  if (initialized) return () => {};
  initialized = true;

  syncUserProfileWithFirebase();

  const fetchAllUsers = async () => {
    const { data } = await supabase.from('mbudiary_users').select('*');
    if (data) {
      const nextUsers: Record<string, MbudiaryUser> = {};
      data.forEach((item) => {
        const user = normalizeUser(item);
        nextUsers[user.nrp] = user;
      });
      usersCache = nextUsers;
      saveLocalCache(CACHED_USERS_KEY, usersCache);
      emit('mbud_users_change');
      emit('mbud_user_change');
    }
  };

  const fetchAllPosts = async () => {
    const { data } = await supabase.from('mbudiary_posts').select('*').order('created_at', { ascending: false });
    if (data) {
      postsCache = data.map(normalizePost);
      saveLocalCache(CACHED_POSTS_KEY, postsCache);
      emit('mbud_posts_change');
    }
  };

  const fetchAllReplies = async () => {
    const { data } = await supabase.from('mbudiary_replies').select('*').order('created_at', { ascending: true });
    if (data) {
      repliesCache = data.map(normalizeReply);
      saveLocalCache(CACHED_REPLIES_KEY, repliesCache);
      emit('mbud_posts_change');
      emit('mbud_replies_change');
    }
  };

  const fetchAllFollows = async () => {
    const { data } = await supabase.from('mbudiary_follows').select('*');
    if (data) {
      followsCache = data.map(normalizeFollow).filter((f) => f.followerNrp && f.targetNrp);
      saveLocalCache(CACHED_FOLLOWS_KEY, followsCache);
      emit('mbud_follows_change');
    }
  };

  fetchAllUsers();
  fetchAllPosts();
  fetchAllReplies();
  fetchAllFollows();

  const channel = supabase
    .channel(`mbudiary-sync-${Math.random()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mbudiary_users' }, fetchAllUsers)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mbudiary_posts' }, fetchAllPosts)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mbudiary_replies' }, fetchAllReplies)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mbudiary_follows' }, fetchAllFollows)
    .subscribe();

  channels.push(channel);

  return () => {
    channels.forEach((c) => supabase.removeChannel(c));
    channels = [];
    initialized = false;
  };
}

export function getPosts(): MbudiaryPost[] {
  return postsCache;
}

export async function savePost(post: Omit<MbudiaryPost, 'id' | 'likes' | 'replyCount' | 'createdAt'>): Promise<MbudiaryPost> {
  const currentUser = getUserProfile();
  const authorNrp = currentUser.nrp.trim().toLowerCase();
  if (!authorNrp || authorNrp === 'unknown') throw new Error('Tidak dapat membuat post: NRP user tidak valid.');

  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();

  const newPostItem: MbudiaryPost = {
    ...post,
    id,
    authorNrp,
    likes: [],
    replyCount: 0,
    isOfficerPost: post.isOfficerPost ?? currentUser.isOfficer,
    imageUrls: post.imageUrls || [],
    isRepost: post.isRepost || false,
    originalPostId: post.originalPostId || undefined,
    quoteContent: post.quoteContent || undefined,
    createdAt,
  };

  // Optimistic update ke cache instan
  postsCache = [newPostItem, ...postsCache];
  saveLocalCache(CACHED_POSTS_KEY, postsCache);
  emit('mbud_posts_change');

  const { error } = await supabase.from('mbudiary_posts').insert({
    id,
    author_nrp: authorNrp,
    content: post.content,
    likes: [],
    reply_count: 0,
    is_officer_post: newPostItem.isOfficerPost,
    image_urls: newPostItem.imageUrls,
    is_repost: newPostItem.isRepost,
    original_post_id: newPostItem.originalPostId || null,
    quote_content: newPostItem.quoteContent || null,
    created_at: createdAt,
  });

  if (error) {
    postsCache = postsCache.filter((p) => p.id !== id);
    saveLocalCache(CACHED_POSTS_KEY, postsCache);
    emit('mbud_posts_change');
    throw error;
  }

  return newPostItem;
}

export async function deletePost(postId: string) {
  postsCache = postsCache.filter((p) => p.id !== postId);
  saveLocalCache(CACHED_POSTS_KEY, postsCache);
  emit('mbud_posts_change');

  await supabase.from('mbudiary_replies').delete().eq('post_id', postId);
  await supabase.from('mbudiary_posts').delete().eq('id', postId);
}

export async function toggleLikePost(postId: string, userNrp: string): Promise<MbudiaryPost | null> {
  const normalizedNrp = userNrp.trim().toLowerCase();
  const current = postsCache.find((p) => p.id === postId);
  if (!current) return null;

  const likes = [...current.likes];
  const index = likes.indexOf(normalizedNrp);
  let isNowLiked = false;

  if (index >= 0) {
    likes.splice(index, 1);
    isNowLiked = false;
  } else {
    likes.push(normalizedNrp);
    isNowLiked = true;
  }

  const updatedPost = { ...current, likes };
  postsCache = postsCache.map((p) => (p.id === postId ? updatedPost : p));
  saveLocalCache(CACHED_POSTS_KEY, postsCache);
  emit('mbud_posts_change');

  const { error } = await supabase.from('mbudiary_posts').update({ likes }).eq('id', postId);
  if (error) return null;

  if (isNowLiked && current.authorNrp) {
    createNotification({
      recipientNrp: current.authorNrp,
      senderNrp: normalizedNrp,
      type: 'like',
      postId: postId,
    });
  }

  return updatedPost;
}

export function getAllReplies(): MbudiaryReply[] {
  return repliesCache;
}

export function getReplies(postId: string): MbudiaryReply[] {
  return repliesCache.filter((reply) => reply.postId === postId);
}

export async function addReply(postId: string, content: string): Promise<MbudiaryReply> {
  const currentUser = getUserProfile();
  const authorNrp = currentUser.nrp.trim().toLowerCase();
  if (!authorNrp || authorNrp === 'unknown') throw new Error('Tidak dapat membuat komentar: NRP tidak valid.');

  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();

  const newReplyItem: MbudiaryReply = { id, postId, authorNrp, content, createdAt };
  repliesCache = [...repliesCache, newReplyItem];
  saveLocalCache(CACHED_REPLIES_KEY, repliesCache);

  const currentPost = postsCache.find((p) => p.id === postId);
  if (currentPost) {
    currentPost.replyCount = (currentPost.replyCount || 0) + 1;
    saveLocalCache(CACHED_POSTS_KEY, postsCache);
  }
  emit('mbud_replies_change');
  emit('mbud_posts_change');

  const { error } = await supabase.from('mbudiary_replies').insert({
    id,
    post_id: postId,
    author_nrp: authorNrp,
    content,
    created_at: createdAt,
  });

  if (error) throw error;

  const newReplyCount = (currentPost?.replyCount || 0);
  await supabase.from('mbudiary_posts').update({ reply_count: newReplyCount }).eq('id', postId);

  if (currentPost?.authorNrp) {
    createNotification({
      recipientNrp: currentPost.authorNrp,
      senderNrp: authorNrp,
      type: 'reply',
      postId: postId,
    });
  }

  return newReplyItem;
}

export function getFollows(): string[] {
  const currentNrp = getUserProfile().nrp.trim().toLowerCase();
  return followsCache.filter((follow) => follow.followerNrp === currentNrp).map((follow) => follow.targetNrp);
}

export function getFollowerNrps(targetNrp: string): string[] {
  const target = targetNrp.trim().toLowerCase();
  return followsCache
    .filter((follow) => follow.targetNrp === target)
    .map((follow) => follow.followerNrp);
}

export function getFollowingNrps(targetNrp: string): string[] {
  const target = targetNrp.trim().toLowerCase();
  return followsCache
    .filter((follow) => follow.targetNrp === target)
    .map((follow) => follow.followerNrp);
}

export function isFollowing(targetNrp: string): boolean {
  const target = targetNrp.trim().toLowerCase();
  return getFollows().includes(target);
}

export async function toggleFollow(targetNrp: string): Promise<boolean> {
  const followerNrp = getUserProfile().nrp.trim().toLowerCase();
  const target = targetNrp.trim().toLowerCase();

  if (!followerNrp || followerNrp === 'unknown' || !target) throw new Error('NRP follow tidak valid.');
  if (followerNrp === target) throw new Error('User tidak dapat mengikuti dirinya sendiri.');

  const followId = `${followerNrp}__${target}`;
  const currentlyFollowing = isFollowing(target);

  if (currentlyFollowing) {
    followsCache = followsCache.filter((f) => f.followerNrp !== followerNrp || f.targetNrp !== target);
    saveLocalCache(CACHED_FOLLOWS_KEY, followsCache);
    emit('mbud_follows_change');
    await supabase.from('mbudiary_follows').delete().eq('id', followId);
    return false;
  }

  const newFollow: MbudiaryFollow = { followerNrp, targetNrp: target, createdAt: new Date().toISOString() };
  followsCache = [...followsCache, newFollow];
  saveLocalCache(CACHED_FOLLOWS_KEY, followsCache);
  emit('mbud_follows_change');

  await supabase.from('mbudiary_follows').insert({
    id: followId,
    follower_nrp: followerNrp,
    target_nrp: target,
    created_at: newFollow.createdAt,
  });

  createNotification({
    recipientNrp: target,
    senderNrp: followerNrp,
    type: 'follow',
  });

  return true;
}

export function getFollowerCount(targetNrp: string): number {
  const target = targetNrp.trim().toLowerCase();
  return followsCache.filter((follow) => follow.targetNrp === target).length;
}

export function getFollowingCount(targetNrp: string): number {
  const target = targetNrp.trim().toLowerCase();
  return followsCache.filter((follow) => follow.followerNrp === target).length;
}

export const BOOKMARKS_KEY = 'mymbud_bookmarks';

export function getBookmarkedPostIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Gagal membaca bookmark:', error);
    return [];
  }
}

export function toggleBookmarkPost(postId: string): boolean {
  const bookmarks = getBookmarkedPostIds();
  const index = bookmarks.indexOf(postId);
  let isBookmarked = false;

  if (index >= 0) {
    bookmarks.splice(index, 1);
    isBookmarked = false;
  } else {
    bookmarks.push(postId);
    isBookmarked = true;
  }

  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mbud_bookmarks_change'));
  }
  
  return isBookmarked;
}