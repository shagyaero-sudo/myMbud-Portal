import React, {
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  User,
} from 'lucide-react';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

import {
  UserProfile,
  MbudiaryPost,
} from './mbudiary/types';

import {
  getUserProfile,
  getPosts,
  initializeMbudiary,
} from './mbudiary/lib/storage';

import {
  CreatePostForm,
} from './mbudiary/CreatePostForm';

import {
  PostList,
} from './mbudiary/PostList';

import {
  PostCard,
} from './mbudiary/PostCard';

import {
  UserProfileView,
} from './mbudiary/UserProfileView';

export const MbudiaryView: React.FC =
  () => {
    const [
      currentUser,
      setCurrentUser,
    ] = useState<UserProfile>(
      getUserProfile()
    );

    const [
      selectedPostId,
      setSelectedPostId,
    ] = useState<string | null>(
      null
    );

    /**
     * Identity profile sekarang NRP,
     * bukan username.
     */
    const [
      selectedAuthorNrp,
      setSelectedAuthorNrp,
    ] = useState<string | null>(
      null
    );

    const [
      ,
      forceRefresh,
    ] = useState(0);

    useEffect(() => {
      const unsubscribe =
        initializeMbudiary();

      const sync = () => {
        setCurrentUser(
          getUserProfile()
        );

        forceRefresh(
          (value) =>
            value + 1
        );
      };

      window.addEventListener(
        'mbud_user_change',
        sync
      );

      window.addEventListener(
        'mbud_users_change',
        sync
      );

      window.addEventListener(
        'mbud_posts_change',
        sync
      );

      window.addEventListener(
        'mbud_follows_change',
        sync
      );

      return () => {
        window.removeEventListener(
          'mbud_user_change',
          sync
        );

        window.removeEventListener(
          'mbud_users_change',
          sync
        );

        window.removeEventListener(
          'mbud_posts_change',
          sync
        );

        window.removeEventListener(
          'mbud_follows_change',
          sync
        );

        unsubscribe();
      };
    }, []);

    const allPosts =
      getPosts();

    const selectedPost:
      | MbudiaryPost
      | undefined =
      allPosts.find(
        (post) =>
          post.id ===
          selectedPostId
      );

    return (
      <div className="w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-300 antialiased relative overflow-x-hidden">

       <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-8 relative z-10 space-y-6">

          {/* USER PROFILE */}
          {selectedAuthorNrp ? (
            <UserProfileView
              authorNrp={
                selectedAuthorNrp
              }
              currentUser={
                currentUser
              }
              onBack={() =>
                setSelectedAuthorNrp(
                  null
                )
              }
              onSelectPost={(
                postId
              ) => {
                setSelectedPostId(
                  postId
                );

                setSelectedAuthorNrp(
                  null
                );
              }}
              onPostUpdate={() =>
                forceRefresh(
                  (value) =>
                    value + 1
                )
              }
              onSelectAuthor={(
                authorNrp
              ) =>
                setSelectedAuthorNrp(
                  authorNrp
                )
              }
            />

          ) : selectedPostId ? (

            /* POST DETAIL */
            <div className="space-y-4">

              <button
                onClick={() =>
                  setSelectedPostId(
                    null
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm active:scale-95 group"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />

                <span>
                
                </span>
              </button>

              {selectedPost ? (
                <PostCard
                  post={
                    selectedPost
                  }
                  currentUser={
                    currentUser
                  }
                  onPostUpdate={() =>
                    forceRefresh(
                      (value) =>
                        value + 1
                    )
                  }
                  onSelectAuthor={(
                    authorNrp
                  ) => {
                    setSelectedAuthorNrp(
                      authorNrp
                    );

                    setSelectedPostId(
                      null
                    );
                  }}
                  isDetailPage
                />
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 text-center text-xs font-medium text-slate-500 dark:text-zinc-400 shadow-sm">
                  Postingan tidak ditemukan atau telah dihapus.
                </div>
              )}

            </div>

          ) : (

            /* FEED */
            <>
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >
                {/* HEADER */}
                <div className="flex items-start justify-between gap-3">

                  {/* TITLE */}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                      mbudiary.
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                      #Ruangamanbersama
                    </p>
                  </div>

                  {/* PROFIL SAYA */}
                  <button
                    onClick={() =>
                      setSelectedAuthorNrp(
                        currentUser.nrp
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-indigo-50/50 dark:hover:bg-zinc-800 transition-all shadow-sm active:scale-95 shrink-0"
                    title="Lihat Profil Saya"
                  >
                    <User className="w-3.5 h-3.5" />

                    <span>
                      Profil Saya
                    </span>
                  </button>

                </div>
              </motion.div>

              <CreatePostForm
                userProfile={
                  currentUser
                }
                onPostCreated={() =>
                  forceRefresh(
                    (value) =>
                      value + 1
                  )
                }
                onSelectAuthor={(
                  authorNrp
                ) =>
                  setSelectedAuthorNrp(
                    authorNrp
                  )
                }
              />

              <AnimatePresence mode="popLayout">
                <PostList
                  currentUser={
                    currentUser
                  }
                  onSelectPost={(
                    postId
                  ) =>
                    setSelectedPostId(
                      postId
                    )
                  }
                  onSelectAuthor={(
                    authorNrp
                  ) =>
                    setSelectedAuthorNrp(
                      authorNrp
                    )
                  }
                />
              </AnimatePresence>
            </>
          )}

        </main>
      </div>
    );
  };