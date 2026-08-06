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
} from 'firebase/firestore';

import { db } from '../../../services/firebase';

import {
  MbudiaryFollow,
  MbudiaryPost,
  MbudiaryReply,
  MbudiaryUser,
  UserProfile,
} from '../types';

export const USER_NAME_KEY = 'mymbud_user_name';
export const USER_NRP_KEY = 'mymbud_user_nrp';
export const USER_OFFICER_KEY = 'mymbud_is_officer';
export const USER_EMOJI_KEY = 'mymbud_user_emoji';
export const USER_USERNAME_KEY = 'mymbud_user_username';

const POSTS_COLLECTION = 'mbudiary_posts';
const REPLIES_COLLECTION = 'mbudiary_replies';
const FOLLOWS_COLLECTION = 'mbudiary_follows';
const USERS_COLLECTION = 'mbudiary_users';

let postsCache: MbudiaryPost[] = [];
let repliesCache: MbudiaryReply[] = [];
let followsCache: MbudiaryFollow[] = [];
let usersCache: Record<string, MbudiaryUser> = {};

let initialized = false;
let unsubscribeAll: (() => void) | null = null;

function emit(name: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(name));
  }
}

/* =========================================================
   NORMALIZERS
   ========================================================= */

/**
 * Normalize user document dari Firestore.
 */
function normalizeUser(
  nrp: string,
  data: Record<string, any>
): MbudiaryUser {
  return {
    nrp: String(data.nrp || nrp).toLowerCase(),

    /**
     * Untuk kompatibilitas dengan data lama:
     * kalau username belum ada, sementara gunakan nickname.
     */
    username: String(
      data.username ||
      data.nickname ||
      'unknown'
    ).toLowerCase(),

    nickname: String(
      data.nickname ||
      data.username ||
      'Mbuders'
    ),

    isOfficer: Boolean(data.isOfficer),

    emoji: String(data.emoji || '😊'),

    updatedAt:
      data.updatedAt?.toDate?.()?.toISOString?.() ||
      data.updatedAt ||
      undefined,
  };
}

/**
 * Normalisasi post.
 *
 * DATA BARU:
 * authorNrp
 *
 * DATA LAMA:
 * authorUsername
 *
 * Fallback authorUsername sengaja dipertahankan supaya
 * post lama tidak langsung rusak setelah deployment.
 */
function normalizePost(
  id: string,
  data: Record<string, any>
): MbudiaryPost {
  return {
    id,

    authorNrp: String(
      data.authorNrp ||
      data.authorUsername ||
      'unknown'
    ).toLowerCase(),

    content: data.content || '',

    likes: Array.isArray(data.likes)
      ? data.likes.map((like: string) => String(like).toLowerCase())
      : [],

    replyCount: Number(data.replyCount) || 0,

    isOfficerPost: Boolean(data.isOfficerPost),

    imageUrls: Array.isArray(data.imageUrls)
      ? data.imageUrls
      : [],

    isRepost: Boolean(data.isRepost),

    originalPostId: data.originalPostId || undefined,

    quoteContent: data.quoteContent || undefined,

    createdAt:
      data.createdAt?.toDate?.()?.toISOString?.() ||
      data.createdAt ||
      new Date().toISOString(),
  };
}

/**
 * Normalisasi reply.
 *
 * Data baru memakai authorNrp.
 * authorUsername dipertahankan sebagai fallback legacy.
 */
function normalizeReply(
  id: string,
  data: Record<string, any>
): MbudiaryReply {
  return {
    id,

    postId: data.postId || '',

    authorNrp: String(
      data.authorNrp ||
      data.authorUsername ||
      'unknown'
    ).toLowerCase(),

    content: data.content || '',

    createdAt:
      data.createdAt?.toDate?.()?.toISOString?.() ||
      data.createdAt ||
      new Date().toISOString(),
  };
}

