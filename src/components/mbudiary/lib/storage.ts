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
  where,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { MbudiaryPost, MbudiaryReply, UserProfile } from '../types';

export const USER_NAME_KEY = 'mymbud_user_name';
export const USER_NRP_KEY = 'mymbud_user_nrp';
export const USER_OFFICER_KEY = 'mymbud_is_officer';
export const USER_EMOJI_KEY = 'mymbud_user_emoji';

const POSTS_COLLECTION = 'mbudiary_posts';
const REPLIES_COLLECTION = 'mbudiary_replies';
const FOLLOWS_COLLECTION = 'mbudiary_follows';
const USERS_COLLECTION = 'mbudiary_users';

let postsCache: MbudiaryPost[] = [];
let repliesCache: MbudiaryReply[] = [];
let followsCache: Array<{ followerUsername: string; targetUsername: string }> = [];
let initialized = false;
let unsubscribeAll: (() => void) | null = null;

function emit(name: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(name));
}

function normalizePost(id: string, data: Record<string, any>): MbudiaryPost {
  return {
    id,
    authorName: data.authorName || 'Mbuders',
    authorUsername: data.authorUsername || 'unknown',
    authorEmoji: data.authorEmoji || '😊',
    content: data.content || '',
    likes: Array.isArray(data.likes) ? data.likes : [],
    replyCount: Number(data.replyCount) || 0,
    isOfficerPost: Boolean(data.isOfficerPost),
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
  };
}

function normalizeReply(id: string, data: Record<string, any>): MbudiaryReply {
  return {
    id,
    postId: data.postId || '',
    authorName: data.authorName || 'Mbuders',
    authorUsername: data.authorUsername || 'unknown',
    authorEmoji: data.authorEmoji || '😊',
    content: data.content || '',
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
  };
}

function normalizeFollow(data: Record<string, any>) {
  return {
    followerUsername: String(data.followerUsername || '').toLowerCase(),
    targetUsername: String(data.targetUsername || '').toLowerCase(),
  };
}

export function getUserProfile(): UserProfile {
  return {
    nickname: localStorage.getItem(USER_NAME_KEY) || 'Mbuders',
    nrp: localStorage.getItem(USER_NRP_KEY) || 'unknown',
    isOfficer: localStorage.getItem(USER_OFFICER_KEY) === 'true',
    emoji: localStorage.getItem(USER_EMOJI_KEY) || '😊',
  };
}

/**
 * Sinkronkan profil user secara realtime dengan Firestore berdasarkan NRP.
 */
export async function syncUserProfileWithFirebase(): Promise<UserProfile> {
  const currentProfile = getUserProfile();
  if (!currentProfile.nrp || currentProfile.nrp === 'unknown') {
    return currentProfile;
  }

  const userDocRef = doc(db, USERS_COLLECTION, currentProfile.nrp.toLowerCase());

  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const syncedProfile: UserProfile = {
        nickname: data.nickname || currentProfile.nickname,
        nrp: currentProfile.nrp,
        isOfficer: data.isOfficer !== undefined ? Boolean(data.isOfficer) : currentProfile.isOfficer,
        emoji: data.emoji || currentProfile.emoji || '😊',
      };

      // Timpa LocalStorage dengan data sahih dari Cloud
      localStorage.setItem(USER_NAME_KEY, syncedProfile.nickname);
      localStorage.setItem(USER_OFFICER_KEY, String(syncedProfile.isOfficer));
      localStorage.setItem(USER_EMOJI_KEY, syncedProfile.emoji);
      emit('mbud_user_change');

      return syncedProfile;
    } else {
      // Jika user baru pertama kali ada di Firestore
      await setDoc(userDocRef, {
        nickname: currentProfile.nickname,
        nrp: currentProfile.nrp.toLowerCase(),
        isOfficer: currentProfile.isOfficer,
        emoji: currentProfile.emoji,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('[mbudiary] Gagal sync profil dari Firestore:', error);
  }

  return currentProfile;
}

/**
 * Starts Firestore realtime listeners.
 */
export function initializeMbudiary(): () => void {
  // Jalankan sync async profil pas dimuat
  syncUserProfileWithFirebase();

  if (initialized && unsubscribeAll) return unsubscribeAll;

  initialized = true;

  // Realtime listener untuk data profil user yang sedang aktif
  const currentNrp = getUserProfile().nrp;
  let userUnsub = () => {};
  if (currentNrp && currentNrp !== 'unknown') {
    const userDocRef = doc(db, USERS_COLLECTION, currentNrp.toLowerCase());
    userUnsub = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.nickname) localStorage.setItem(USER_NAME_KEY, data.nickname);
        if (data.emoji) localStorage.setItem(USER_EMOJI_KEY, data.emoji);
        if (data.isOfficer !== undefined) localStorage.setItem(USER_OFFICER_KEY, String(data.isOfficer));
        emit('mbud_user_change');
      }
    });
  }

  const unsubs = [
    userUnsub,
    onSnapshot(
      query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc')),
      (snapshot) => {
        postsCache = snapshot.docs.map((item) => normalizePost(item.id, item.data()));
        emit('mbud_posts_change');
      },
      (error) => console.error('[mbudiary] Posts listener failed:', error)
    ),
    onSnapshot(
      query(collection(db, REPLIES_COLLECTION), orderBy('createdAt', 'asc')),
      (snapshot) => {
        repliesCache = snapshot.docs.map((item) => normalizeReply(item.id, item.data()));
        emit('mbud_posts_change');
      },
      (error) => console.error('[mbudiary] Replies listener failed:', error)
    ),
    onSnapshot(
      collection(db, FOLLOWS_COLLECTION),
      (snapshot) => {
        followsCache = snapshot.docs.map((item) => normalizeFollow(item.data()));
        emit('mbud_follows_change');
      },
      (error) => console.error('[mbudiary] Follows listener failed:', error)
    ),
  ];

  unsubscribeAll = () => {
    unsubs.forEach((unsubscribe) => unsubscribe());
    unsubscribeAll = null;
    initialized = false;
  };

  return unsubscribeAll;
}

