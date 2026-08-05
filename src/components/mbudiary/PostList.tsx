import React, { useState, useEffect } from 'react';
import { MbudiaryPost, UserProfile, FeedSort } from '../types';
import { getPosts } from '../lib/storage';
import { PostCard } from './PostCard';
import { 
  Search, 
  MessageCircle,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostListProps {
  currentUser: UserProfile;
  onSelectPost?: (postId: string) => void;
  onSelectAuthor?: (authorUsername: string) => void;
}

export const PostList: React.FC<PostListProps> = ({ currentUser, onSelectPost, onSelectAuthor }) => {
  const [posts, setPosts] = useState<MbudiaryPost[]>([]);
  const [sort, setSort] = useState<FeedSort>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPosts = () => {
    setPosts(getPosts());
  };

  useEffect(() => {
    loadPosts();

    const handleStorageChange = () => {
      loadPosts();
    };

    window.addEventListener('mbud_posts_change', handleStorageChange);
    return () => {
      window.removeEventListener('mbud_posts_change', handleStorageChange);
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadPosts();
      setIsRefreshing(false);
    }, 400);
  };

  // Search Logic
  const filteredPosts = posts.filter(post => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const contentMatch = post.content.toLowerCase().includes(q);
      const authorMatch = post.authorName.toLowerCase().includes(q);
      const nrpMatch = post.authorUsername.toLowerCase().includes(q);
      return contentMatch || authorMatch || nrpMatch;
    }
    return true;
  });

  // Sort Logic
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sort === 'popular') {
      return (b.likes.length + (b.replyCount || 0)) - (a.likes.length + (a.replyCount || 0));
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      
      {/* Control Bar: Search & Refresh & Sort */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-3.5 sm:p-4 shadow-sm space-y-3">
        
        {/* Search Bar, Refresh & Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari"
              className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setSort(sort === 'newest' ? 'popular' : 'newest')}
            className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
            title="Ubah Urutan Postingan"
          >
            {sort === 'newest' ? (
              <>
                <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Terbaru</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>Terpopuler</span>
              </>
            )}
          </button>

          <button
            onClick={handleManualRefresh}
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 transition-all shrink-0"
            title="Muat Ulang Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-500 dark:text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-3">
        {sortedPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-sm space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
              Tidak Ada Postingan Ditemukan
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ada hasil untuk kata kunci "${searchQuery}". Coba kata kunci lain.`
                : 'Belum ada aktivitas di feed. Buat postingan pertama untuk kelas!'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-semibold hover:bg-indigo-500 transition-colors inline-block shadow-sm"
              >
                Bersihkan Pencarian
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onPostUpdate={loadPosts}
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
