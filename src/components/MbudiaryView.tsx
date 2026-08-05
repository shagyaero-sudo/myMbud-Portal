import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, MbudiaryPost } from './mbudiary/types';
import { getUserProfile, getPosts, initializeMbudiary } from './mbudiary/lib/storage';
import { CreatePostForm } from './mbudiary/CreatePostForm';
import { PostList } from './mbudiary/PostList';
import { PostCard } from './mbudiary/PostCard';
import { UserProfileView } from './mbudiary/UserProfileView';

export const MbudiaryView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getUserProfile());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedAuthorUsername, setSelectedAuthorUsername] = useState<string | null>(null);
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    const unsubscribe = initializeMbudiary();

    const sync = () => {
      setCurrentUser(getUserProfile());
      forceRefresh((value) => value + 1);
    };

    window.addEventListener('mbud_user_change', sync);
    window.addEventListener('mbud_posts_change', sync);
    window.addEventListener('mbud_follows_change', sync);

    return () => {
      window.removeEventListener('mbud_user_change', sync);
      window.removeEventListener('mbud_posts_change', sync);
      window.removeEventListener('mbud_follows_change', sync);
      unsubscribe();
    };
  }, []);

  const allPosts = getPosts();
  const selectedPost: MbudiaryPost | undefined = allPosts.find(
    (post) => post.id === selectedPostId
  );

  return (
    <div className="w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-300 antialiased relative overflow-x-hidden">

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10 space-y-6">

        {selectedAuthorUsername ? (
          <UserProfileView
            authorUsername={selectedAuthorUsername}
            currentUser={currentUser}
            onBack={() => setSelectedAuthorUsername(null)}
            onSelectPost={(postId) => {
              setSelectedPostId(postId);
              setSelectedAuthorUsername(null);
            }}
            onPostUpdate={() => forceRefresh((value) => value + 1)}
            onSelectAuthor={(username) => setSelectedAuthorUsername(username)}
          />
        ) : selectedPostId ? (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedPostId(null)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm active:scale-95 group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              <span>Kembali ke Feed</span>
            </button>

            {selectedPost ? (
              <PostCard
                post={selectedPost}
                currentUser={currentUser}
                onPostUpdate={() => forceRefresh((value) => value + 1)}
                onSelectAuthor={(username) => {
                  setSelectedAuthorUsername(username);
                  setSelectedPostId(null);
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
          <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                mbudiary.
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                #Ruangamanbersama
              </p>
            </motion.div>

            <CreatePostForm
              userProfile={currentUser}
              onPostCreated={() => forceRefresh((value) => value + 1)}
              onSelectAuthor={(username) => setSelectedAuthorUsername(username)}
            />

            <AnimatePresence mode="popLayout">
              <PostList
                currentUser={currentUser}
                onSelectPost={(postId) => setSelectedPostId(postId)}
                onSelectAuthor={(username) => setSelectedAuthorUsername(username)}
              />
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
};