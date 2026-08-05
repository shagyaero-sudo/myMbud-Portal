export interface MbudiaryPost {
  id: string;
  authorName: string;
  authorUsername: string; // NRP or handle (e.g. "5025211001")
  authorEmoji?: string;
  content: string;
  likes: string[]; // Array of authorName/NRPs who liked the post
  replyCount: number;
  isOfficerPost?: boolean;
  createdAt: string; // ISO string or formatted timestamp
}

export interface MbudiaryReply {
  id: string;
  postId: string;
  authorName: string;
  authorUsername: string;
  authorEmoji?: string;
  content: string;
  createdAt: string;
}

export interface UserProfile {
  nickname: string;
  nrp: string;
  isOfficer: boolean;
  emoji?: string;
}

export type FeedFilter = 'all' | 'announcements' | 'my_posts' | 'liked';
export type FeedSort = 'newest' | 'popular';