function normalizeFollow(
  data: Record<string, any>
): MbudiaryFollow {
  return {
    /**
     * New architecture.
     *
     * Fallback username sengaja tidak digunakan
     * karena relasi baru harus berbasis NRP.
     */
    followerNrp: String(
      data.followerNrp || ''
    ).toLowerCase(),

    targetNrp: String(
      data.targetNrp || ''
    ).toLowerCase(),

    createdAt:
      data.createdAt?.toDate?.()?.toISOString?.() ||
      data.createdAt ||
      new Date().toISOString(),
  };
}

/* =========================================================
   LOCAL USER PROFILE
   ========================================================= */

export function getUserProfile(): UserProfile {
  const nrp =
    localStorage.getItem(USER_NRP_KEY) || 'unknown';

  const nickname =
    localStorage.getItem(USER_NAME_KEY) || 'Mbuders';

  const username =
    localStorage.getItem(USER_USERNAME_KEY) ||
    nickname;

  const isOfficer =
    localStorage.getItem(USER_OFFICER_KEY) === 'true';

  const emoji =
    localStorage.getItem(USER_EMOJI_KEY) || '😊';

  return {
    nrp,
    username,
    nickname,
    isOfficer,
    emoji,
  };
}

/* =========================================================
   USER CLOUD IDENTITY
   ========================================================= */

/**
 * Ambil user berdasarkan NRP.
 *
 * SINGLE SOURCE OF TRUTH:
 *
 * mbudiary_users/{nrp}
 */
export async function getUserByNrp(
  userNrp: string
): Promise<MbudiaryUser | null> {
  const normalizedNrp = userNrp.trim().toLowerCase();

  if (!normalizedNrp || normalizedNrp === 'unknown') {
    return null;
  }

  const cached = usersCache[normalizedNrp];

  if (cached) {
    return cached;
  }

  try {
    const userRef = doc(
      db,
      USERS_COLLECTION,
      normalizedNrp
    );

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const user = normalizeUser(
      normalizedNrp,
      snapshot.data()
    );

    usersCache[normalizedNrp] = user;

    return user;
  } catch (error) {
    console.error(
      '[mbudiary] Gagal mengambil user berdasarkan NRP:',
      error
    );

    return null;
  }
}

/**
 * Ambil user dari cache realtime.
 */
export function getCachedUserByNrp(
  userNrp: string
): MbudiaryUser | null {
  const normalizedNrp =
    userNrp.trim().toLowerCase();

  return usersCache[normalizedNrp] || null;
}

/**
 * Cari user berdasarkan username.
 */
export async function getUserByUsername(
  username: string
): Promise<MbudiaryUser | null> {
  const normalizedUsername =
    username.trim().toLowerCase();

  if (!normalizedUsername) {
    return null;
  }

  const userQuery = query(
    collection(db, USERS_COLLECTION),
    where('username', '==', normalizedUsername)
  );

  const snapshot = await getDocs(userQuery);

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];

  const user = normalizeUser(
    userDoc.id,
    userDoc.data()
  );

  usersCache[user.nrp] = user;

  return user;
}

/**
 * Validasi apakah username tersedia.
 *
 * Saat edit username, current user's own document
 * dikecualikan.
 */
export async function isUsernameAvailable(
  newUsername: string,
  currentNrp: string
): Promise<boolean> {
  const normalizedUsername =
    newUsername.trim().toLowerCase();

  const normalizedNrp =
    currentNrp.trim().toLowerCase();

  if (!normalizedUsername) {
    return false;
  }

  const usernameQuery = query(
    collection(db, USERS_COLLECTION),
    where('username', '==', normalizedUsername)
  );

  const snapshot = await getDocs(usernameQuery);

  if (snapshot.empty) {
    return true;
  }

  /**
   * Username boleh tetap digunakan oleh pemilik
   * dokumen itu sendiri.
   */
  return snapshot.docs.every(
    (item) =>
      item.id.toLowerCase() === normalizedNrp
  );
}

