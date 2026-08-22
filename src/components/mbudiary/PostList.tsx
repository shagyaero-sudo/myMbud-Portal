import React, { useState, useEffect } from 'react';
import { MbudiaryPost, UserProfile, FeedSort } from '../../types';
import { getPosts, getCachedUserByNrp, getBookmarkedPostIds } from './lib/storage';
import { PostCard } from './PostCard';
import { Search, MessageCircle, Clock, TrendingUp, Bookmark, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostListProps {
  currentUser: UserProfile;
  onSelectPost?: (postId: string) => void;
  onSelectAuthor?: (authorNrp: string) => void;
}

const PostCardSkeleton = () => (
  <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none animate-pulse space-y-4 w-full mx-auto">
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-2xl bg-slate-200/80 dark:bg-zinc-800 shrink-0"></div>
      <div className="space-y-2 flex-1 pt-1">
        <div className="h-3.5 w-32 bg-slate-200/80 dark:bg-zinc-800 rounded-full"></div>
        <div className="h-2.5 w-24 bg-slate-200/80 dark:bg-zinc-800 rounded-full"></div>
      </div>
    </div>
    <div className="space-y-2 pt-2">
      <div className="h-3 w-full bg-slate-200/80 dark:bg-zinc-800 rounded-full"></div>
      <div className="h-3 w-5/6 bg-slate-200/80 dark:bg-zinc-800 rounded-full"></div>
      <div className="h-3 w-4/6 bg-slate-200/80 dark:bg-zinc-800 rounded-full"></div>
    </div>
    <div className="flex gap-3 pt-4 border-t border-slate-200/40 dark:border-white/5 mt-4">
      <div className="h-8 w-14 bg-slate-200/80 dark:bg-zinc-800 rounded-full"></div>
      <div className="h-8 w-14 bg-slate-200/80 dark:bg-zinc-800 rounded-full"></div>
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
  const [isLoading, setIsLoading] = useState(true);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

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
    window.addEventListener('mbud_bookmarks_change', silentLoadPosts);

    return () => {
      window.removeEventListener('mbud_posts_change', silentLoadPosts);
      window.removeEventListener('mbud_users_change', silentLoadPosts);
      window.removeEventListener('mbud_bookmarks_change', silentLoadPosts);
    };
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (showBookmarksOnly) {
      const bookmarkedIds = getBookmarkedPostIds();
      if (!bookmarkedIds.includes(post.id)) return false;
    }

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
      {/* Control Bar (GLASSMORPHISM) */}
      <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* SEARCH BAR */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari cerita..."
              className="w-full pl-8 pr-3 py-1.5 text-[11px] sm:text-xs rounded-xl sm:rounded-2xl bg-white/60 dark:bg-zinc-800/70 border border-slate-200/60 dark:border-white/5 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-200 text-[10px] font-bold cursor-pointer">✕</button>
            )}
          </div>

          {/* TOMBOL TAB SORTING */}
          <button
            onClick={() => setSort(sort === 'newest' ? 'popular' : 'newest')}
            className="px-2.5 py-1.5 rounded-xl sm:rounded-2xl bg-white/60 dark:bg-zinc-800/70 hover:bg-white/90 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-zinc-200 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            title="Ubah Urutan Postingan"
          >
            {sort === 'newest' ? (
              <><Clock className="w-3.5 h-3.5 text-blue-500" /><span className="hidden sm:inline">Terbaru</span></>
            ) : (
              <><TrendingUp className="w-3.5 h-3.5 text-rose-500" /><span className="hidden sm:inline">Terpopuler</span></>
            )}
            <ArrowUpDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* TOMBOL BOOKMARK */}
          <button
            onClick={() => setShowBookmarksOnly((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl sm:rounded-2xl border ${showBookmarksOnly ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 font-bold' : 'bg-white/60 dark:bg-zinc-800/70 border-slate-200/60 dark:border-white/5 text-slate-400 dark:text-zinc-500 hover:text-amber-500'} transition-all shrink-0 flex items-center gap-1.5 cursor-pointer`}
            title="Lihat Postingan Tersimpan"
          >
            <Bookmark className={`w-3.5 h-3.5 transition-all ${showBookmarksOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span className="hidden sm:inline text-[11px] sm:text-xs">Tersimpan</span>
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
              {showBookmarksOnly ? <Bookmark className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
              {showBookmarksOnly ? 'Belum Ada Bookmark' : 'Tidak Ada Postingan Ditemukan'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              {showBookmarksOnly
                ? 'Kamu belum menyimpan postingan apa pun ke Bookmark.'
                : searchQuery
                  ? `Tidak ada hasil untuk kata kunci "${searchQuery}". Coba kata kunci lain.`
                  : 'Belum ada aktivitas di feed. Buat postingan pertama untuk kelas!'
              }
            </p>
            {(searchQuery || showBookmarksOnly) && (
              <button 
                onClick={() => { setSearchQuery(''); setShowBookmarksOnly(false); }} 
                className="px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-500 transition-colors inline-block shadow-xs mt-2 cursor-pointer"
              >
                Kembali ke Feed
              </button>
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