import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../../../services/firebase';

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

const POSTS_COLLECTION = 'mbudiary_posts';
const REPLIES_COLLECTION = 'mbudiary_replies';
const FOLLOWS_COLLECTION = 'mbudiary_follows';
const USERS_COLLECTION = 'mbudiary_users';
const NOTIFICATIONS_COLLECTION = 'mbudiary_notifications';

let postsCache: MbudiaryPost[] = [];
let repliesCache: MbudiaryReply[] = [];
let followsCache: MbudiaryFollow[] = [];
let usersCache: Record<string, MbudiaryUser> = {};
let notificationsCache: MbudiaryNotification[] = [];

let initialized = false;
let unsubscribeAll: (() => void) | null = null;

function emit(name: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(name));
  }
}

function normalizeUser(nrp: string, data: Record<string, any>): MbudiaryUser {
  return {
    nrp: String(data.nrp || nrp).toLowerCase(),
    username: String(data.username || 'mbuders').toLowerCase(),
    nickname: String(data.nickname || 'Mbuders'),
    isOfficer: Boolean(data.isOfficer),
    emoji: String(data.emoji || '😊'),
    isVerified: Boolean(data.isVerified),
    photoUrl: data.photoUrl || undefined,
    headerUrl: data.headerUrl || undefined,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || undefined,
  };
}

function normalizePost(id: string, data: Record<string, any>): MbudiaryPost {
  return {
    id,
    authorNrp: String(data.authorNrp || 'unknown').toLowerCase(),
    content: data.content || '',
    likes: Array.isArray(data.likes) ? data.likes.map((like: string) => String(like).toLowerCase()) : [],
    replyCount: Number(data.replyCount) || 0,
    isOfficerPost: Boolean(data.isOfficerPost),
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
    isRepost: Boolean(data.isRepost),
    originalPostId: data.originalPostId || undefined,
    quoteContent: data.quoteContent || undefined,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
  };
}

function normalizeReply(id: string, data: Record<string, any>): MbudiaryReply {
  return {
    id,
    postId: data.postId || '',
    authorNrp: String(data.authorNrp || 'unknown').toLowerCase(),
    content: data.content || '',
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
  };
}

function normalizeFollow(data: Record<string, any>): MbudiaryFollow {
  return {
    followerNrp: String(data.followerNrp || '').toLowerCase(),
    targetNrp: String(data.targetNrp || '').toLowerCase(),
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
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
    const userRef = doc(db, USERS_COLLECTION, normalizedNrp);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) return null;

    const user = normalizeUser(normalizedNrp, snapshot.data());
    usersCache[normalizedNrp] = user;
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

  const userQuery = query(collection(db, USERS_COLLECTION), where('username', '==', normalizedUsername));
  const snapshot = await getDocs(userQuery);

  if (snapshot.empty) return null;

  const userDoc = snapshot.docs[0];
  const user = normalizeUser(userDoc.id, userDoc.data());
  usersCache[user.nrp] = user;
  return user;
}

export async function isUsernameAvailable(newUsername: string, currentNrp: string): Promise<boolean> {
  const normalizedUsername = newUsername.trim().toLowerCase();
  const normalizedNrp = currentNrp.trim().toLowerCase();
  if (!normalizedUsername) return false;

  const usernameQuery = query(collection(db, USERS_COLLECTION), where('username', '==', normalizedUsername));
  const snapshot = await getDocs(usernameQuery);

  if (snapshot.empty) return true;
  return snapshot.docs.every((item) => item.id.toLowerCase() === normalizedNrp);
}