export async function saveUserProfile(profile: UserProfile) {
  // Simpan lokal
  localStorage.setItem(USER_NAME_KEY, profile.nickname);
  localStorage.setItem(USER_NRP_KEY, profile.nrp);
  localStorage.setItem(USER_OFFICER_KEY, String(profile.isOfficer));
  if (profile.emoji) localStorage.setItem(USER_EMOJI_KEY, profile.emoji);
  emit('mbud_user_change');

  // Paksa simpan ke Firestore
  if (profile.nrp && profile.nrp !== 'unknown') {
    try {
      const userDocRef = doc(db, USERS_COLLECTION, profile.nrp.toLowerCase());
      await setDoc(userDocRef, {
        nickname: profile.nickname,
        nrp: profile.nrp.toLowerCase(),
        isOfficer: profile.isOfficer,
        emoji: profile.emoji || '😊',
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('[mbudiary] Gagal update profil ke Firestore:', error);
    }
  }
}

export function getPosts(): MbudiaryPost[] {
  return postsCache;
}

export async function savePost(
  post: Omit<MbudiaryPost, 'id' | 'likes' | 'replyCount' | 'createdAt'>
): Promise<MbudiaryPost> {
  const createdAt = new Date().toISOString();
  const ref = await addDoc(collection(db, POSTS_COLLECTION), {
    ...post,
    likes: [],
    replyCount: 0,
    createdAt,
    createdAtServer: serverTimestamp(),
  });

  return {
    ...post,
    id: ref.id,
    likes: [],
    replyCount: 0,
    createdAt,
  };
}

export async function deletePost(postId: string) {
  const repliesSnapshot = await getDocs(
    query(collection(db, REPLIES_COLLECTION), where('postId', '==', postId))
  );
  const deletions = repliesSnapshot.docs
    .filter((reply) => reply.data().postId === postId)
    .map((reply) => deleteDoc(reply.ref));

  await Promise.all(deletions);
  await deleteDoc(doc(db, POSTS_COLLECTION, postId));
}

export async function toggleLikePost(postId: string, userNrp: string): Promise<MbudiaryPost | null> {
  const postRef = doc(db, POSTS_COLLECTION, postId);
  let updatedLikes: string[] | null = null;

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(postRef);
    if (!snapshot.exists()) return;

    const data = snapshot.data();
    const likes = Array.isArray(data.likes) ? [...data.likes] : [];
    const index = likes.indexOf(userNrp);

    if (index >= 0) likes.splice(index, 1);
    else likes.push(userNrp);

    updatedLikes = likes;
    transaction.update(postRef, { likes });
  });

  if (!updatedLikes) return null;
  const current = postsCache.find((post) => post.id === postId);
  return current ? { ...current, likes: updatedLikes } : null;
}

export function getAllReplies(): MbudiaryReply[] {
  return repliesCache;
}

export function getReplies(postId: string): MbudiaryReply[] {
  return repliesCache.filter((reply) => reply.postId === postId);
}

export async function addReply(
  postId: string,
  authorName: string,
  authorUsername: string,
  content: string,
  authorEmoji = '😊'
): Promise<MbudiaryReply> {
  const createdAt = new Date().toISOString();
  const replyRef = await addDoc(collection(db, REPLIES_COLLECTION), {
    postId,
    authorName,
    authorUsername,
    authorEmoji,
    content,
    createdAt,
    createdAtServer: serverTimestamp(),
  });

  await runTransaction(db, async (transaction) => {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const snapshot = await transaction.get(postRef);
    if (!snapshot.exists()) return;
    const count = Number(snapshot.data().replyCount) || 0;
    transaction.update(postRef, { replyCount: count + 1 });
  });

  return {
    id: replyRef.id,
    postId,
    authorName,
    authorUsername,
    authorEmoji,
    content,
    createdAt,
  };
}

export function getFollows(): string[] {
  const currentUser = getUserProfile().nrp.toLowerCase();
  return followsCache
    .filter((follow) => follow.followerUsername === currentUser)
    .map((follow) => follow.targetUsername);
}

export function isFollowing(targetUsername: string): boolean {
  const target = targetUsername.toLowerCase();
  return getFollows().includes(target);
}

export async function toggleFollow(targetUsername: string): Promise<boolean> {
  const followerUsername = getUserProfile().nrp.toLowerCase();
  const target = targetUsername.toLowerCase();
  const followId = `${followerUsername}__${target}`;
  const followRef = doc(db, FOLLOWS_COLLECTION, followId);
  const currentlyFollowing = isFollowing(target);

  if (currentlyFollowing) {
    await deleteDoc(followRef);
    return false;
  }

  await setDoc(followRef, {
    followerUsername,
    targetUsername: target,
    createdAt: new Date().toISOString(),
  });
  return true;
}

export function getFollowerCount(targetUsername: string): number {
  const target = targetUsername.toLowerCase();
  return followsCache.filter((follow) => follow.targetUsername === target).length;
}