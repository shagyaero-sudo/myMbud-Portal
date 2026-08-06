export interface MbudiaryPost {
  id: string;

  /**
   * Identity permanen user.
   * Semua relasi Mbudiary menggunakan NRP, bukan username/nickname.
   */
  authorNrp: string;

  content: string;

  /**
   * Array NRP user yang menyukai post.
   */
  likes: string[];

  replyCount: number;

  isOfficerPost?: boolean;

  /**
   * Digunakan untuk Poin 4.
   * URL gambar berasal dari Cloudinary.
   */
  imageUrls?: string[];

  /**
   * Digunakan untuk Poin 6.
   */
  isRepost?: boolean;
  originalPostId?: string;
  quoteContent?: string;

  createdAt: string;
}

export interface MbudiaryReply {
  id: string;

  postId: string;

  /**
   * Identity permanen user.
   */
  authorNrp: string;

  content: string;

  createdAt: string;
}

export interface UserProfile {
  /**
   * Primary identity.
   * Document ID Firestore = nrp.toLowerCase()
   */
  nrp: string;

  /**
   * Username/handle yang dapat berubah.
   * Harus unik di mbudiary_users.
   */
  username: string;

  /**
   * Nama tampilan.
   */
  nickname: string;

  isOfficer: boolean;

  emoji: string;
}

export interface MbudiaryUser {
  nrp: string;
  username: string;
  nickname: string;
  isOfficer: boolean;
  emoji: string;
  updatedAt?: string;
}

export interface MbudiaryFollow {
  followerNrp: string;
  targetNrp: string;
  createdAt: string;
}

export type FeedFilter =
  | 'all'
  | 'announcements'
  | 'my_posts'
  | 'liked';

export type FeedSort =
  | 'newest'
  | 'popular';