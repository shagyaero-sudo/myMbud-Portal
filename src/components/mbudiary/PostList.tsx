import React, { useState, useEffect } from 'react';
import { MbudiaryPost, UserProfile, FeedSort } from '../types';
import { getPosts, getCachedUserByNrp } from './lib/storage';
import { PostCard } from './PostCard';
import { Search, MessageCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostListProps {
  currentUser: UserProfile;
  onSelectPost?: (postId: string) => void;
  onSelectAuthor?: (authorNrp: string) => void;
}

const PostCardSkeleton = () => (
  <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm animate-pulse space-y-4 w-full mx-auto">
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-zinc-800 shrink-0"></div>
      <div className="space-y-2 flex-1 pt-1">
        <div className="h-3.5 w-32 bg-slate-200 dark:bg-zinc-800 rounded-full"></div>
        <div className="h-2.5 w-24 bg-slate-200 dark:bg-zinc-800 rounded-full"></div>
      </div>
    </div>
    <div className="space-y-2 pt-2">
      <div className="h-3 w-full bg-slate-200 dark:bg-zinc-800 rounded-full"></div>
      <div className="h-3 w-5/6 bg-slate-200 dark:bg-zinc-800 rounded-full"></div>
      <div className="h-3 w-4/6 bg-slate-200 dark:bg-zinc-800 rounded-full"></div>
    </div>
    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4">
      <div className="h-8 w-14 bg-slate-200 dark:bg-zinc-800 rounded-full"></div>
      <div className="h-8 w-14 bg-slate-200 dark:bg-zinc-800 rounded-full"></div>
    </div>
  </div>
);

export const PostList: React.FC<PostListProps> = ({
  currentUser,
  onSelectPost,
  onSelectAuthor,
}) => {
  const [posts, setPosts] = useState<MbudiaryPost[]>([]);
  const [sort, setSort] = useState<FeedSort>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setPosts(getPosts());
      setIsLoading(false);
    }, 600);
  };

  const silentLoadPosts = () => {
    setPosts(getPosts());
  };

  useEffect(() => {
    loadPosts();

    window.addEventListener('mbud_posts_change', silentLoadPosts);
    window.addEventListener('mbud_users_change', silentLoadPosts);

    return () => {
      window.removeEventListener('mbud_posts_change', silentLoadPosts);
      window.removeEventListener('mbud_users_change', silentLoadPosts);
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setIsLoading(true);
    setTimeout(() => {
      setPosts(getPosts());
      setIsRefreshing(false);
      setIsLoading(false);
    }, 600);
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const author = getCachedUserByNrp(post.authorNrp);
    
    return (
      post.content?.toLowerCase().includes(q) ||
      author?.nickname?.toLowerCase().includes(q) ||
      author?.username?.toLowerCase().includes(q) ||
      post.authorNrp?.toLowerCase().includes(q)
    );
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sort === 'popular') {
      return (b.likes.length + (b.replyCount || 0)) - (a.likes.length + (a.replyCount || 0));
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-3">
      {/* REVISI: Control bar jauh lebih ramping (p-2 sm:p-2.5) */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* SEARCH BAR RAMPING */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari..."
              className="w-full pl-8 pr-3 py-1.5 text-[11px] sm:text-xs rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-200 text-[10px] font-bold">✕</button>
            )}
          </div>

          {/* TOMBOL SORT RAMPING */}
          <button
            onClick={() => setSort(sort === 'newest' ? 'popular' : 'newest')}
            className="px-2.5 py-1.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-colors shrink-0"
            title="Ubah Urutan Postingan"
          >
            {sort === 'newest' ? (
              <><Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /><span>Terbaru</span></>
            ) : (
              <><TrendingUp className="w-3.5 h-3.5 text-amber-500" /><span>Terpopuler</span></>
            )}
          </button>

          {/* TOMBOL REFRESH RAMPING */}
          <button
            onClick={handleManualRefresh}
            className="p-1.5 rounded-xl sm:rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 transition-all shrink-0"
            title="Muat Ulang Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-500 dark:text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : sortedPosts.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Tidak Ada Postingan Ditemukan</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              {searchQuery ? `Tidak ada hasil untuk kata kunci "${searchQuery}". Coba kata kunci lain.` : 'Belum ada aktivitas di feed. Buat postingan pertama untuk kelas!'}
            </p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-semibold hover:bg-indigo-500 transition-colors inline-block shadow-sm">Bersihkan Pencarian</button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onPostUpdate={silentLoadPosts}
                onSelectPost={onSelectPost}
                onSelectAuthor={onSelectAuthor}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};