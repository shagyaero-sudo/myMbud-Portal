import React, { useState, useEffect, useMemo } from 'react';
import { MbudiaryPost, UserProfile, FeedSort } from '../../types';
import { getPosts, getCachedUserByNrp, getBookmarkedPostIds, searchUsersForMention } from './lib/storage';
import { PostCard, VerifiedBadge } from './PostCard';
import { getOptimizedImageUrl } from './lib/utils';
import { Search, MessageCircle, Clock, TrendingUp, Bookmark, ArrowUpDown, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostListProps {
  currentUser: UserProfile;
  onSelectPost?: (postId: string) => void;
  onSelectAuthor?: (authorNrp: string) => void;
}

export const PostList: React.FC<PostListProps> = ({
  currentUser,
  onSelectPost,
  onSelectAuthor,
}) => {
  const [posts, setPosts] = useState<MbudiaryPost[]>(() => getPosts());
  const [sort, setSort] = useState<FeedSort>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  const silentLoadPosts = () => {
    setPosts(getPosts());
  };

  useEffect(() => {
    silentLoadPosts();

    window.addEventListener('mbud_posts_change', silentLoadPosts);
    window.addEventListener('mbud_users_change', silentLoadPosts);
    window.addEventListener('mbud_bookmarks_change', silentLoadPosts);

    return () => {
      window.removeEventListener('mbud_posts_change', silentLoadPosts);
      window.removeEventListener('mbud_users_change', silentLoadPosts);
      window.removeEventListener('mbud_bookmarks_change', silentLoadPosts);
    };
  }, []);

  // 1. PENCARIAN AKUN USER
  const matchedUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || showBookmarksOnly) return [];
    return searchUsersForMention(q);
  }, [searchQuery, showBookmarksOnly]);

  // 2. PENCARIAN & FILTER POSTINGAN
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
      post.quoteContent?.toLowerCase().includes(q) ||
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

  const hasSearch = Boolean(searchQuery.trim());
  const hasNoResults = hasSearch && matchedUsers.length === 0 && sortedPosts.length === 0;

  return (
    <div className="space-y-2.5">
      {/* Control Bar (GLASSMORPHISM) */}
      <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-2 sm:p-2.5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* SEARCH BAR */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari post atau username..."
              className="w-full pl-8 pr-3 py-1.5 text-[11px] sm:text-xs rounded-xl bg-white/60 dark:bg-zinc-800/70 border border-slate-200/60 dark:border-white/5 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-200 text-[10px] font-bold cursor-pointer">✕</button>
            )}
          </div>

          {/* TOMBOL TAB SORTING */}
          <button
            onClick={() => setSort(sort === 'newest' ? 'popular' : 'newest')}
            className="px-2.5 py-1.5 rounded-xl bg-white/60 dark:bg-zinc-800/70 hover:bg-white/90 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-zinc-200 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
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
            className={`px-2.5 py-1.5 rounded-xl border ${showBookmarksOnly ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 font-bold' : 'bg-white/60 dark:bg-zinc-800/70 border-slate-200/60 dark:border-white/5 text-slate-400 dark:text-zinc-500 hover:text-amber-500'} transition-all shrink-0 flex items-center gap-1.5 cursor-pointer`}
            title="Lihat Postingan Tersimpan"
          >
            <Bookmark className={`w-3.5 h-3.5 transition-all ${showBookmarksOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span className="hidden sm:inline text-[11px] sm:text-xs">Tersimpan</span>
          </button>
        </div>
      </div>

      {/* HASIL PENCARIAN AKUN PENGGUNA */}
      {hasSearch && matchedUsers.length > 0 && !showBookmarksOnly && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-3 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none space-y-2"
        >
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>Akun Pengguna ({matchedUsers.length})</span>
          </div>

          <div className="space-y-1">
            {matchedUsers.map((user) => (
              <div
                key={user.nrp}
                onClick={() => onSelectAuthor?.(user.nrp)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/80 dark:hover:bg-zinc-800/60 border border-transparent hover:border-slate-200/50 dark:hover:border-white/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/80 dark:border-zinc-700/80 group-hover:scale-105 transition-transform">
                    {user.photoUrl ? (
                      <img
                        src={getOptimizedImageUrl(user.photoUrl)}
                        alt={user.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base sm:text-lg leading-none">{user.emoji || '😊'}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-blue-500 transition-colors">
                        {user.nickname}
                      </span>
                      <VerifiedBadge authorNrp={user.nrp} isVerified={user.isVerified} size="sm" />
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                      @{user.username}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 opacity-80 group-hover:opacity-100 pl-2">
                  <span className="hidden sm:inline">Lihat</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* FEED LIST */}
      <div className="space-y-2.5">
        {hasNoResults || (sortedPosts.length === 0 && !hasSearch) ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-8 text-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none space-y-2.5">
            <div className="w-11 h-11 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
              {showBookmarksOnly ? <Bookmark className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
              {showBookmarksOnly ? 'Belum Ada Bookmark' : 'Tidak Ada Hasil Ditemukan'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              {showBookmarksOnly
                ? 'Kamu belum menyimpan postingan apa pun ke Bookmark.'
                : searchQuery
                  ? `Tidak ada akun atau postingan yang cocok dengan kata kunci "${searchQuery}".`
                  : 'Belum ada aktivitas di feed. Buat postingan pertama untuk kelas!'
              }
            </p>
            {(searchQuery || showBookmarksOnly) && (
              <button 
                onClick={() => { setSearchQuery(''); setShowBookmarksOnly(false); }} 
                className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-500 transition-colors inline-block shadow-xs mt-1 cursor-pointer"
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