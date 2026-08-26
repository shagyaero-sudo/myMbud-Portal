import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MbudiaryPost, MbudiaryReply, UserProfile, MbudiaryUser } from '../../types';
import {
  toggleLikePost,
  getReplies,
  addReply,
  deletePost,
  getCachedUserByNrp,
  getPosts,
  savePost,
  toggleBookmarkPost,
  getBookmarkedPostIds,
  getUserByUsername,
  processMentionsInContent,
  searchUsersForMention,
  getFollowerCount,
} from './lib/storage';
import {
  formatDateFormatted,
  getOptimizedImageUrl,
} from './lib/utils';
import {
  Heart,
  MessageSquare,
  Send,
  CornerDownRight,
  MoreVertical,
  Trash2,
  Flag,
  X,
  Repeat2,
  Quote,
  Bookmark,
  AtSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  notifyPostLiked,
  notifyPostCommented,
} from '../../services/oneSignalNotification';

// =========================================================================
// BADGE CENTANG OTOMATIS + OVERRIDE MANUAL OFFICER (BIRU & EMAS)
// =========================================================================

export const getBadgeTier = (
  authorNrp?: string,
  isExplicitlyVerified?: boolean | string | null
): 'gold' | 'blue' | null => {
  if (isExplicitlyVerified === 'gold') {
    return 'gold';
  }
  if (isExplicitlyVerified === 'blue' || isExplicitlyVerified === true || isExplicitlyVerified === 'true') {
    if (authorNrp && getFollowerCount(authorNrp) >= 30) return 'gold';
    return 'blue';
  }

  if (authorNrp) {
    const count = getFollowerCount(authorNrp);
    if (count >= 30) return 'gold';
    if (count >= 10) return 'blue';
  }

  return null;
};

export const VerifiedBadge: React.FC<{
  authorNrp?: string;
  isVerified?: boolean | string | null;
  size?: 'sm' | 'md' | 'lg';
}> = ({ authorNrp, isVerified, size = 'sm' }) => {
  const tier = getBadgeTier(authorNrp, isVerified);

  if (!tier) return null;

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const isGold = tier === 'gold';

  return (
    <svg
      viewBox="0 0 24 24"
      aria-label={isGold ? 'Centang Emas' : 'Centang Biru'}
      className={`${sizeClasses[size]} shrink-0 select-none inline-block ${isGold ? 'drop-shadow-[0_1px_6px_rgba(245,158,11,0.65)]' : ''}`}
      style={{ color: isGold ? '#F59E0B' : '#1D9BF0' }}
    >
      <title>{isGold ? 'Centang Emas: Tier Legenda' : 'Centang Biru: Terverifikasi'}</title>
      <g>
        <path
          fill="currentColor"
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
        />
        <path
          fill="#FFFFFF"
          d="M10.25 16.5l-3.75-3.75 1.41-1.41 2.34 2.34 5.34-5.34 1.41 1.41-6.75 6.75z"
        />
      </g>
    </svg>
  );
};

// =========================================================================

const formatThreadsTime = (timestamp?: string | number | Date | null): string => {
  if (!timestamp) return 'baru saja';
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  if (isNaN(time)) return 'baru saja';
  const diffSec = Math.floor((now - time) / 1000);

  if (diffSec < 60) return 'baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}j`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}hr`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}mg`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}bln`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}thn`;
};

