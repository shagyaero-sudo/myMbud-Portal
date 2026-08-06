import React, { useEffect, useRef, useState } from 'react';
import { MbudiaryPost, MbudiaryReply, UserProfile } from '../types';
import {
  toggleLikePost,
  getReplies,
  addReply,
  deletePost,
  getCachedUserByNrp,
  getPosts,
  savePost,
} from './lib/storage';
import { formatDateFormatted, formatTimeAgo, formatPostTimestamp } from './lib/utils';
import {
  Heart,
  MessageSquare,
  Send,
  CornerDownRight,
  MoreVertical,
  Trash2,
  X,
  Repeat2,
  Quote,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
  post: MbudiaryPost;
  currentUser: UserProfile;
  onPostUpdate?: () => void;
  onSelectPost?: (postId: string) => void;
  onSelectAuthor?: (authorNrp: string) => void;
  isDetailPage?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onPostUpdate,
  onSelectPost,
  onSelectAuthor,
  isDetailPage = false,
}) => {
  const [replies, setReplies] = useState<MbudiaryReply[]>([]);
  const [isRepliesExpanded, setIsRepliesExpanded] = useState(isDetailPage);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [isDeleting, setIsDeleting] = useState(false);

  /* =========================================================
     IMAGE LIGHTBOX
     ========================================================= */
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  /* =========================================================
     DELETE MENU & REPOST DROPDOWN MENU
     ========================================================= */
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRepostMenuOpen, setIsRepostMenuOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const repostMenuRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REPOST / QUOTE REPOST
     ========================================================= */
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteContent, setQuoteContent] = useState('');
  const [isReposting, setIsReposting] = useState(false);
  const [isQuoteFocused, setIsQuoteFocused] = useState(false);

  /* =========================================================
     CLOSE MENUS ON OUTSIDE CLICK
     ========================================================= */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }

      if (repostMenuRef.current && !repostMenuRef.current.contains(event.target as Node)) {
        setIsRepostMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /* =========================================================
     CLOSE IMAGE LIGHTBOX WITH ESC
     ========================================================= */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }

      if (event.key === 'Escape' && isQuoteOpen) {
        setIsQuoteOpen(false);
        setQuoteContent('');
        setIsQuoteFocused(false);
      }
    };

    if (selectedImage || isQuoteOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImage, isQuoteOpen]);

  /**
   * Identity post sekarang hanya authorNrp.
   * Profile visual diambil dari usersCache.
   */
  const [authorProfile, setAuthorProfile] = useState(
    getCachedUserByNrp(post.authorNrp)
  );

  const syncData = () => {
    setIsLiked(
      post.likes.includes(
        currentUser.nrp.toLowerCase()
      )
    );

    setLikeCount(
      post.likes.length
    );

    setReplies(
      getReplies(post.id)
    );

    setAuthorProfile(
      getCachedUserByNrp(
        post.authorNrp
      )
    );
  };

  useEffect(() => {
    syncData();

    if (isDetailPage) {
      setIsRepliesExpanded(true);
    }

    window.addEventListener(
      'mbud_users_change',
      syncData
    );

    window.addEventListener(
      'mbud_posts_change',
      syncData
    );

    window.addEventListener(
      'mbud_replies_change',
      syncData
    );

    return () => {
      window.removeEventListener(
        'mbud_users_change',
        syncData
      );

      window.removeEventListener(
        'mbud_posts_change',
        syncData
      );

      window.removeEventListener(
        'mbud_replies_change',
        syncData
      );
    };
  }, [
    post,
    currentUser,
    isDetailPage,
  ]);

  const authorName =
    authorProfile?.nickname ||
    authorProfile?.username ||
    'Mbuders';

  const authorEmoji =
    authorProfile?.emoji ||
    '😊';

  const authorPhotoUrl =
    authorProfile?.photoUrl;

  /* =========================================================
     ORIGINAL POST FOR REPOST
     ========================================================= */
  const originalPost =
    post.isRepost && post.originalPostId
      ? getPosts().find(
          (item) =>
            item.id === post.originalPostId
        )
      : null;

  const originalAuthorProfile =
    originalPost
      ? getCachedUserByNrp(
          originalPost.authorNrp
        )
      : null;

  const originalAuthorName =
    originalAuthorProfile?.nickname ||
    originalAuthorProfile?.username ||
    'Mbuders';

  const originalAuthorEmoji =
    originalAuthorProfile?.emoji ||
    '😊';

  const originalAuthorPhotoUrl =
    originalAuthorProfile?.photoUrl;

  /* =========================================================
     LOGIKA TAMPILAN DINAMIS
     ========================================================= */
  const isQuoteRepost =
    post.isRepost &&
    !!post.quoteContent;

  const isPlainRepost =
    post.isRepost &&
    !post.quoteContent;

  const displayAuthorName =
    isPlainRepost && originalPost
      ? originalAuthorName
      : authorName;

  const displayAuthorEmoji =
    isPlainRepost && originalPost
      ? originalAuthorEmoji
      : authorEmoji;

  const displayAuthorPhotoUrl =
    isPlainRepost && originalPost
      ? originalAuthorPhotoUrl
      : authorPhotoUrl;

  const displayAuthorUsername =
    isPlainRepost && originalPost
      ? originalAuthorProfile?.username
      : authorProfile?.username;

  const displayAuthorNrp =
    isPlainRepost && originalPost
      ? originalPost.authorNrp
      : post.authorNrp;

  const displayCreatedAt =
    isPlainRepost && originalPost
      ? originalPost.createdAt
      : post.createdAt;

  const displayContent =
    isPlainRepost && originalPost
      ? originalPost.content
      : post.content;

  const displayImages =
    isPlainRepost && originalPost
      ? originalPost.imageUrls
      : post.imageUrls;

  /* =========================================================
     LIKE
     ========================================================= */
  const handleLikeToggle =
    async () => {
      const updated =
        await toggleLikePost(
          post.id,
          currentUser.nrp
        );

      if (updated) {
        const hasLiked =
          updated.likes.includes(
            currentUser.nrp.toLowerCase()
          );

        setIsLiked(
          hasLiked
        );

        setLikeCount(
          updated.likes.length
        );
      }
    };

  /* =========================================================
     COMMENTS
     ========================================================= */
  const handleCommentClick =
    () => {
      if (
        onSelectPost &&
        !isDetailPage
      ) {
        onSelectPost(
          post.id
        );
      } else {
        setIsRepliesExpanded(
          (prev) => !prev
        );
      }
    };

  const handleAddReply =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (
        !replyContent.trim() ||
        isSubmittingReply
      ) {
        return;
      }

      setIsSubmittingReply(true);

      try {
        await addReply(
          post.id,
          replyContent.trim()
        );

        setReplyContent('');

        setReplies(
          getReplies(post.id)
        );

        onPostUpdate?.();
      } catch (error) {
        console.error(
          '[mbudiary] Gagal menambahkan komentar:',
          error
        );
      } finally {
        setIsSubmittingReply(false);
      }
    };

  /* =========================================================
     REPOST
     ========================================================= */
  const handleRepost =
    async () => {
      setIsRepostMenuOpen(false);

      if (isReposting) {
        return;
      }

      setIsReposting(true);

      try {
        await savePost({
          content: '',
          isOfficerPost:
            currentUser.isOfficer,
          imageUrls: [],
          isRepost: true,
          originalPostId:
            post.isRepost &&
            post.originalPostId
              ? post.originalPostId
              : post.id,
          quoteContent:
            undefined,
        });

        onPostUpdate?.();
      } catch (error) {
        console.error(
          '[mbudiary] Gagal melakukan repost:',
          error
        );
      } finally {
        setIsReposting(false);
      }
    };

  /* =========================================================
     QUOTE REPOST
     ========================================================= */
  const handleQuoteRepost =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (
        !quoteContent.trim() ||
        isReposting
      ) {
        return;
      }

      setIsReposting(true);

      try {
        await savePost({
          content: '',
          isOfficerPost:
            currentUser.isOfficer,
          imageUrls: [],
          isRepost: true,
          originalPostId:
            post.isRepost &&
            post.originalPostId
              ? post.originalPostId
              : post.id,
          quoteContent:
            quoteContent.trim(),
        });

        setQuoteContent('');
        setIsQuoteOpen(false);
        setIsQuoteFocused(false);

        onPostUpdate?.();
      } catch (error) {
        console.error(
          '[mbudiary] Gagal melakukan quote repost:',
          error
        );
      } finally {
        setIsReposting(false);
      }
    };

  /* =========================================================
     DELETE POST
     ========================================================= */
  const handleDeletePost =
    async () => {
      setIsMenuOpen(false);

      if (
        !window.confirm(
          'Apakah Anda yakin ingin menghapus postingan ini?'
        )
      ) {
        return;
      }

      setIsDeleting(true);

      try {
        await deletePost(
          post.id
        );

        onPostUpdate?.();
      } catch (error) {
        console.error(
          '[mbudiary] Gagal menghapus postingan:',
          error
        );
      } finally {
        setIsDeleting(false);
      }
    };

  const isAuthor =
    post.authorNrp.toLowerCase() ===
    currentUser.nrp.toLowerCase();

  const canDelete =
    isAuthor ||
    currentUser.isOfficer;

  const displayAuthorIsVerified =
    isPlainRepost &&
    originalPost
      ? !!originalAuthorProfile?.isVerified
      : !!authorProfile?.isVerified;

  return (
    <>
      <motion.article
        layout
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
        }}
        transition={{
          duration: 0.25,
        }}
        className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 transition-all duration-200 shadow-sm"
      >

        {/* =====================================================
            REPOST LABEL
            ===================================================== */}
        {isPlainRepost && (
          <div className="flex items-center gap-2 mb-3 text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
            <Repeat2 className="w-3.5 h-3.5 text-emerald-500" />

            <span>
              {isAuthor
                ? 'Anda me-repost'
                : `${authorName} me-repost`}
            </span>
          </div>
        )}

        {/* =====================================================
            AUTHOR HEADER
            ===================================================== */}
        <div className="flex items-start justify-between gap-3 mb-3">

          <div
            onClick={() =>
              onSelectAuthor?.(
                displayAuthorNrp
              )
            }
            className="flex items-center gap-3 cursor-pointer group/author"
            title={`Lihat profil ${displayAuthorName}`}
          >

            {/* AVATAR / PHOTO / EMOJI */}
            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100 dark:border-zinc-800 group-hover/author:scale-105 transition-transform">
              {displayAuthorPhotoUrl ? (
                <img
                  src={displayAuthorPhotoUrl}
                  alt={displayAuthorName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span className="text-2xl leading-none">
                  {displayAuthorEmoji}
                </span>
              )}
            </div>

            <div>

              {/* NAME + VERIFIED */}
              <div className="flex items-center flex-wrap gap-1.5">

                <span className="text-slate-900 dark:text-zinc-100 font-bold text-sm group-hover/author:text-indigo-600 dark:group-hover/author:text-indigo-400 transition-colors">
                  {displayAuthorName}
                </span>

                {/* VERIFIED BADGE */}
                {displayAuthorIsVerified && (
                  <span
                    className="inline-flex items-center justify-center shrink-0 w-3.5 h-3.5 rounded-full bg-blue-500 text-white"
                    title="Akun terverifikasi"
                    aria-label="Akun terverifikasi"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-2.5 h-2.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-3.25-3.25A1 1 0 0 1 6.21 9.29l2.543 2.543 6.543-6.543a1 1 0 0 1 1.408 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}

              </div>

              <div className="text-slate-400 dark:text-zinc-500 text-[10px] mt-0.5">
                @{displayAuthorUsername || 'unknown'}
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-[10px] mt-0.5">
                <span
                  title={formatDateFormatted(displayCreatedAt)}
                >
                  {formatPostTimestamp(
                    displayCreatedAt
                  )}
                </span>
              </div>

            </div>
          </div>

          {/* THREE DOT MENU */}
          {canDelete && (
            <div
              ref={menuRef}
              className="relative shrink-0"
            >
              <button
                type="button"
                onClick={() =>
                  setIsMenuOpen(
                    (prev) => !prev
                  )
                }
                disabled={isDeleting}
                className="p-1.5 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Opsi postingan"
                aria-expanded={
                  isMenuOpen
                }
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -4,
                      scale: 0.97,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: -4,
                      scale: 0.97,
                    }}
                    transition={{
                      duration: 0.12,
                    }}
                    className="absolute right-0 top-full mt-1.5 z-30 w-44 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-1.5 shadow-xl"
                  >
                    <button
                      type="button"
                      onClick={
                        handleDeletePost
                      }
                      disabled={
                        isDeleting
                      }
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />

                      <span>
                        Hapus Postingan
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* =====================================================
            QUOTE TEXT
            ===================================================== */}
        {isQuoteRepost && (
          <div className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line mb-4 font-normal">
            {post.quoteContent}
          </div>
        )}

        {/* =====================================================
            MAIN CONTENT
            ===================================================== */}
        {!isQuoteRepost &&
          displayContent && (
            <div className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line mb-4 font-normal">
              {displayContent}
            </div>
          )}

        {/* =====================================================
            NESTED ORIGINAL POST CARD
            ===================================================== */}
        {isQuoteRepost &&
          originalPost && (
            <div
              onClick={() =>
                onSelectPost?.(
                  originalPost.id
                )
              }
              className="mb-4 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-slate-50/50 dark:bg-zinc-800/40 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-zinc-800 transition-colors"
              title="Lihat postingan asli"
            >
              <div className="px-3.5 pt-3 pb-2 flex items-center gap-2">

                {/* ORIGINAL AUTHOR AVATAR */}
                <div className="w-6 h-6 rounded-xl bg-slate-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                  {originalAuthorPhotoUrl ? (
                    <img
                      src={originalAuthorPhotoUrl}
                      alt={originalAuthorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm leading-none">
                      {originalAuthorEmoji}
                    </span>
                  )}
                </div>

                <div className="min-w-0">

                  {/* ORIGINAL NAME + VERIFIED */}
                  <div className="flex items-center gap-1.5 min-w-0">

                    <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                      {originalAuthorName}
                    </div>

                    {originalAuthorProfile?.isVerified && (
                      <span
                        className="inline-flex items-center justify-center shrink-0 w-3.5 h-3.5 rounded-full bg-blue-500 text-white"
                        title="Akun terverifikasi"
                        aria-label="Akun terverifikasi"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-2.5 h-2.5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-3.25-3.25A1 1 0 0 1 6.21 9.29l2.543 2.543 6.543-6.543a1 1 0 0 1 1.408 0Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}

                  </div>

                  <div className="text-[9px] text-slate-400 dark:text-zinc-500">
                    @{originalAuthorProfile?.username || 'unknown'}
                  </div>

                </div>
              </div>

              {originalPost.content && (
                <div className="px-3.5 pb-3 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {originalPost.content}
                </div>
              )}

              {originalPost.imageUrls &&
                originalPost.imageUrls.length > 0 && (
                  <div
                    className={`grid gap-1.5 px-2 pb-2 ${
                      originalPost.imageUrls.length === 1
                        ? 'grid-cols-1'
                        : 'grid-cols-2'
                    }`}
                  >
                    {originalPost.imageUrls.map(
                      (
                        imageUrl,
                        index
                      ) => (
                        <div
                          key={`${imageUrl}-${index}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(
                              imageUrl
                            );
                          }}
                          className={`relative overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800 ${
                            originalPost.imageUrls?.length === 1
                              ? 'max-h-[400px]'
                              : 'aspect-square'
                          }`}
                        >
                          <img
                            src={imageUrl}
                            alt={`Gambar repost ${
                              index + 1
                            }`}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )
                    )}
                  </div>
                )}
            </div>
          )}

        {/* =====================================================
            ORIGINAL POST DELETED NOTICE
            ===================================================== */}
        {post.isRepost &&
          !originalPost && (
            <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 text-xs text-slate-400 dark:text-zinc-500 italic">
              Postingan asli sudah tidak tersedia.
            </div>
          )}

        {/* =====================================================
            IMAGES
            ===================================================== */}
        {!isQuoteRepost &&
          displayImages &&
          displayImages.length > 0 && (
            <div
              className={`mb-4 grid gap-2 ${
                displayImages.length === 1
                  ? 'grid-cols-1'
                  : 'grid-cols-2'
              }`}
            >
              {displayImages.map(
                (
                  imageUrl,
                  index
                ) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() =>
                      setSelectedImage(
                        imageUrl
                      )
                    }
                    className={`relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-indigo-500 group ${
                      displayImages.length === 1
                        ? 'max-h-[520px]'
                        : 'aspect-square'
                    }`}
                    title="Klik untuk melihat gambar"
                  >
                    <img
                      src={imageUrl}
                      alt={`Gambar postingan ${
                        index + 1
                      }`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      onError={(e) => {
                        e.currentTarget.style.display =
                          'none';
                      }}
                    />

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                  </button>
                )
              )}
            </div>
          )}

        {/* =====================================================
            ACTIONS
            ===================================================== */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs">

          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* LIKE */}
            <motion.button
              whileTap={{
                scale: 0.9,
              }}
              onClick={
                handleLikeToggle
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs ${
                isLiked
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 font-bold border border-rose-200/80 dark:border-rose-900/50'
                  : 'text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50/60 dark:hover:bg-zinc-800/80 border border-transparent'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  isLiked
                    ? 'fill-rose-500 text-rose-500 scale-110'
                    : ''
                }`}
              />

              <span>
                {likeCount}
              </span>
            </motion.button>

            {/* COMMENT */}
            <button
              onClick={
                handleCommentClick
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs ${
                isRepliesExpanded &&
                isDetailPage
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/80 dark:border-indigo-900/50'
                  : 'text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-zinc-800/80 border border-transparent'
              }`}
            >
              <MessageSquare className="w-4 h-4" />

              <span>
                {post.replyCount ||
                  replies.length}
              </span>
            </button>

            {/* REPOST DROPDOWN MENU */}
            <div
              ref={repostMenuRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setIsRepostMenuOpen(
                    (prev) => !prev
                  )
                }
                disabled={
                  isReposting
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs ${
                  isRepostMenuOpen
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200/80 dark:border-emerald-900/50'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-zinc-800/80 border border-transparent disabled:opacity-50'
                }`}
                title="Repost atau Quote"
              >
                <Repeat2
                  className={`w-4 h-4 ${
                    isReposting
                      ? 'animate-pulse'
                      : ''
                  }`}
                />

                <span className="hidden xs:inline">
                  Repost
                </span>
              </button>

              <AnimatePresence>
                {isRepostMenuOpen && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -4,
                      scale: 0.97,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: -4,
                      scale: 0.97,
                    }}
                    transition={{
                      duration: 0.12,
                    }}
                    className="absolute left-0 bottom-full mb-1.5 z-30 w-44 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-1.5 shadow-xl"
                  >
                    <button
                      type="button"
                      onClick={
                        handleRepost
                      }
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Repeat2 className="w-4 h-4" />

                      <span>
                        Repost
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsRepostMenuOpen(
                          false
                        );

                        setIsQuoteOpen(
                          true
                        );
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Quote className="w-4 h-4" />

                      <span>
                        Quote Repost
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* =====================================================
            REPLIES
            ===================================================== */}
        <AnimatePresence>
          {isRepliesExpanded && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: 'auto',
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-3 overflow-hidden"
            >

              <div className="flex items-center justify-between">

                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <CornerDownRight className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />

                  Komen & Balasan (
                  {replies.length}
                  )
                </h4>

              </div>

              <div className="space-y-2.5">

                {replies.length === 0 ? (
                  <div className="p-3 text-center rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 text-xs text-slate-400 dark:text-zinc-500 italic">
                    Belum ada komen. Berikan tanggapan pertamamu!
                  </div>
                ) : (
                  replies.map(
                    (reply) => {
                      const replyAuthor =
                        getCachedUserByNrp(
                          reply.authorNrp
                        );

                      const replyName =
                        replyAuthor?.nickname ||
                        replyAuthor?.username ||
                        'Mbuders';

                      const replyEmoji =
                        replyAuthor?.emoji ||
                        '😊';

                      const replyPhotoUrl =
                        replyAuthor?.photoUrl;

                      return (
                        <div
                          key={
                            reply.id
                          }
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1"
                        >

                          <div className="flex items-center justify-between text-xs">

                            <div
                              onClick={() =>
                                onSelectAuthor?.(
                                  reply.authorNrp
                                )
                              }
                              className="flex items-center gap-2 cursor-pointer group/replyAuthor"
                            >

                              {/* REPLY AUTHOR AVATAR */}
                              <div className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                                {replyPhotoUrl ? (
                                  <img
                                    src={replyPhotoUrl}
                                    alt={replyName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs leading-none">
                                    {replyEmoji}
                                  </span>
                                )}
                              </div>

                              {/* REPLY NAME + VERIFIED */}
                              <div className="flex items-center gap-1.5 min-w-0">

                                <span className="text-slate-900 dark:text-zinc-100 font-bold group-hover/replyAuthor:text-indigo-600 dark:group-hover/replyAuthor:text-indigo-400 transition-colors">
                                  {replyName}
                                </span>

                                {replyAuthor?.isVerified && (
                                  <span
                                    className="inline-flex items-center justify-center shrink-0 w-3.5 h-3.5 rounded-full bg-blue-500 text-white"
                                    title="Akun terverifikasi"
                                    aria-label="Akun terverifikasi"
                                  >
                                    <svg
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      className="w-2.5 h-2.5"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-3.25-3.25A1 1 0 0 1 6.21 9.29l2.543 2.543 6.543-6.543a1 1 0 0 1 1.408 0Z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </span>
                                )}

                              </div>

                            </div>

                            <span className="text-slate-400 dark:text-zinc-500 text-[10px]">
                              {formatTimeAgo(
                                reply.createdAt
                              )}
                            </span>

                          </div>

                          <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed pl-7">
                            {reply.content}
                          </p>

                        </div>
                      );
                    }
                  )
                )}

              </div>

              <form
                onSubmit={
                  handleAddReply
                }
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={
                    replyContent
                  }
                  onChange={(e) =>
                    setReplyContent(
                      e.target.value
                    )
                  }
                  placeholder={`Tulis komen sebagai ${currentUser.nickname}...`}
                  className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  type="submit"
                  disabled={
                    !replyContent.trim() ||
                    isSubmittingReply
                  }
                  className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 dark:disabled:bg-zinc-800 text-white disabled:text-slate-400 text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />

                  <span className="hidden xs:inline">
                    Kirim
                  </span>
                </button>

              </form>

            </motion.div>
          )}
        </AnimatePresence>

      </motion.article>

      {/* =======================================================
          QUOTE REPOST MODAL
          ======================================================= */}
      <AnimatePresence>
        {isQuoteOpen && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className={`fixed inset-0 z-[999998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
              isQuoteFocused
                ? 'pb-[26dvh] sm:pb-0'
                : 'pb-0'
            }`}
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                setIsQuoteOpen(false);
                setQuoteContent('');
                setIsQuoteFocused(false);
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              transition={{
                duration: 0.18,
              }}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[85dvh]"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              <div className="flex items-center justify-between mb-4 shrink-0">

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Quote Repost
                  </h3>

                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                    Tambahkan komentar sebelum me-repost.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsQuoteOpen(
                      false
                    );
                    setQuoteContent(
                      ''
                    );
                    setIsQuoteFocused(
                      false
                    );
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

              </div>

              <form
                onSubmit={
                  handleQuoteRepost
                }
                className="flex flex-col flex-1 min-h-0"
              >

                <textarea
                  autoFocus
                  value={
                    quoteContent
                  }
                  onChange={(e) =>
                    setQuoteContent(
                      e.target.value
                    )
                  }
                  onFocus={() =>
                    setIsQuoteFocused(
                      true
                    )
                  }
                  onBlur={() =>
                    setIsQuoteFocused(
                      false
                    )
                  }
                  placeholder="Apa pendapatmu tentang postingan ini?"
                  rows={3}
                  className="w-full resize-none px-3.5 py-3 mb-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
                />

                <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-y-auto bg-slate-50/50 dark:bg-zinc-800/40 flex-1 min-h-0 mb-3 custom-scrollbar">

                  <div className="px-3 py-2.5 flex items-center gap-2">

                    {/* PREVIEW AVATAR */}
                    <div className="w-6 h-6 rounded-xl bg-slate-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {(post.isRepost && originalPost ? originalAuthorPhotoUrl : authorPhotoUrl) ? (
                        <img
                          src={post.isRepost && originalPost ? originalAuthorPhotoUrl : authorPhotoUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm leading-none">
                          {post.isRepost && originalPost ? originalAuthorEmoji : authorEmoji}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">

                      <div className="flex items-center gap-1.5 min-w-0">

                        <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {post.isRepost &&
                          originalPost
                            ? originalAuthorName
                            : authorName}
                        </div>

                        {(post.isRepost &&
                        originalPost
                          ? originalAuthorProfile?.isVerified
                          : authorProfile?.isVerified) && (
                          <span
                            className="inline-flex items-center justify-center shrink-0 w-3.5 h-3.5 rounded-full bg-blue-500 text-white"
                            title="Akun terverifikasi"
                            aria-label="Akun terverifikasi"
                          >
                            <svg
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-2.5 h-2.5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-3.25-3.25A1 1 0 0 1 6.21 9.29l2.543 2.543 6.543-6.543a1 1 0 0 1 1.408 0Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        )}

                      </div>

                      <div className="text-[9px] text-slate-400 dark:text-zinc-500">
                        @{post.isRepost &&
                        originalPost
                          ? originalAuthorProfile?.username ||
                            'unknown'
                          : authorProfile?.username ||
                            'unknown'}
                      </div>

                    </div>
                  </div>

                  <div className="px-3 pb-3 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                    {post.isRepost &&
                    originalPost
                      ? originalPost.content ||
                        'Postingan dengan gambar'
                      : post.content ||
                        'Postingan dengan gambar'}
                  </div>

                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">

                  <button
                    type="button"
                    onClick={() => {
                      setIsQuoteOpen(
                        false
                      );
                      setQuoteContent(
                        ''
                      );
                      setIsQuoteFocused(
                        false
                      );
                    }}
                    className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={
                      !quoteContent.trim() ||
                      isReposting
                    }
                    className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 dark:disabled:bg-zinc-800 text-white disabled:text-slate-400 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Quote className="w-3.5 h-3.5" />

                    <span>
                      {isReposting
                        ? 'Memproses...'
                        : 'Quote Repost'}
                    </span>
                  </button>

                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================================================
          IMAGE LIGHTBOX / POPUP
          ======================================================= */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
            }}
            className="fixed inset-0 z-[999999] w-screen h-[100dvh] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                setSelectedImage(
                  null
                );
              }
            }}
          >

            <motion.button
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
              }}
              transition={{
                duration: 0.2,
              }}
              type="button"
              onClick={() =>
                setSelectedImage(
                  null
                )
              }
              className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[1000000] w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 active:bg-black/90 border border-white/20 text-white shadow-2xl backdrop-blur-md transition-all"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.92,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.92,
                y: 10,
              }}
              transition={{
                duration: 0.2,
                ease: 'easeOut',
              }}
              className="relative z-[999999] max-w-[95vw] max-h-[90dvh] flex items-center justify-center"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >
              <img
                src={selectedImage}
                alt="Pratinjau gambar postingan"
                className="max-w-[95vw] max-h-[90dvh] w-auto h-auto object-contain rounded-2xl shadow-2xl select-none"
                draggable={false}
              />
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};