/**
 * Sinkronkan profil aktif dengan cloud.
 *
 * Document ID = NRP.
 */
export async function syncUserProfileWithFirebase(): Promise<UserProfile> {
  const currentProfile = getUserProfile();

  if (
    !currentProfile.nrp ||
    currentProfile.nrp === 'unknown'
  ) {
    return currentProfile;
  }

  const normalizedNrp =
    currentProfile.nrp.toLowerCase();

  const userDocRef = doc(
    db,
    USERS_COLLECTION,
    normalizedNrp
  );

  try {
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      const cloudUser = normalizeUser(
        normalizedNrp,
        data
      );

      usersCache[normalizedNrp] = cloudUser;

      const syncedProfile: UserProfile = {
        nrp: normalizedNrp,
        username: cloudUser.username,
        nickname: cloudUser.nickname,
        isOfficer: cloudUser.isOfficer,
        emoji: cloudUser.emoji,
      };

      localStorage.setItem(
        USER_NRP_KEY,
        syncedProfile.nrp
      );

      localStorage.setItem(
        USER_USERNAME_KEY,
        syncedProfile.username
      );

      localStorage.setItem(
        USER_NAME_KEY,
        syncedProfile.nickname
      );

      localStorage.setItem(
        USER_OFFICER_KEY,
        String(syncedProfile.isOfficer)
      );

      localStorage.setItem(
        USER_EMOJI_KEY,
        syncedProfile.emoji
      );

      emit('mbud_user_change');

      return syncedProfile;
    }

    /**
     * User belum punya document.
     *
     * Buat menggunakan NRP sebagai document ID.
     */
    const initialUser: MbudiaryUser = {
      nrp: normalizedNrp,

      username:
        currentProfile.username ||
        currentProfile.nickname ||
        normalizedNrp,

      nickname:
        currentProfile.nickname ||
        'Mbuders',

      isOfficer: currentProfile.isOfficer,

      emoji:
        currentProfile.emoji ||
        '😊',
    };

    await setDoc(userDocRef, {
      ...initialUser,
      updatedAt: serverTimestamp(),
    });

    usersCache[normalizedNrp] = initialUser;

    return initialUser;
  } catch (error) {
    console.error(
      '[mbudiary] Gagal sync profil Firestore:',
      error
    );

    return currentProfile;
  }
}

/**
 * Simpan perubahan profile ke cloud.
 *
 * Username divalidasi sebelum ditulis.
 */