export async function syncUserProfileWithFirebase(): Promise<UserProfile> {
  const currentProfile = getUserProfile();
  if (!currentProfile.nrp || currentProfile.nrp === 'unknown') return currentProfile;

  const normalizedNrp = currentProfile.nrp.trim().toLowerCase();
  const userDocRef = doc(db, USERS_COLLECTION, normalizedNrp);

  try {
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const cloudUser = normalizeUser(normalizedNrp, docSnap.data());
      usersCache[normalizedNrp] = cloudUser;

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

      if (syncedProfile.photoUrl) {
        localStorage.setItem(USER_PHOTO_URL_KEY, syncedProfile.photoUrl);
      } else {
        localStorage.removeItem(USER_PHOTO_URL_KEY);
      }

      if (syncedProfile.headerUrl) {
        localStorage.setItem(USER_HEADER_URL_KEY, syncedProfile.headerUrl);
      } else {
        localStorage.removeItem(USER_HEADER_URL_KEY);
      }

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

    await setDoc(userDocRef, {
      ...initialUser,
      photoUrl: initialUser.photoUrl || null,
      headerUrl: initialUser.headerUrl || null,
      updatedAt: serverTimestamp(),
    });
    usersCache[normalizedNrp] = initialUser;

    localStorage.setItem(USER_USERNAME_KEY, initialUser.username);
    localStorage.setItem(USER_NAME_KEY, initialUser.nickname);
    localStorage.setItem(USER_OFFICER_KEY, String(initialUser.isOfficer));
    localStorage.setItem(USER_EMOJI_KEY, initialUser.emoji);
    if (initialUser.photoUrl) localStorage.setItem(USER_PHOTO_URL_KEY, initialUser.photoUrl);
    if (initialUser.headerUrl) localStorage.setItem(USER_HEADER_URL_KEY, initialUser.headerUrl);

    emit('mbud_user_change');
    return initialUser;
  } catch (error) {
    console.error('[mbudiary] Gagal sync profil Firestore:', error);
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

  const userDocRef = doc(db, USERS_COLLECTION, normalizedNrp);
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

  await setDoc(
    userDocRef,
    {
      nrp: cloudUser.nrp,
      username: cloudUser.username,
      nickname: cloudUser.nickname,
      isOfficer: cloudUser.isOfficer,
      emoji: cloudUser.emoji,
      isVerified: cloudUser.isVerified,
      photoUrl: cloudUser.photoUrl || null,
      headerUrl: cloudUser.headerUrl || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  usersCache[normalizedNrp] = cloudUser;

  localStorage.setItem(USER_NRP_KEY, normalizedNrp);
  localStorage.setItem(USER_USERNAME_KEY, cloudUser.username);
  localStorage.setItem(USER_NAME_KEY, cloudUser.nickname);
  localStorage.setItem(USER_OFFICER_KEY, String(cloudUser.isOfficer));
  localStorage.setItem(USER_EMOJI_KEY, cloudUser.emoji);

  if (cloudUser.photoUrl) {
    localStorage.setItem(USER_PHOTO_URL_KEY, cloudUser.photoUrl);
  } else {
    localStorage.removeItem(USER_PHOTO_URL_KEY);
  }

  if (cloudUser.headerUrl) {
    localStorage.setItem(USER_HEADER_URL_KEY, cloudUser.headerUrl);
  } else {
    localStorage.removeItem(USER_HEADER_URL_KEY);
  }

  emit('mbud_user_change');
}

export async function setUserVerified(userNrp: string, verified: boolean): Promise<void> {
  const normalizedNrp = userNrp.trim().toLowerCase();
  if (!normalizedNrp || normalizedNrp === 'unknown') throw new Error('NRP user tidak valid.');

  const userRef = doc(db, USERS_COLLECTION, normalizedNrp);
  await setDoc(userRef, { isVerified: verified, updatedAt: serverTimestamp() }, { merge: true });

  const cachedUser = usersCache[normalizedNrp];
  if (cachedUser) {
    usersCache[normalizedNrp] = { ...cachedUser, isVerified: verified };
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
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      recipientNrp: recipientNrp.toLowerCase(),
      senderNrp: senderNrp.toLowerCase(),
      type,
      postId: postId || null,
      isRead: false,
      createdAt: new Date().toISOString(),
      createdAtServer: serverTimestamp(),
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

  // FIX REGEX DI SINI: a-zA-Z0-9_
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

export function subscribeNotifications(userNrp: string, callback: (notifs: MbudiaryNotification[]) => void) {
  const normalizedNrp = userNrp.trim().toLowerCase();
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('recipientNrp', '==', normalizedNrp),
    orderBy('createdAtServer', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    notificationsCache = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      recipientNrp: docSnap.data().recipientNrp,
      senderNrp: docSnap.data().senderNrp,
      type: docSnap.data().type,
      postId: docSnap.data().postId,
      isRead: docSnap.data().isRead || false,
      createdAt: docSnap.data().createdAt,
    }));

    callback(notificationsCache);
    window.dispatchEvent(new Event('mbud_notifications_change'));
  });
}

export async function markNotificationAsRead(notifId: string) {
  try {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);
    await updateDoc(notifRef, { isRead: true });
  } catch (err) {
    console.error('[mbudiary] Gagal update notifikasi:', err);
  }
}

