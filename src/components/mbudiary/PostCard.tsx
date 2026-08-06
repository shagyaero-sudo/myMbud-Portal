import React, {
  useEffect,
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
  Trash2,
  Send,
  CornerDownRight,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
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
     IMAGE DATA
     ========================================================= */

  const imageUrls =
    Array.isArray(post.imageUrls)
      ? post.imageUrls.filter(
          (url) =>
            typeof url === 'string' &&
            url.trim().length > 0
        )
      : [];

  const openImage = (
    index: number
  ) => {
    setSelectedImageIndex(index);
  };

  const closeImage = () => {
    setSelectedImageIndex(null);
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
     DELETE
     ========================================================= */

  const handleDeletePost =
    async () => {
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
   * Hak hapus berdasarkan NRP.
   */
  const isAuthor =
    post.authorNrp.toLowerCase() ===
    currentUser.nrp.toLowerCase();

  const canDelete =
    isAuthor ||
    currentUser.isOfficer;

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
            AUTHOR HEADER
            ===================================================== */}

        <div className="flex items-start justify-between gap-3 mb-3">
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

          {canDelete && (
            <button
              onClick={
                handleDeletePost
              }
              disabled={isDeleting}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
              title="Hapus Postingan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* =====================================================
            CONTENT
            ===================================================== */}

        <div className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line mb-4 font-normal">
          {post.content}
        </div>

        {/* =====================================================
            IMAGE GALLERY
            ===================================================== */}

        {imageUrls.length > 0 && (
          <div
            className={`mb-4 grid gap-2 overflow-hidden rounded-2xl ${
              imageUrls.length === 1
                ? 'grid-cols-1'
                : imageUrls.length === 2
                ? 'grid-cols-2'
                : imageUrls.length === 3
                ? 'grid-cols-2'
                : 'grid-cols-2'
            }`}
          >
            {imageUrls.map(
              (url, index) => {
                const isThreeImages =
                  imageUrls.length === 3;

                const isFirstOfThree =
                  isThreeImages &&
                  index === 0;

                return (
                  <motion.button
                    key={`${url}-${index}`}
                    type="button"
                    whileHover={{
                      scale: 1.01,
                    }}
                    whileTap={{
                      scale: 0.99,
                    }}
                    onClick={() =>
                      openImage(index)
                    }
                    className={`relative group overflow-hidden bg-slate-100 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      imageUrls.length === 1
                        ? 'aspect-[16/10]'
                        : isFirstOfThree
                        ? 'row-span-2 aspect-square'
                        : 'aspect-square'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Gambar postingan ${
                        index + 1
                      }`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />

                    {/* HOVER OVERLAY */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center">
                        <Maximize2 className="w-4 h-4" />
                      </span>
                    </div>

                    {/* IMAGE NUMBER */}
                    {imageUrls.length > 1 && (
                      <span className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold">
                        {index + 1}
                      </span>
                    )}
                  </motion.button>
                );
              }
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

            {/* COMMENTS */}
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

                      return (
                        <div
                          key={reply.id}
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

                          <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed pl-7">
                            {reply.content}
                          </p>
                        </div>
                      );
                    }
                  )
                )}
              </div>

              {/* REPLY INPUT */}
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
          IMAGE LIGHTBOX
          ======================================================= */}

      <AnimatePresence>
        {selectedImageIndex !== null &&
          imageUrls[
            selectedImageIndex
          ] && (
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
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={
                closeImage
              }
            >
              {/* CLOSE BUTTON */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeImage();
                }}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>

              {/* IMAGE COUNTER */}
              {imageUrls.length >
                1 && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold">
                  {selectedImageIndex +
                    1}{' '}
                  /{' '}
                  {imageUrls.length}
                </div>
              )}

              {/* PREVIOUS */}
              {imageUrls.length >
                1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    showPreviousImage();
                  }}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  title="Gambar sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* NEXT */}
              {imageUrls.length >
                1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    showNextImage();
                  }}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  title="Gambar berikutnya"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* MAIN IMAGE */}
              <motion.img
                key={
                  imageUrls[
                    selectedImageIndex
                  ]
                }
                initial={{
                  opacity: 0,
                  scale: 0.97,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.97,
                }}
                transition={{
                  duration: 0.2,
                }}
                src={
                  imageUrls[
                    selectedImageIndex
                  ]
                }
                alt={`Gambar postingan ${
                  selectedImageIndex + 1
                }`}
                className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl shadow-2xl select-none"
                onClick={(e) =>
                  e.stopPropagation()
                }
              />
            </motion.div>
          )}
      </AnimatePresence>
    </>
  );
};