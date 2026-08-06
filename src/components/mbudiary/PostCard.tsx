import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  MbudiaryPost,
  MbudiaryReply,
  UserProfile,
} from '../types';

import {
  toggleLikePost,
  getReplies,
  addReply,
  deletePost,
  getCachedUserByNrp,
} from './lib/storage';

import {
  formatDateFormatted,
  formatTimeAgo,
  formatPostTimestamp,
} from './lib/utils';

import {
  Heart,
  MessageSquare,
  Send,
  CornerDownRight,
  MoreVertical,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

interface PostCardProps {
  post: MbudiaryPost;
  currentUser: UserProfile;
  onPostUpdate?: () => void;
  onSelectPost?: (postId: string) => void;
  onSelectAuthor?: (authorNrp: string) => void;
  isDetailPage?: boolean;
}

export const PostCard: React.FC<
  PostCardProps
> = ({
  post,
  currentUser,
  onPostUpdate,
  onSelectPost,
  onSelectAuthor,
  isDetailPage = false,
}) => {
  const [replies, setReplies] =
    useState<MbudiaryReply[]>([]);

  const [
    isRepliesExpanded,
    setIsRepliesExpanded,
  ] = useState(isDetailPage);

  const [replyContent, setReplyContent] =
    useState('');

  const [
    isSubmittingReply,
    setIsSubmittingReply,
  ] = useState(false);

  const [isLiked, setIsLiked] =
    useState(false);

  const [likeCount, setLikeCount] =
    useState(post.likes.length);

  const [isDeleting, setIsDeleting] =
    useState(false);

  /* =========================================================
     IMAGE LIGHTBOX
     ========================================================= */

  const [
    selectedImageIndex,
    setSelectedImageIndex,
  ] = useState<number | null>(null);

  const isLightboxOpen =
    selectedImageIndex !== null;

  const imageUrls =
    post.imageUrls || [];

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const openLightbox = (
    index: number
  ) => {
    setSelectedImageIndex(index);
  };

  const showPreviousImage = () => {
    if (
      selectedImageIndex === null ||
      imageUrls.length <= 1
    ) {
      return;
    }

    setSelectedImageIndex(
      (selectedImageIndex -
        1 +
        imageUrls.length) %
        imageUrls.length
    );
  };

  const showNextImage = () => {
    if (
      selectedImageIndex === null ||
      imageUrls.length <= 1
    ) {
      return;
    }

    setSelectedImageIndex(
      (selectedImageIndex + 1) %
        imageUrls.length
    );
  };

  /**
   * Keyboard controls + lock body scroll
   * while lightbox is open.
   */
  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        closeLightbox();
      }

      if (event.key === 'ArrowLeft') {
        showPreviousImage();
      }

      if (event.key === 'ArrowRight') {
        showNextImage();
      }
    };

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        originalOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    isLightboxOpen,
    selectedImageIndex,
    imageUrls.length,
  ]);

  /* =========================================================
     DELETE MENU
     ========================================================= */

  const [
    isMenuOpen,
    setIsMenuOpen,
  ] = useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  /**
   * Close the three-dot menu
   * when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener(
        'mousedown',
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, [isMenuOpen]);

  /**
   * IMPORTANT:
   *
   * Identity post sekarang hanya authorNrp.
   *
   * Profile visual diambil dari usersCache.
   */
  const [
    authorProfile,
    setAuthorProfile,
  ] = useState(
    getCachedUserByNrp(
      post.authorNrp
    )
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

        setIsLiked(hasLiked);

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
        onSelectPost(post.id);
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

  /**
   * Hak hapus berdasarkan NRP,
   * bukan username/nickname.
   */
  const isAuthor =
    post.authorNrp.toLowerCase() ===
    currentUser.nrp.toLowerCase();

  const canDelete =
    isAuthor ||
    currentUser.isOfficer;

  return (
    <>
      {/* =====================================================
          POST CARD
          ===================================================== */}

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
            AUTHOR HEADER
            ===================================================== */}

        <div className="flex items-start justify-between gap-3 mb-3">

          {/* AUTHOR INFO */}

          <div
            onClick={() =>
              onSelectAuthor?.(
                post.authorNrp
              )
            }
            className="flex items-center gap-3 cursor-pointer group/author"
            title={`Lihat profil ${authorName}`}
          >
            <span className="text-2xl shrink-0 group-hover/author:scale-110 transition-transform leading-none">
              {authorEmoji}
            </span>

            <div>
              {/* NAME */}

              <div className="flex items-center flex-wrap gap-1.5">
                <span className="text-slate-900 dark:text-zinc-100 font-bold text-sm group-hover/author:text-indigo-600 dark:group-hover/author:text-indigo-400 transition-colors">
                  {authorName}
                </span>
              </div>

              {/* USERNAME */}

              <div className="text-slate-400 dark:text-zinc-500 text-[10px] mt-0.5">
                @{authorProfile?.username || 'unknown'}
              </div>

              {/* TIMESTAMP */}

              <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-[10px] mt-0.5">
                <span
                  title={formatDateFormatted(
                    post.createdAt
                  )}
                >
                  {formatPostTimestamp(
                    post.createdAt
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ===================================================
              THREE DOT MENU
              =================================================== */}

          {canDelete && (
            <div
              ref={menuRef}
              className="relative shrink-0"
            >
              {/* THREE DOT BUTTON */}

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
                aria-label="Opsi postingan"
                aria-expanded={
                  isMenuOpen
                }
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* DROPDOWN MENU */}

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
            CONTENT
            ===================================================== */}

        <div className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line mb-4 font-normal">
          {post.content}
        </div>

        {/* =====================================================
            IMAGES
            ===================================================== */}

        {imageUrls.length > 0 && (
          <div
            className={`mb-4 grid gap-2 ${
              imageUrls.length === 1
                ? 'grid-cols-1'
                : 'grid-cols-2'
            }`}
          >
            {imageUrls.map(
              (
                imageUrl,
                index
              ) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  onClick={() =>
                    openLightbox(index)
                  }
                  className={`relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-indigo-500 group ${
                    imageUrls.length === 1
                      ? 'max-h-[520px]'
                      : 'aspect-square'
                  }`}
                  title="Klik untuk melihat gambar"
                  aria-label={`Lihat gambar ${
                    index + 1
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Gambar postingan ${
                      index + 1
                    }`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    onError={(e) => {
                      console.error(
                        '[mbudiary] Gagal memuat gambar:',
                        imageUrl
                      );

                      e.currentTarget.style.display =
                        'none';
                    }}
                  />

                  {/* Hover overlay */}

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
          <div className="flex items-center gap-2 sm:gap-3">

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
                  : 'text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50/60 dark:hover:bg-zinc-800/80'
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
                  : 'text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-zinc-800/80'
              }`}
            >
              <MessageSquare className="w-4 h-4" />

              <span>
                {post.replyCount ||
                  replies.length}
              </span>

              <span className="hidden xs:inline">
                Komen
              </span>
            </button>
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
              {/* REPLY HEADER */}

              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <CornerDownRight className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />

                  Komen & Balasan (
                  {replies.length}
                  )
                </h4>
              </div>

              {/* REPLY LIST */}

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

                      return (
                        <div
                          key={reply.id}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1"
                        >
                          {/* REPLY AUTHOR */}

                          <div className="flex items-center justify-between text-xs">
                            <div
                              onClick={() =>
                                onSelectAuthor?.(
                                  reply.authorNrp
                                )
                              }
                              className="flex items-center gap-2 cursor-pointer group/replyAuthor"
                              title={`Lihat profil ${replyName}`}
                            >
                              <span className="text-base shrink-0 group-hover/replyAuthor:scale-110 transition-transform leading-none">
                                {replyEmoji}
                              </span>

                              <span className="text-slate-900 dark:text-zinc-100 font-bold group-hover/replyAuthor:text-indigo-600 dark:group-hover/replyAuthor:text-indigo-400 transition-colors">
                                {replyName}
                              </span>
                            </div>

                            <span className="text-slate-400 dark:text-zinc-500 text-[10px]">
                              {formatTimeAgo(
                                reply.createdAt
                              )}
                            </span>
                          </div>

                          {/* REPLY CONTENT */}

                          <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed pl-7">
                            {reply.content}
                          </p>
                        </div>
                      );
                    }
                  )
                )}
              </div>

              {/* ADD REPLY */}

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

      {/* =====================================================
          FULLSCREEN IMAGE LIGHTBOX
          
          IMPORTANT:
          z-[9999] sengaja dibuat jauh lebih tinggi
          daripada mobile bottom navigation (z-40)
          dan bottom sheet (z-50).
          ===================================================== */}

      <AnimatePresence>
        {isLightboxOpen &&
          selectedImageIndex !== null &&
          imageUrls[
            selectedImageIndex
          ] && (
            <motion.div
              key="image-lightbox"
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
                duration: 0.18,
              }}
              className="fixed inset-0 z-[9999] w-screen h-screen bg-black/95 flex items-center justify-center"
              onClick={closeLightbox}
            >
              {/* =================================================
                  TOP RIGHT FLOATING CLOSE BUTTON
                  ================================================= */}

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  closeLightbox();
                }}
                className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[10001] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/60"
                aria-label="Tutup gambar"
                title="Tutup"
              >
                <X className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>

              {/* =================================================
                  IMAGE COUNTER
                  ================================================= */}

              {imageUrls.length > 1 && (
                <div
                  className="fixed top-5 left-1/2 -translate-x-1/2 z-[10001] px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-white text-xs font-medium"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  {selectedImageIndex + 1} /{' '}
                  {imageUrls.length}
                </div>
              )}

              {/* =================================================
                  PREVIOUS BUTTON
                  ================================================= */}

              {imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    showPreviousImage();
                  }}
                  className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-[10001] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-2xl transition-all focus:outline-none focus:ring-2 focus:ring-white/60"
                  aria-label="Gambar sebelumnya"
                >
                  <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              )}

              {/* =================================================
                  NEXT BUTTON
                  ================================================= */}

              {imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    showNextImage();
                  }}
                  className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-[10001] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-2xl transition-all focus:outline-none focus:ring-2 focus:ring-white/60"
                  aria-label="Gambar berikutnya"
                >
                  <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              )}

              {/* =================================================
                  IMAGE CONTAINER
                  ================================================= */}

              <motion.div
                key={imageUrls[
                  selectedImageIndex
                ]}
                initial={{
                  opacity: 0,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 0.18,
                }}
                className="relative z-[10000] w-full h-full flex items-center justify-center p-4 pt-20 pb-10 sm:p-10 sm:pt-20 sm:pb-12"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <img
                  src={
                    imageUrls[
                      selectedImageIndex
                    ]
                  }
                  alt={`Gambar postingan ${
                    selectedImageIndex + 1
                  }`}
                  className="max-w-full max-h-full w-auto h-auto object-contain select-none"
                  draggable={false}
                />
              </motion.div>

              {/* =================================================
                  BOTTOM HINT
                  ================================================= */}

              <div
                className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[10001] px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-white/60 text-[10px] pointer-events-none"
              >
                Ketuk area gelap untuk menutup
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </>
  );
};