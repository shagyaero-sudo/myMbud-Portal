import React, {
  useState,
  useEffect,
} from 'react';

import { UserProfile } from '../types';

import {
  getPosts,
  isFollowing,
  toggleFollow,
  getFollowerCount,
  getCachedUserByNrp,
} from './lib/storage';

import { PostCard } from './PostCard';

import {
  ArrowLeft,
  Heart,
  FileText,
  User,
  Users,
  UserPlus,
  UserCheck,
} from 'lucide-react';

import { motion } from 'framer-motion';

interface UserProfileViewProps {
  /**
   * Identity utama user sekarang adalah NRP.
   *
   * Username hanya atribut profile,
   * bukan identifier.
   */
  authorNrp: string;

  currentUser: UserProfile;

  onBack: () => void;

  onSelectPost?: (
    postId: string
  ) => void;

  onPostUpdate?: () => void;

  onSelectAuthor?: (
    authorNrp: string
  ) => void;
}

export const UserProfileView: React.FC<
  UserProfileViewProps
> = ({
  authorNrp,
  currentUser,
  onBack,
  onSelectPost,
  onPostUpdate,
  onSelectAuthor,
}) => {
  const normalizedAuthorNrp =
    authorNrp
      .trim()
      .toLowerCase();

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const [
    following,
    setFollowing,
  ] = useState<boolean>(
    isFollowing(
      normalizedAuthorNrp
    )
  );

  const [
    followerCount,
    setFollowerCount,
  ] = useState<number>(
    getFollowerCount(
      normalizedAuthorNrp
    )
  );

  /* =========================================================
     REALTIME SYNC
     ========================================================= */

  useEffect(() => {
    const syncData = () => {
      /**
       * Paksa UserProfileView membaca
       * cache terbaru.
       */
      setRefreshKey(
        (prev) => prev + 1
      );

      setFollowing(
        isFollowing(
          normalizedAuthorNrp
        )
      );

      setFollowerCount(
        getFollowerCount(
          normalizedAuthorNrp
        )
      );
    };

    syncData();

    window.addEventListener(
      'mbud_users_change',
      syncData
    );

    window.addEventListener(
      'mbud_posts_change',
      syncData
    );

    window.addEventListener(
      'mbud_follows_change',
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
        'mbud_follows_change',
        syncData
      );
    };
  }, [
    normalizedAuthorNrp,
  ]);

  /* =========================================================
     DATA
     ========================================================= */

  /**
   * Read latest cache on every render.
   */
  const allPosts = getPosts();

  /**
   * Cloud identity.
   *
   * mbudiary_users/{NRP}
   *
   * menjadi source of truth untuk:
   * - nickname
   * - username
   * - emoji
   */
  const authorProfile =
    getCachedUserByNrp(
      normalizedAuthorNrp
    );

  /**
   * Semua post user dicari berdasarkan NRP.
   */
  const userPosts =
    allPosts.filter(
      (post) =>
        post.authorNrp
          .toLowerCase() ===
        normalizedAuthorNrp
    );

  /**
   * Profile display.
   */
  const authorName =
    authorProfile?.nickname ||
    authorProfile?.username ||
    'Mbuders';

  const authorUsername =
    authorProfile?.username ||
    normalizedAuthorNrp;

  const authorEmoji =
    authorProfile?.emoji ||
    '😊';

  /**
   * Total likes dari seluruh post user.
   */
  const totalLikesReceived =
    userPosts.reduce(
      (acc, post) =>
        acc +
        (post.likes?.length || 0),
      0
    );

  /**
   * Apakah profile yang sedang dibuka
   * adalah profile user sendiri?
   */
  const isSelf =
    currentUser.nrp
      .toLowerCase() ===
    normalizedAuthorNrp;

  /* =========================================================
     FOLLOW
     ========================================================= */

  const handleFollowToggle =
    async () => {
      try {
        const isNowFollowing =
          await toggleFollow(
            normalizedAuthorNrp
          );

        setFollowing(
          isNowFollowing
        );

        setFollowerCount(
          getFollowerCount(
            normalizedAuthorNrp
          )
        );
      } catch (error) {
        console.error(
          '[mbudiary] Gagal mengubah follow:',
          error
        );
      }
    };

  /**
   * Prevent TypeScript/compiler from
   * treating refreshKey as unused while
   * still forcing a render when cache changes.
   */
  void refreshKey;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="space-y-4">

      {/* BACK BUTTON */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm group"
      >
        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />

        <span>
          Kembali ke Feed
        </span>
      </button>

      {/* =====================================================
          PROFILE HEADER
          ===================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">

          {/* USER IDENTITY */}
          <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">

            <div className="flex items-center gap-3 min-w-0">

              {/* EMOJI */}
              <span className="text-3xl sm:text-4xl shrink-0 leading-none">
                {authorEmoji}
              </span>

              <div className="min-w-0">

                {/* NAME + SELF BADGE */}
                <div className="flex items-center gap-2 flex-wrap">

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 truncate">
                    {authorName}
                  </h2>

                  {isSelf && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                      Saya
                    </span>
                  )}

                </div>

                {/* USERNAME */}
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                  @{authorUsername}
                </p>

              </div>
            </div>

            {/* MOBILE FOLLOW */}
            {!isSelf && (
              <button
                onClick={
                  handleFollowToggle
                }
                className={`sm:hidden px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95 ${
                  following
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                }`}
              >
                {following ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />

                    <span>
                      Mengikuti
                    </span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />

                    <span>
                      Ikuti
                    </span>
                  </>
                )}
              </button>
            )}

          </div>

          {/* =================================================
              STATS + DESKTOP FOLLOW
              ================================================= */}

          <div className="flex items-center gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800">

            {/* STATS */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 flex-1 sm:flex sm:flex-initial">

              {/* POST */}
              <div className="px-2.5 py-1.5 sm:px-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 flex items-center justify-center gap-1.5 text-xs">

                <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />

                <span className="font-extrabold text-slate-900 dark:text-zinc-100">
                  {userPosts.length}
                </span>

                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                  Post
                </span>

              </div>

              {/* SUKA */}
              <div className="px-2.5 py-1.5 sm:px-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 flex items-center justify-center gap-1.5 text-xs">

                <Heart className="w-3 h-3 text-rose-500 shrink-0" />

                <span className="font-extrabold text-slate-900 dark:text-zinc-100">
                  {totalLikesReceived}
                </span>

                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                  Suka
                </span>

              </div>

              {/* PENGIKUT */}
              <div className="px-2.5 py-1.5 sm:px-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 flex items-center justify-center gap-1.5 text-xs">

                <Users className="w-3 h-3 text-amber-500 shrink-0" />

                <span className="font-extrabold text-slate-900 dark:text-zinc-100">
                  {followerCount}
                </span>

                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                  Pengikut
                </span>

              </div>

            </div>

            {/* DESKTOP FOLLOW */}
            {!isSelf && (
              <button
                onClick={
                  handleFollowToggle
                }
                className={`hidden sm:flex px-4 py-1.5 rounded-2xl text-xs font-bold transition-all items-center gap-1.5 shadow-sm shrink-0 active:scale-95 ${
                  following
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                }`}
              >
                {following ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />

                    <span>
                      Mengikuti
                    </span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />

                    <span>
                      Ikuti
                    </span>
                  </>
                )}
              </button>
            )}

          </div>

        </div>
      </motion.div>

      {/* =====================================================
          USER POSTS
          ===================================================== */}

      <div className="space-y-3">

        <div className="flex items-center justify-between px-1">

          <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">

            <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />

            Riwayat Postingan (
            {userPosts.length}
            )

          </h3>

        </div>

        {userPosts.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-8 text-center text-xs text-slate-400 dark:text-zinc-500 shadow-sm">
            User ini belum membuat
            postingan di mbudiary.
          </div>
        ) : (
          userPosts.map(
            (post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={
                  currentUser
                }
                onPostUpdate={
                  onPostUpdate
                }
                onSelectPost={
                  onSelectPost
                }
                onSelectAuthor={
                  onSelectAuthor
                }
              />
            )
          )
        )}

      </div>
    </div>
  );
};