export function initializeMbudiary(): () => void {
  if (initialized && unsubscribeAll) return unsubscribeAll;
  initialized = true;

  syncUserProfileWithFirebase();
  const currentNrp = getUserProfile().nrp.trim().toLowerCase();
  const unsubs: Array<() => void> = [];

  const usersUnsub = onSnapshot(collection(db, USERS_COLLECTION), (snapshot) => {
    const nextUsers: Record<string, MbudiaryUser> = {};
    snapshot.docs.forEach((item) => {
      const user = normalizeUser(item.id, item.data());
      nextUsers[user.nrp] = user;
    });
    usersCache = nextUsers;
    emit('mbud_users_change');
    emit('mbud_user_change');
  });
  unsubs.push(usersUnsub);

  let currentUserUnsub = () => {};
  if (currentNrp && currentNrp !== 'unknown') {
    const currentUserRef = doc(db, USERS_COLLECTION, currentNrp);
    currentUserUnsub = onSnapshot(currentUserRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const user = normalizeUser(currentNrp, snapshot.data());
      usersCache[currentNrp] = user;
      localStorage.setItem(USER_USERNAME_KEY, user.username);
      localStorage.setItem(USER_NAME_KEY, user.nickname);
      localStorage.setItem(USER_EMOJI_KEY, user.emoji);
      localStorage.setItem(USER_OFFICER_KEY, String(user.isOfficer));
      if (user.photoUrl) localStorage.setItem(USER_PHOTO_URL_KEY, user.photoUrl);
      else localStorage.removeItem(USER_PHOTO_URL_KEY);
      if (user.headerUrl) localStorage.setItem(USER_HEADER_URL_KEY, user.headerUrl);
      else localStorage.removeItem(USER_HEADER_URL_KEY);
      emit('mbud_user_change');
      emit('mbud_users_change');
    });
  }
  unsubs.push(currentUserUnsub);

  const postsUnsub = onSnapshot(query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc')), (snapshot) => {
    postsCache = snapshot.docs.map((item) => normalizePost(item.id, item.data()));
    emit('mbud_posts_change');
  });
  unsubs.push(postsUnsub);

  const repliesUnsub = onSnapshot(query(collection(db, REPLIES_COLLECTION), orderBy('createdAt', 'asc')), (snapshot) => {
    repliesCache = snapshot.docs.map((item) => normalizeReply(item.id, item.data()));
    emit('mbud_posts_change');
    emit('mbud_replies_change');
  });
  unsubs.push(repliesUnsub);

  const followsUnsub = onSnapshot(collection(db, FOLLOWS_COLLECTION), (snapshot) => {
    followsCache = snapshot.docs
      .map((item) => normalizeFollow(item.data()))
      .filter((follow) => follow.followerNrp && follow.targetNrp);
    emit('mbud_follows_change');
  });
  unsubs.push(followsUnsub);

  unsubscribeAll = () => {
    unsubs.forEach((unsubscribe) => unsubscribe());
    unsubscribeAll = null;
    initialized = false;
  };

  return unsubscribeAll;
}