// KOMPONEN MEDIA GAMBAR INSTAN (ZERO DELAY & ZERO SKELETON FLASH)
const PostImageItem: React.FC<{
  imageUrl: string;
  layoutType: 'single' | 'grid' | 'carousel' | 'quote';
  onImageClick: (e: React.MouseEvent) => void;
}> = ({ imageUrl, layoutType, onImageClick }) => {
  if (layoutType === 'single' || layoutType === 'quote') {
    return (
      <button
        type="button"
        onClick={onImageClick}
        className="relative block w-full overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/10 cursor-zoom-in group text-left leading-none bg-transparent"
      >
        <img
          src={getOptimizedImageUrl(imageUrl)}
          alt="Post media"
          loading="lazy"
          decoding="async"
          className="w-full h-auto max-h-[600px] object-cover block rounded-2xl transition-transform duration-200 group-hover:scale-[1.01]"
        />
      </button>
    );
  }

  const containerClasses = {
    grid: 'w-full aspect-square',
    carousel: 'w-[75%] sm:w-[60%] shrink-0 aspect-square snap-start',
    quote: 'w-full',
  };

  return (
    <button
      type="button"
      onClick={onImageClick}
      className={`relative overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/50 dark:border-white/5 cursor-zoom-in group ${containerClasses[layoutType]}`}
    >
      <img
        src={getOptimizedImageUrl(imageUrl)}
        alt="Post media"
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
      />
    </button>
  );
};

interface PostCardProps {
  post: MbudiaryPost;
  currentUser: UserProfile;
  onPostUpdate?: () => void;
  onSelectPost?: (postId: string) => void;
  onSelectAuthor?: (authorNrp: string) => void;
  isDetailPage?: boolean;
}

