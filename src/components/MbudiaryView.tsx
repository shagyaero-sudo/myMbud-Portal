import React, { useEffect, useState } from 'react';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, MbudiaryPost } from './mbudiary/types';
import { getUserProfile, getPosts, initializeMbudiary } from './mbudiary/lib/storage';
import { CreatePostForm } from './mbudiary/CreatePostForm';
import { PostList } from './mbudiary/PostList';
import { PostCard } from './mbudiary/PostCard';
import { UserProfileView } from './mbudiary/UserProfileView';

interface MbudiaryViewProps {
  onBackToDashboard?: () => void;
}

export const MbudiaryView: React.FC<MbudiaryViewProps> = ({
  onBackToDashboard,
}) => {
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

  const isDark =
    document.documentElement.classList.contains('dark');

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.toggle('dark');

    const newTheme = root.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-300 flex flex-col antialiased relative overflow-x-hidden">

      {/* =====================================================
          MYMBUD SUBPAGE HEADER
          ===================================================== */}
      <header className="h-16 shrink-0 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 sticky top-0 z-50">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center">
            <span className="text-xl">〽️</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-zinc-100">
              myMbud Portal
            </span>

            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
              v2.5
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">

          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 flex items-center justify-center transition-all"
            title="Ganti tema"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-zinc-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard
            </button>
          )}
        </div>
      </header>

      {/* =====================================================
          MOBILE BACK BUTTON
          ===================================================== */}
      {onBackToDashboard && (
        <div className="sm:hidden px-4 pt-4">
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </button>
        </div>
      )}

      {/* =====================================================
          MBUDIARY CONTENT
          ===================================================== */}
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
            onSelectAuthor={(username) =>
              setSelectedAuthorUsername(username)
            }
          />
        ) : selectedPostId ? (
          <div className="space-y-4">

            <button
              onClick={() => setSelectedPostId(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
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
              <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-8 text-center text-xs text-slate-500 dark:text-zinc-400">
                Postingan tidak ditemukan atau telah dihapus.
              </div>
            )}
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
                mbudiary.
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                #Ruangamanbersama
              </p>
            </motion.div>

            <CreatePostForm
              userProfile={currentUser}
              onPostCreated={() => forceRefresh((value) => value + 1)}
              onSelectAuthor={(username) =>
                setSelectedAuthorUsername(username)
              }
            />

            <AnimatePresence mode="popLayout">
              <PostList
                currentUser={currentUser}
                onSelectPost={(postId) => setSelectedPostId(postId)}
                onSelectAuthor={(username) =>
                  setSelectedAuthorUsername(username)
                }
              />
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
};