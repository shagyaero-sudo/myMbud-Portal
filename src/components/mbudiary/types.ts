export interface MbudiaryNotification {
  id: string;
  recipientNrp: string;
  senderNrp: string;
  type: 'like' | 'reply' | 'repost' | 'follow' | 'mention';
  postId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface MbudiaryPost {
  id: string;
  authorNrp: string;
  authorName?: string;
  content: string;
  likes: string[];
  replyCount: number;
  isOfficerPost?: boolean;
  imageUrls?: string[];
  isRepost?: boolean;
  originalPostId?: string;
  quoteContent?: string;
  createdAt: string;
}

export interface MbudiaryReply {
  id: string;
  postId: string;
  authorNrp: string;
  content: string;
  createdAt: string;
}

export interface UserProfile {
  nrp: string;
  username: string;
  nickname: string;
  isOfficer: boolean;
  emoji: string;
  isVerified?: boolean | 'gold' | 'blue';
  photoUrl?: string;
  headerUrl?: string;
}

export interface MbudiaryUser {
  nrp: string;
  username: string;
  nickname: string;
  isOfficer: boolean;
  emoji: string;
  isVerified?: boolean | 'gold' | 'blue';
  photoUrl?: string;
  headerUrl?: string;
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