export function getPosts(): MbudiaryPost[] {
  return postsCache;
}

export async function savePost(post: Omit<MbudiaryPost, 'id' | 'likes' | 'replyCount' | 'createdAt'>): Promise<MbudiaryPost> {
  const currentUser = getUserProfile();
  const authorNrp = currentUser.nrp.trim().toLowerCase();
  if (!authorNrp || authorNrp === 'unknown') throw new Error('Tidak dapat membuat post: NRP user tidak valid.');

  const createdAt = new Date().toISOString();
  const ref = await addDoc(collection(db, POSTS_COLLECTION), {
    authorNrp,
    content: post.content,
    likes: [],
    replyCount: 0,
    isOfficerPost: post.isOfficerPost ?? currentUser.isOfficer,
    imageUrls: post.imageUrls || [],
    isRepost: post.isRepost || false,
    originalPostId: post.originalPostId || null,
    quoteContent: post.quoteContent || null,
    createdAt,
    createdAtServer: serverTimestamp(),
  });

  return { ...post, id: ref.id, authorNrp, likes: [], replyCount: 0, createdAt };
}

export async function deletePost(postId: string) {
  const repliesSnapshot = await getDocs(query(collection(db, REPLIES_COLLECTION), where('postId', '==', postId)));
  await Promise.all(repliesSnapshot.docs.map((reply) => deleteDoc(reply.ref)));
  await deleteDoc(doc(db, POSTS_COLLECTION, postId));
}

export async function toggleLikePost(postId: string, userNrp: string): Promise<MbudiaryPost | null> {
  const normalizedNrp = userNrp.trim().toLowerCase();
  const postRef = doc(db, POSTS_COLLECTION, postId);
  let updatedLikes: string[] | null = null;
  let isNowLiked = false;
  let postAuthorNrp = '';

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(postRef);
    if (!snapshot.exists()) return;

    const data = snapshot.data();
    postAuthorNrp = data.authorNrp || '';
    const likes: string[] = Array.isArray(data.likes) ? data.likes.map((like: string) => String(like).toLowerCase()) : [];
    const index = likes.indexOf(normalizedNrp);

    if (index >= 0) {
      likes.splice(index, 1);
      isNowLiked = false;
    } else {
      likes.push(normalizedNrp);
      isNowLiked = true;
    }

    updatedLikes = likes;
    transaction.update(postRef, { likes });
  });

  if (!updatedLikes) return null;

  if (isNowLiked && postAuthorNrp) {
    createNotification({
      recipientNrp: postAuthorNrp,
      senderNrp: normalizedNrp,
      type: 'like',
      postId: postId,
    });
  }

  const current = postsCache.find((post) => post.id === postId);
  return current ? { ...current, likes: updatedLikes } : null;
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
  const replyRef = await addDoc(collection(db, REPLIES_COLLECTION), {
    postId,
    authorNrp,
    content,
    createdAt,
    createdAtServer: serverTimestamp(),
  });

  let postAuthorNrp = '';

  await runTransaction(db, async (transaction) => {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const snapshot = await transaction.get(postRef);
    if (!snapshot.exists()) return;

    postAuthorNrp = snapshot.data().authorNrp || '';
    const count = Number(snapshot.data().replyCount) || 0;
    transaction.update(postRef, { replyCount: count + 1 });
  });

  if (postAuthorNrp) {
    createNotification({
      recipientNrp: postAuthorNrp,
      senderNrp: authorNrp,
      type: 'reply',
      postId: postId,
    });
  }

  return { id: replyRef.id, postId, authorNrp, content, createdAt };
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
    .filter((follow) => follow.followerNrp === target)
    .map((follow) => follow.targetNrp);
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
  const followRef = doc(db, FOLLOWS_COLLECTION, followId);
  const currentlyFollowing = isFollowing(target);

  if (currentlyFollowing) {
    await deleteDoc(followRef);
    return false;
  }

  await setDoc(followRef, { followerNrp, targetNrp: target, createdAt: serverTimestamp() });

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