const FormattedPostContent: React.FC<{
  content: string;
  onSelectAuthor?: (nrp: string) => void;
}> = ({ content, onSelectAuthor }) => {
  if (!content) return null;

  const parts = content.split(/(@[a-zA-Z0-9_.]+)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          const username = part.substring(1).toLowerCase();
          return (
            <span
              key={index}
              onClick={async (e) => {
                e.stopPropagation();
                const user = await getUserByUsername(username);
                if (user && onSelectAuthor) {
                  onSelectAuthor(user.nrp);
                }
              }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onPostUpdate,
  onSelectPost,
  onSelectAuthor,
  isDetailPage = false,
}) => {
  const [replies, setReplies] = useState<MbudiaryReply[]>(() => getReplies(post.id) || []);
  const [isRepliesExpanded, setIsRepliesExpanded] = useState<boolean>(isDetailPage);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  const [isLiked, setIsLiked] = useState<boolean>(() => (post.likes || []).includes(currentUser.nrp.toLowerCase()));
  const [likeCount, setLikeCount] = useState<number>((post.likes || []).length);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => getBookmarkedPostIds().includes(post.id));

  const [commentMentionSuggestions, setCommentMentionSuggestions] = useState<MbudiaryUser[]>([]);
  const [commentMentionQuery, setCommentMentionQuery] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteContent, setQuoteContent] = useState('');
  const [isReposting, setIsReposting] = useState(false);
  const [isQuoteFocused, setIsQuoteFocused] = useState(false);

  const [authorProfile, setAuthorProfile] = useState<MbudiaryUser | null>(() => getCachedUserByNrp(post.authorNrp));

  const allAvailablePosts = getPosts() || [];
  const originalPost = useMemo(() => {
    if (!post?.isRepost || !post?.originalPostId) return null;
    return allAvailablePosts.find((p) => String(p.id) === String(post.originalPostId)) || null;
  }, [post?.isRepost, post?.originalPostId, allAvailablePosts]);

  const originalAuthorProfile = useMemo(() => {
    if (!originalPost) return null;
    return getCachedUserByNrp(originalPost.authorNrp);
  }, [originalPost]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImage(null);
        setIsQuoteOpen(false);
        setQuoteContent('');
        setIsQuoteFocused(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshComponentData = () => {
    setIsLiked((post.likes || []).includes(currentUser.nrp.toLowerCase()));
    setLikeCount((post.likes || []).length);
    setReplies(getReplies(post.id) || []);
    setAuthorProfile(getCachedUserByNrp(post.authorNrp));
    setIsBookmarked(getBookmarkedPostIds().includes(post.id));
  };

  useEffect(() => {
    refreshComponentData();
    if (isDetailPage) {
      setIsRepliesExpanded(true);
    }

    window.addEventListener('mbud_users_change', refreshComponentData);
    window.addEventListener('mbud_posts_change', refreshComponentData);
    window.addEventListener('mbud_replies_change', refreshComponentData);
    window.addEventListener('mbud_bookmarks_change', refreshComponentData);
    window.addEventListener('mbud_follows_change', refreshComponentData);

    return () => {
      window.removeEventListener('mbud_users_change', refreshComponentData);
      window.removeEventListener('mbud_posts_change', refreshComponentData);
      window.removeEventListener('mbud_replies_change', refreshComponentData);
      window.removeEventListener('mbud_bookmarks_change', refreshComponentData);
      window.removeEventListener('mbud_follows_change', refreshComponentData);
    };
  }, [post.id, isDetailPage]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setReplyContent(val);

    const cursorPos = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtMatch = textBeforeCursor.match(/@([a-zA-Z0-9_.]*)$/);

    if (lastAtMatch) {
      const q = lastAtMatch[1];
      setCommentMentionQuery(q);
      setCommentMentionSuggestions(searchUsersForMention(q));
    } else {
      setCommentMentionQuery(null);
      setCommentMentionSuggestions([]);
    }
  };

  const selectCommentMentionUser = (username: string) => {
    if (!commentInputRef.current) return;
    const cursorPos = commentInputRef.current.selectionStart || replyContent.length;
    const textBeforeCursor = replyContent.slice(0, cursorPos);
    const textAfterCursor = replyContent.slice(cursorPos);

    const updatedBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_.]*)$/, `@${username} `);
    setReplyContent(updatedBefore + textAfterCursor);

    setCommentMentionQuery(null);
    setCommentMentionSuggestions([]);
    commentInputRef.current.focus();
  };

  const authorName = authorProfile?.nickname || authorProfile?.username || post?.authorName || 'Mbuders';
  const authorEmoji = authorProfile?.emoji || '😊';
  const authorPhotoUrl = authorProfile?.photoUrl;
  const actorName = currentUser.nickname || currentUser.username || 'Mbuders';

  const isQuoteRepost = Boolean(post?.isRepost && post?.quoteContent);
  const isPlainRepost = Boolean(post?.isRepost && !post?.quoteContent);

  const originalAuthorName = originalAuthorProfile?.nickname || originalAuthorProfile?.username || originalPost?.authorName || 'Mbuders';
  const originalAuthorEmoji = originalAuthorProfile?.emoji || '😊';
  const originalAuthorPhotoUrl = originalAuthorProfile?.photoUrl;

  const displayAuthorName = isPlainRepost && originalPost ? originalAuthorName : authorName;
  const displayAuthorEmoji = isPlainRepost && originalPost ? originalAuthorEmoji : authorEmoji;
  const displayAuthorPhotoUrl = isPlainRepost && originalPost ? originalAuthorPhotoUrl : authorPhotoUrl;
  const displayAuthorUsername = isPlainRepost && originalPost ? originalAuthorProfile?.username : authorProfile?.username;
  const displayAuthorNrp = isPlainRepost && originalPost ? originalPost.authorNrp : post.authorNrp;
  const displayCreatedAt = isPlainRepost && originalPost ? originalPost.createdAt : post.createdAt;
  const displayContent = isPlainRepost && originalPost ? originalPost.content : post.content;
  const displayImages = isPlainRepost && originalPost ? (originalPost.imageUrls || []) : (post.imageUrls || []);

  const quoteTargetPost = post.isRepost && originalPost ? originalPost : post;
  const quoteTargetAuthorProfile = post.isRepost && originalPost ? originalAuthorProfile : authorProfile;
  const quoteTargetAuthorName = post.isRepost && originalPost ? originalAuthorName : authorName;
  const quoteTargetAuthorUsername = post.isRepost && originalPost ? (originalAuthorProfile?.username || 'unknown') : (authorProfile?.username || 'unknown');
  const quoteTargetAuthorEmoji = post.isRepost && originalPost ? originalAuthorEmoji : authorEmoji;
  const quoteTargetAuthorPhotoUrl = post.isRepost && originalPost ? originalAuthorPhotoUrl : authorPhotoUrl;

  const handleLikeToggle = async () => {
    const wasLiked = isLiked;
    const updated = await toggleLikePost(post.id, currentUser.nrp);
    if (!updated) return;

    const nowLiked = (updated.likes || []).includes(currentUser.nrp.toLowerCase());
    setIsLiked(nowLiked);
    setLikeCount((updated.likes || []).length);

    if (!wasLiked && nowLiked) {
      void notifyPostLiked({
        postAuthorNrp: post.authorNrp,
        actorNrp: currentUser.nrp,
        actorName,
        postId: post.id,
      });
    }
  };

  const handleBookmarkToggle = () => {
    const updatedBookmarkStatus = toggleBookmarkPost(post.id);
    setIsBookmarked(updatedBookmarkStatus);
  };

  const handleCommentClick = () => {
    if (onSelectPost && !isDetailPage) {
      onSelectPost(post.id);
    } else {
      setIsRepliesExpanded((prev) => !prev);
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = replyContent.trim();
    if (!trimmedComment || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      await addReply(post.id, trimmedComment);
      setReplyContent('');
      setReplies(getReplies(post.id) || []);

      void notifyPostCommented({
        postAuthorNrp: post.authorNrp,
        actorNrp: currentUser.nrp,
        actorName,
        postId: post.id,
        comment: trimmedComment,
      });

      await processMentionsInContent({
        content: trimmedComment,
        senderNrp: currentUser.nrp,
        senderName: actorName,
        postId: post.id,
      });

      onPostUpdate?.();
    } catch (error) {
      console.error('[mbudiary] Gagal menambahkan komentar:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleQuoteRepost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteContent.trim() || isReposting) return;

    setIsReposting(true);
    try {
      const targetOriginalId = post.isRepost && post.originalPostId ? post.originalPostId : post.id;

      const newPost = await savePost({
        content: '',
        isOfficerPost: currentUser.isOfficer,
        imageUrls: [],
        isRepost: true,
        originalPostId: targetOriginalId,
        quoteContent: quoteContent.trim(),
      });

      await processMentionsInContent({
        content: quoteContent.trim(),
        senderNrp: currentUser.nrp,
        senderName: actorName,
        postId: newPost.id,
      });

      setQuoteContent('');
      setIsQuoteOpen(false);
      setIsQuoteFocused(false);
      onPostUpdate?.();
    } catch (error) {
      console.error('[mbudiary] Gagal melakukan quote repost:', error);
    } finally {
      setIsReposting(false);
    }
  };

  const handleDeletePost = async () => {
    setIsMenuOpen(false);
    if (!window.confirm('Apakah Anda yakin ingin menghapus postingan ini?')) return;

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      onPostUpdate?.();
    } catch (error) {
      console.error('[mbudiary] Gagal menghapus postingan:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReportPost = () => {
    setIsMenuOpen(false);
    alert('Laporan Anda telah diterima. Tim moderator akan meninjau postingan ini.');
  };

  const isAuthor = post.authorNrp.toLowerCase() === currentUser.nrp.toLowerCase();
  const canDelete = isAuthor || currentUser.isOfficer;
  const displayAuthorIsVerified = isPlainRepost && originalPost ? (originalAuthorProfile as any)?.isVerified : (authorProfile as any)?.isVerified;

  return (
    <>
      <article className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5 transition-colors duration-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none w-full">
        {/* REPOST INDICATOR */}
        {isPlainRepost && (
          <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 pl-11">
            <Repeat2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isAuthor ? 'Anda me-repost' : `${authorName} me-repost`}</span>
          </div>
        )}

        {/* 2-COLUMN STRUCTURE */}
        <div className="flex items-start gap-2.5 sm:gap-3">
          
          {/* AVATAR */}
          <div
            onClick={() => onSelectAuthor?.(displayAuthorNrp)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/60 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/80 dark:border-zinc-700/80 cursor-pointer hover:opacity-90 transition-opacity mt-0.5"
            title={`Lihat profil ${displayAuthorName}`}
          >
            {displayAuthorPhotoUrl ? (
              <img src={getOptimizedImageUrl(displayAuthorPhotoUrl)} alt={displayAuthorName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-lg leading-none">{displayAuthorEmoji}</span>
            )}
          </div>

          {/* MAIN CONTENT COLUMN */}
          <div className="flex-1 min-w-0">
            
            {/* HEADER COMPACT */}
            <div className="flex items-center justify-between gap-1 leading-none mb-1">
              <div
                onClick={() => onSelectAuthor?.(displayAuthorNrp)}
                className="flex items-center gap-1 min-w-0 flex-wrap sm:flex-nowrap cursor-pointer group/author"
              >
                <span className="text-slate-900 dark:text-zinc-100 font-bold text-xs sm:text-[13px] truncate group-hover/author:text-blue-500 transition-colors">
                  {displayAuthorName}
                </span>
                
                <VerifiedBadge authorNrp={displayAuthorNrp} isVerified={displayAuthorIsVerified} size="sm" />
                
                <span className="text-slate-400 dark:text-zinc-500 text-[11px] sm:text-xs truncate font-normal">
                  @{displayAuthorUsername || 'unknown'}
                </span>
                
                <span className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold select-none px-0.5">
                  •
                </span>
                
                <span className="text-slate-400 dark:text-zinc-500 text-[10px] sm:text-[11px] shrink-0 font-normal" title={formatDateFormatted(displayCreatedAt)}>
                  {formatThreadsTime(displayCreatedAt)}
                </span>
              </div>

              {/* TRIPLE DOT MENU */}
              <div ref={menuRef} className="relative shrink-0 -mr-1">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  disabled={isDeleting}
                  className="p-1 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-white/80 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-1 z-30 w-44 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl p-1.5 shadow-xl"
                    >
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={handleDeletePost}
                          disabled={isDeleting}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Postingan</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleReportPost}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50/80 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>Laporkan Postingan</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* KONTEN TEKS CERITA */}
            {isQuoteRepost && (
              <div className="text-[13px] sm:text-sm text-slate-800 dark:text-zinc-200 leading-snug whitespace-pre-line mb-1.5 font-normal">
                <FormattedPostContent content={post.quoteContent || ''} onSelectAuthor={onSelectAuthor} />
              </div>
            )}

            {!isQuoteRepost && displayContent && (
              <div className="text-[13px] sm:text-sm text-slate-800 dark:text-zinc-200 leading-snug whitespace-pre-line mb-1.5 font-normal">
                <FormattedPostContent content={displayContent} onSelectAuthor={onSelectAuthor} />
              </div>
            )}

            {/* EMBED KARTU KUTIPAN ASLI */}
            {isQuoteRepost && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (originalPost && onSelectPost) {
                    onSelectPost(originalPost.id);
                  }
                }}
                className="mb-2 rounded-xl border border-slate-200/60 dark:border-white/5 overflow-hidden bg-white/50 dark:bg-zinc-950/40 cursor-pointer hover:bg-white/80 dark:hover:bg-zinc-950/60 transition-colors w-full"
              >
                {originalPost ? (
                  <>
                    <div className="px-3 pt-2.5 pb-1 flex items-center gap-1 leading-none">
                      <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                        {originalAuthorPhotoUrl ? (
                          <img src={getOptimizedImageUrl(originalAuthorPhotoUrl)} alt={originalAuthorName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] leading-none">{originalAuthorEmoji}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 min-w-0 flex-1 leading-none">
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{originalAuthorName}</span>
                        <VerifiedBadge authorNrp={originalPost.authorNrp} isVerified={(originalAuthorProfile as any)?.isVerified} size="sm" />
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">@{originalAuthorProfile?.username || 'unknown'}</span>
                        <span className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold select-none px-0.5">•</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">{formatThreadsTime(originalPost.createdAt)}</span>
                      </div>
                    </div>

                    {originalPost.content && (
                      <div className="px-3 pb-2 text-xs text-slate-700 dark:text-zinc-300 leading-snug whitespace-pre-line">
                        <FormattedPostContent content={originalPost.content} onSelectAuthor={onSelectAuthor} />
                      </div>
                    )}

                    {/* GAMBAR POSTINGAN ASLI DI DALAM KARTU QUOTE */}
                    {Array.isArray(originalPost.imageUrls) && originalPost.imageUrls.length > 0 && (
                      <div className="px-3 pb-2.5">
                        {originalPost.imageUrls.length === 1 ? (
                          <PostImageItem
                            imageUrl={originalPost.imageUrls[0]}
                            layoutType="quote"
                            onImageClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(getOptimizedImageUrl(originalPost.imageUrls[0]));
                            }}
                          />
                        ) : (
                          <div className={`grid gap-1.5 w-full ${originalPost.imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            {originalPost.imageUrls.map((imgUrl, idx) => (
                              <PostImageItem
                                key={`${imgUrl}-${idx}`}
                                imageUrl={imgUrl}
                                layoutType="grid"
                                onImageClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImage(getOptimizedImageUrl(imgUrl));
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-2.5 text-xs italic text-slate-400 dark:text-zinc-500">
                    Postingan asli tidak dapat dimuat atau telah dihapus.
                  </div>
                )}
              </div>
            )}

            {/* GAMBAR POSTINGAN UTAMA */}
            {!isQuoteRepost && Array.isArray(displayImages) && displayImages.length > 0 && (
              <div className="mb-2 w-full">
                {displayImages.length === 1 && (
                  <PostImageItem
                    imageUrl={displayImages[0]}
                    layoutType="single"
                    onImageClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(getOptimizedImageUrl(displayImages[0]));
                    }}
                  />
                )}

                {displayImages.length === 3 && (
                  <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x snap-mandatory scroll-smooth custom-scrollbar -mx-0.5 px-0.5">
                    {displayImages.map((imageUrl, index) => (
                      <PostImageItem
                        key={`${imageUrl}-${index}`}
                        imageUrl={imageUrl}
                        layoutType="carousel"
                        onImageClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(getOptimizedImageUrl(imageUrl));
                        }}
                      />
                    ))}
                  </div>
                )}

                {(displayImages.length === 2 || displayImages.length >= 4) && (
                  <div className="grid grid-cols-2 gap-1.5 w-full">
                    {displayImages.map((imageUrl, index) => (
                      <PostImageItem
                        key={`${imageUrl}-${index}`}
                        imageUrl={imageUrl}
                        layoutType="grid"
                        onImageClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(getOptimizedImageUrl(imageUrl));
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="flex items-center gap-3 sm:gap-4 -ml-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLikeToggle}
                  className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md transition-all text-xs font-medium cursor-pointer ${isLiked ? 'text-rose-500 font-bold' : 'text-slate-400 dark:text-zinc-500 hover:text-rose-500'}`}
                >
                  <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span className="text-[11px] sm:text-xs">{likeCount}</span>
                </motion.button>

                <button
                  onClick={handleCommentClick}
                  className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md transition-all text-xs font-medium cursor-pointer ${isRepliesExpanded && isDetailPage ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400'}`}
                >
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-[11px] sm:text-xs">{post.replyCount || replies.length}</span>
                </button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setIsQuoteOpen(true)}
                  disabled={isReposting}
                  className="flex items-center gap-1.5 py-1 px-1.5 rounded-md transition-all text-xs font-medium cursor-pointer text-slate-400 dark:text-zinc-500 hover:text-emerald-500 disabled:opacity-50"
                  title="Quote Repost"
                >
                  <Repeat2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isReposting ? 'animate-pulse' : ''}`} />
                  <span className="text-[11px] sm:text-xs hidden xs:inline">Repost</span>
                </motion.button>
              </div>

              <div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBookmarkToggle}
                  className={`flex items-center justify-center p-1 rounded-md transition-all cursor-pointer ${isBookmarked ? 'text-amber-500' : 'text-slate-400 dark:text-zinc-500 hover:text-amber-500'}`}
                  title={isBookmarked ? 'Hapus Bookmark' : 'Simpan Postingan'}
                >
                  <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                </motion.button>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION KOMENTAR / BALASAN */}
        <AnimatePresence>
          {isRepliesExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 pt-2.5 border-t border-slate-200/40 dark:border-white/5 space-y-2 overflow-visible"
            >
              <h4 className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 pl-1">
                <CornerDownRight className="w-3 h-3 text-blue-500" />
                Komen & Balasan ({replies.length})
              </h4>

              <div className="space-y-1.5">
                {replies.length === 0 ? (
                  <div className="p-2.5 text-center rounded-xl bg-white/50 dark:bg-zinc-800/30 border border-slate-200/40 dark:border-white/5 text-xs text-slate-400 dark:text-zinc-500 italic">
                    Belum ada komen. Berikan tanggapan pertamamu!
                  </div>
                ) : (
                  replies.map((reply) => {
                    const replyAuthor = getCachedUserByNrp(reply.authorNrp);
                    const replyName = replyAuthor?.nickname || replyAuthor?.username || 'Mbuders';
                    const replyEmoji = replyAuthor?.emoji || '😊';
                    const replyPhotoUrl = replyAuthor?.photoUrl;

                    return (
                      <div key={reply.id} className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-white/5 space-y-1 w-full">
                        <div className="flex items-center justify-between text-xs">
                          <div onClick={() => onSelectAuthor?.(reply.authorNrp)} className="flex items-center gap-1 cursor-pointer group/replyAuthor min-w-0">
                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                              {replyPhotoUrl ? (
                                <img src={getOptimizedImageUrl(replyPhotoUrl)} alt={replyName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs leading-none">{replyEmoji}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 min-w-0 truncate leading-none">
                              <span className="text-slate-900 dark:text-zinc-100 font-bold text-xs group-hover/replyAuthor:text-blue-500 transition-colors truncate">
                                {replyName}
                              </span>
                              <VerifiedBadge authorNrp={reply.authorNrp} isVerified={(replyAuthor as any)?.isVerified} size="sm" />
                            </div>
                          </div>

                          <span className="text-slate-400 dark:text-zinc-500 text-[10px] shrink-0">
                            {formatThreadsTime(reply.createdAt)}
                          </span>
                        </div>

                        <p className="text-[13px] text-slate-700 dark:text-zinc-300 leading-snug pl-6">
                          <FormattedPostContent content={reply.content} onSelectAuthor={onSelectAuthor} />
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleAddReply} className="flex items-center gap-2 pt-1 relative">
                <div className="relative flex-1">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={replyContent}
                    onChange={handleCommentChange}
                    placeholder={`Tulis komen sebagai ${currentUser.nickname}...`}
                    className="w-full px-3 py-1.5 rounded-xl bg-white/70 dark:bg-zinc-800/80 text-xs border border-slate-200/80 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  {commentMentionQuery !== null && commentMentionSuggestions.length > 0 && (
                    <div className="absolute left-0 bottom-full mb-2 z-[60] w-64 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-2xl border border-slate-200/80 dark:border-zinc-700 rounded-2xl p-1.5 shadow-2xl max-h-52 overflow-y-auto custom-scrollbar">
                      <div className="text-[10px] font-bold text-slate-400 px-2 py-1 flex items-center gap-1">
                        <AtSign className="w-3 h-3 text-blue-500" />
                        <span>Pilih User</span>
                      </div>
                      {commentMentionSuggestions.map((u) => (
                        <div
                          key={u.nrp}
                          onClick={() => selectCommentMentionUser(u.username)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-700/70 cursor-pointer transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                            {u.photoUrl ? (
                              <img src={getOptimizedImageUrl(u.photoUrl)} alt={u.nickname} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm leading-none">{u.emoji}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">{u.nickname}</div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-400 truncate">@{u.username}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!replyContent.trim() || isSubmittingReply}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 dark:disabled:bg-zinc-800 text-white disabled:text-slate-400 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span className="hidden xs:inline text-xs">Kirim</span>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </article>

      {/* MODAL FORM QUOTE REPOST */}
      <AnimatePresence>
        {isQuoteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[999998] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isQuoteFocused ? 'pb-[26dvh] sm:pb-0' : 'pb-0'}`}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setIsQuoteOpen(false);
                setQuoteContent('');
                setIsQuoteFocused(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[85dvh]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2.5 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Quote Repost</h3>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Tambahkan komentar sebelum me-repost.</p>
                </div>
                <button type="button" onClick={() => { setIsQuoteOpen(false); setQuoteContent(''); setIsQuoteFocused(false); }} className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuoteRepost} className="flex flex-col flex-1 min-h-0">
                <textarea
                  autoFocus
                  value={quoteContent}
                  onChange={(e) => setQuoteContent(e.target.value)}
                  onFocus={() => setIsQuoteFocused(true)}
                  onBlur={() => setIsQuoteFocused(false)}
                  placeholder="Apa pendapatmu tentang postingan ini?"
                  rows={3}
                  className="w-full resize-none px-3 py-2 mb-2 rounded-xl bg-white/70 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0"
                />

                <div className="rounded-xl border border-slate-200/60 dark:border-white/5 overflow-y-auto bg-white/40 dark:bg-zinc-950/40 flex-1 min-h-0 mb-2.5 custom-scrollbar">
                  <div className="px-3 py-2 flex items-center gap-1 leading-none">
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {quoteTargetAuthorPhotoUrl ? (
                        <img src={getOptimizedImageUrl(quoteTargetAuthorPhotoUrl)} alt={quoteTargetAuthorName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] leading-none">{quoteTargetAuthorEmoji}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 flex items-center gap-1 leading-none">
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                        {quoteTargetAuthorName}
                      </span>
                      <VerifiedBadge authorNrp={quoteTargetPost?.authorNrp} isVerified={(quoteTargetAuthorProfile as any)?.isVerified} size="sm" />
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                        @{quoteTargetAuthorUsername}
                      </span>
                      <span className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold select-none px-0.5">•</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                        {formatThreadsTime(quoteTargetPost?.createdAt)}
                      </span>
                    </div>
                  </div>

                  {quoteTargetPost?.content && (
                    <div className="px-3 pb-2 text-xs text-slate-700 dark:text-zinc-300 leading-snug whitespace-pre-line">
                      <FormattedPostContent content={quoteTargetPost?.content || ''} onSelectAuthor={onSelectAuthor} />
                    </div>
                  )}

                  {Array.isArray(quoteTargetPost?.imageUrls) && quoteTargetPost.imageUrls.length > 0 && (
                    <div className="px-3 pb-2.5">
                      <img
                        src={getOptimizedImageUrl(quoteTargetPost.imageUrls[0])}
                        alt="Preview post asli"
                        className="w-full max-h-52 h-auto object-cover rounded-xl border border-slate-200/50 dark:border-white/5"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button type="button" onClick={() => { setIsQuoteOpen(false); setQuoteContent(''); setIsQuoteFocused(false); }} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">Batal</button>
                  <button type="submit" disabled={!quoteContent.trim() || isReposting} className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 dark:disabled:bg-zinc-800 text-white disabled:text-slate-400 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                    <Quote className="w-3.5 h-3.5" />
                    <span>{isReposting ? 'Memproses...' : 'Quote Repost'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {selectedImage && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999999] w-screen h-[100dvh] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedImage(null); }}>
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => setSelectedImage(null)} className="fixed top-6 right-5 sm:top-6 sm:right-6 z-[10000002] w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-white/20 text-white shadow-2xl backdrop-blur-md transition-all cursor-pointer">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
                <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1 }} className="relative z-[10000001] max-w-[95vw] max-h-[85dvh] flex items-center justify-center" onMouseDown={(e) => e.stopPropagation()}>
                  <img src={selectedImage} alt="Pratinjau" className="max-w-[95vw] max-h-[85dvh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};