export async function saveUserProfile(
  profile: UserProfile
): Promise<void> {
  const normalizedNrp =
    profile.nrp.trim().toLowerCase();

  if (
    !normalizedNrp ||
    normalizedNrp === 'unknown'
  ) {
    throw new Error('NRP user tidak valid.');
  }

  const normalizedUsername =
    profile.username.trim().toLowerCase();

  if (!normalizedUsername) {
    throw new Error('Username tidak boleh kosong.');
  }

  const available = await isUsernameAvailable(
    normalizedUsername,
    normalizedNrp
  );

  if (!available) {
    throw new Error(
      'Username tersebut sudah digunakan user lain.'
    );
  }

  const userDocRef = doc(
    db,
    USERS_COLLECTION,
    normalizedNrp
  );

  const cloudUser: MbudiaryUser = {
    nrp: normalizedNrp,

    username: normalizedUsername,

    nickname:
      profile.nickname.trim() || 'Mbuders',

    isOfficer: Boolean(profile.isOfficer),

    emoji:
      profile.emoji || '😊',
  };

  await setDoc(
    userDocRef,
    {
      ...cloudUser,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  usersCache[normalizedNrp] = cloudUser;

  /**
   * LocalStorage hanya cache.
   * Cloud tetap menjadi source of truth.
   */
  localStorage.setItem(
    USER_NRP_KEY,
    normalizedNrp
  );

  localStorage.setItem(
    USER_USERNAME_KEY,
    cloudUser.username
  );

  localStorage.setItem(
    USER_NAME_KEY,
    cloudUser.nickname
  );

  localStorage.setItem(
    USER_OFFICER_KEY,
    String(cloudUser.isOfficer)
  );

  localStorage.setItem(
    USER_EMOJI_KEY,
    cloudUser.emoji
  );

  emit('mbud_user_change');
}

/* =========================================================
   REALTIME INITIALIZATION
   ========================================================= */

export function initializeMbudiary(): () => void {
  if (initialized && unsubscribeAll) {
    return unsubscribeAll;
  }

  initialized = true;

  /**
   * Sinkronkan user aktif.
   */
  syncUserProfileWithFirebase();

  const currentNrp =
    getUserProfile().nrp.toLowerCase();

  const unsubs: Array<() => void> = [];

  /* -------------------------------------------------------
     USER PROFILES
     ------------------------------------------------------- */

  /**
   * IMPORTANT:
   *
   * Seluruh user profile di-cache secara realtime.
   *
   * Dengan ini PostCard cukup membaca:
   *
   * authorNrp -> usersCache[authorNrp]
   *
   * Jadi username / emoji berubah satu kali di cloud
   * dan seluruh feed dapat berubah tanpa update post lama.
   */
  const usersUnsub = onSnapshot(
    collection(db, USERS_COLLECTION),
    (snapshot) => {
      const nextUsers: Record<
        string,
        MbudiaryUser
      > = {};

      snapshot.docs.forEach((item) => {
        const user = normalizeUser(
          item.id,
          item.data()
        );

        nextUsers[user.nrp] = user;
      });

      usersCache = nextUsers;

      emit('mbud_users_change');
      emit('mbud_user_change');
    },
    (error) => {
      console.error(
        '[mbudiary] Users listener failed:',
        error
      );
    }
  );

  unsubs.push(usersUnsub);

  /* -------------------------------------------------------
     CURRENT USER REALTIME
     ------------------------------------------------------- */

  let currentUserUnsub = () => {};

  if (
    currentNrp &&
    currentNrp !== 'unknown'
  ) {
    const currentUserRef = doc(
      db,
      USERS_COLLECTION,
      currentNrp
    );

    currentUserUnsub = onSnapshot(
      currentUserRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }

        const user = normalizeUser(
          currentNrp,
          snapshot.data()
        );

        usersCache[currentNrp] = user;

        localStorage.setItem(
          USER_USERNAME_KEY,
          user.username
        );

        localStorage.setItem(
          USER_NAME_KEY,
          user.nickname
        );

        localStorage.setItem(
          USER_EMOJI_KEY,
          user.emoji
        );

        localStorage.setItem(
          USER_OFFICER_KEY,
          String(user.isOfficer)
        );

        emit('mbud_user_change');
        emit('mbud_users_change');
      },
      (error) => {
        console.error(
          '[mbudiary] Current user listener failed:',
          error
        );
      }
    );
  }

  unsubs.push(currentUserUnsub);

  /* -------------------------------------------------------
     POSTS
     ------------------------------------------------------- */

  const postsUnsub = onSnapshot(
    query(
      collection(db, POSTS_COLLECTION),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => {
      postsCache = snapshot.docs.map((item) =>
        normalizePost(
          item.id,
          item.data()
        )
      );

      emit('mbud_posts_change');
    },
    (error) => {
      console.error(
        '[mbudiary] Posts listener failed:',
        error
      );
    }
  );

  unsubs.push(postsUnsub);

  /* -------------------------------------------------------
     REPLIES
     ------------------------------------------------------- */

  const repliesUnsub = onSnapshot(
    query(
      collection(db, REPLIES_COLLECTION),
      orderBy('createdAt', 'asc')
    ),
    (snapshot) => {
      repliesCache = snapshot.docs.map((item) =>
        normalizeReply(
          item.id,
          item.data()
        )
      );

      emit('mbud_posts_change');
      emit('mbud_replies_change');
    },
    (error) => {
      console.error(
        '[mbudiary] Replies listener failed:',
        error
      );
    }
  );

  unsubs.push(repliesUnsub);

  /* -------------------------------------------------------
     FOLLOWS
     ------------------------------------------------------- */

  const followsUnsub = onSnapshot(
    collection(db, FOLLOWS_COLLECTION),
    (snapshot) => {
      followsCache = snapshot.docs
        .map((item) =>
          normalizeFollow(item.data())
        )
        .filter(
          (follow) =>
            follow.followerNrp &&
            follow.targetNrp
        );

      emit('mbud_follows_change');
    },
    (error) => {
      console.error(
        '[mbudiary] Follows listener failed:',
        error
      );
    }
  );

  unsubs.push(followsUnsub);

  unsubscribeAll = () => {
    unsubs.forEach((unsubscribe) =>
      unsubscribe()
    );

    unsubscribeAll = null;
    initialized = false;
  };

  return unsubscribeAll;
}

/* =========================================================
   POSTS
   ========================================================= */

export function getPosts(): MbudiaryPost[] {
  return postsCache;
}

export async function savePost(
  post: Omit<
    MbudiaryPost,
    'id' | 'likes' | 'replyCount' | 'createdAt'
  >
): Promise<MbudiaryPost> {
  const currentUser = getUserProfile();

  const authorNrp =
    currentUser.nrp.toLowerCase();

  if (
    !authorNrp ||
    authorNrp === 'unknown'
  ) {
    throw new Error(
      'Tidak dapat membuat post: NRP user tidak valid.'
    );
  }

  const createdAt =
    new Date().toISOString();

  const ref = await addDoc(
    collection(db, POSTS_COLLECTION),
    {
      /**
       * ONLY identity reference.
       *
       * Tidak ada authorName,
       * authorUsername,
       * authorEmoji.
       */
      authorNrp,

      content: post.content,

      likes: [],

      replyCount: 0,

      isOfficerPost:
        post.isOfficerPost ??
        currentUser.isOfficer,

      imageUrls:
        post.imageUrls || [],

      isRepost:
        post.isRepost || false,

      originalPostId:
        post.originalPostId || null,

      quoteContent:
        post.quoteContent || null,

      createdAt,

      createdAtServer:
        serverTimestamp(),
    }
  );

  return {
    ...post,

    id: ref.id,

    authorNrp,

    likes: [],

    replyCount: 0,

    createdAt,
  };
}

export async function deletePost(
  postId: string
) {
  const repliesSnapshot =
    await getDocs(
      query(
        collection(db, REPLIES_COLLECTION),
        where('postId', '==', postId)
      )
    );

  await Promise.all(
    repliesSnapshot.docs.map((reply) =>
      deleteDoc(reply.ref)
    )
  );

  await deleteDoc(
    doc(
      db,
      POSTS_COLLECTION,
      postId
    )
  );
}

export async function toggleLikePost(
  postId: string,
  userNrp: string
): Promise<MbudiaryPost | null> {
  const normalizedNrp =
    userNrp.toLowerCase();

  const postRef = doc(
    db,
    POSTS_COLLECTION,
    postId
  );

  let updatedLikes: string[] | null =
    null;

  await runTransaction(
    db,
    async (transaction) => {
      const snapshot =
        await transaction.get(postRef);

      if (!snapshot.exists()) {
        return;
      }

      const data = snapshot.data();

      const likes: string[] =
        Array.isArray(data.likes)
          ? data.likes.map(
              (like: string) =>
                String(like).toLowerCase()
            )
          : [];

      const index =
        likes.indexOf(normalizedNrp);

      if (index >= 0) {
        likes.splice(index, 1);
      } else {
        likes.push(normalizedNrp);
      }

      updatedLikes = likes;

      transaction.update(
        postRef,
        { likes }
      );
    }
  );

  if (!updatedLikes) {
    return null;
  }

  const current =
    postsCache.find(
      (post) => post.id === postId
    );

  return current
    ? {
        ...current,
        likes: updatedLikes,
      }
    : null;
}

/* =========================================================
   REPLIES
   ========================================================= */

export function getAllReplies(): MbudiaryReply[] {
  return repliesCache;
}

export function getReplies(
  postId: string
): MbudiaryReply[] {
  return repliesCache.filter(
    (reply) =>
      reply.postId === postId
  );
}

export async function addReply(
  postId: string,
  content: string
): Promise<MbudiaryReply> {
  const currentUser =
    getUserProfile();

  const authorNrp =
    currentUser.nrp.toLowerCase();

  if (
    !authorNrp ||
    authorNrp === 'unknown'
  ) {
    throw new Error(
      'Tidak dapat membuat komentar: NRP tidak valid.'
    );
  }

  const createdAt =
    new Date().toISOString();

  const replyRef = await addDoc(
    collection(db, REPLIES_COLLECTION),
    {
      postId,

      /**
       * ONLY identity reference.
       */
      authorNrp,

      content,

      createdAt,

      createdAtServer:
        serverTimestamp(),
    }
  );

  await runTransaction(
    db,
    async (transaction) => {
      const postRef = doc(
        db,
        POSTS_COLLECTION,
        postId
      );

      const snapshot =
        await transaction.get(postRef);

      if (!snapshot.exists()) {
        return;
      }

      const count =
        Number(
          snapshot.data().replyCount
        ) || 0;

      transaction.update(
        postRef,
        {
          replyCount: count + 1,
        }
      );
    }
  );

  return {
    id: replyRef.id,

    postId,

    authorNrp,

    content,

    createdAt,
  };
}

/* =========================================================
   FOLLOWS
   ========================================================= */

export function getFollows(): string[] {
  const currentNrp =
    getUserProfile()
      .nrp
      .toLowerCase();

  return followsCache
    .filter(
      (follow) =>
        follow.followerNrp ===
        currentNrp
    )
    .map(
      (follow) =>
        follow.targetNrp
    );
}

export function isFollowing(
  targetNrp: string
): boolean {
  const target =
    targetNrp.toLowerCase();

  return getFollows().includes(
    target
  );
}

export async function toggleFollow(
  targetNrp: string
): Promise<boolean> {
  const followerNrp =
    getUserProfile()
      .nrp
      .toLowerCase();

  const target =
    targetNrp.toLowerCase();

  if (
    !followerNrp ||
    followerNrp === 'unknown' ||
    !target
  ) {
    throw new Error(
      'NRP follow tidak valid.'
    );
  }

  if (followerNrp === target) {
    throw new Error(
      'User tidak dapat mengikuti dirinya sendiri.'
    );
  }

  const followId =
    `${followerNrp}__${target}`;

  const followRef = doc(
    db,
    FOLLOWS_COLLECTION,
    followId
  );

  const currentlyFollowing =
    isFollowing(target);

  if (currentlyFollowing) {
    await deleteDoc(
      followRef
    );

    return false;
  }

  await setDoc(
    followRef,
    {
      followerNrp,
      targetNrp: target,
      createdAt:
        serverTimestamp(),
    }
  );

  return true;
}

export function getFollowerCount(
  targetNrp: string
): number {
  const target =
    targetNrp.toLowerCase();

  return followsCache.filter(
    (follow) =>
      follow.targetNrp === target
  ).length;
}

export function getFollowingCount(
  targetNrp: string
): number {
  const target =
    targetNrp.toLowerCase();

  return followsCache.filter(
    (follow) =>
      follow.followerNrp === target
  ).length;
}