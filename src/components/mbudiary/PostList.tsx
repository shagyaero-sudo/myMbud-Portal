import React, { useState, useEffect, useMemo } from 'react';
import { MbudiaryPost, UserProfile } from '../../types';
import { getPosts, getCachedUserByNrp, searchUsersForMention, getFollows, getBookmarkedPostIds } from './lib/storage';
import { PostCard, VerifiedBadge } from './PostCard';
import { CreatePostForm } from './CreatePostForm';
import { getOptimizedImageUrl } from './lib/utils';
import { Search, Users, ChevronRight, UserCheck, Bookmark, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostListProps {
  currentUser: UserProfile;
  onSelectPost?: (postId: string) => void;
  onSelectAuthor?: (authorNrp: string) => void;
  onExitToDashboard?: () => void;
  onOpenOwnProfile?: () => void;
  onNavigateToChat?: (targetNrp?: string) => void;
  onCloseSheet?: () => void;
}

type FeedTab = 'for_you' | 'following';

export const PostList: React.FC<PostListProps> = ({
  currentUser,
  onSelectPost,
  onSelectAuthor,
  onOpenOwnProfile,
  onCloseSheet,
}) => {
  const [posts, setPosts] = useState<MbudiaryPost[]>(() => getPosts());
  const [activeTab, setActiveTab] = useState<FeedTab>('for_you');
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
    window.addEventListener('mbud_follows_change', silentLoadPosts);

    return () => {
      window.removeEventListener('mbud_posts_change', silentLoadPosts);
      window.removeEventListener('mbud_users_change', silentLoadPosts);
      window.removeEventListener('mbud_bookmarks_change', silentLoadPosts);
      window.removeEventListener('mbud_follows_change', silentLoadPosts);
    };
  }, []);

  const matchedUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || showBookmarksOnly) return [];
    return searchUsersForMention(q);
  }, [searchQuery, showBookmarksOnly]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    const followingNrps = getFollows();
    const myNrp = (currentUser?.nrp || '').toLowerCase();

    // 1. Tab Untuk Anda
    if (activeTab === 'for_you' && !showBookmarksOnly) {
      result = result.filter((p) => {
        const isMe = p.authorNrp.toLowerCase() === myNrp;
        return isMe || !p.isFollowersOnly;
      });
    }

    // 2. Tab Mengikuti
    if (activeTab === 'following' && !showBookmarksOnly) {
      result = result.filter((p) => followingNrps.includes(p.authorNrp.toLowerCase()));
    }

    // 3. Tab Bookmarks
    if (showBookmarksOnly) {
      const bookmarkedIds = getBookmarkedPostIds();
      result = result.filter((p) => bookmarkedIds.includes(p.id));
    }

    // 4. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((post) => {
        const author = getCachedUserByNrp(post.authorNrp);
        return (
          post.content?.toLowerCase().includes(q) ||
          post.quoteContent?.toLowerCase().includes(q) ||
          author?.nickname?.toLowerCase().includes(q) ||
          author?.username?.toLowerCase().includes(q) ||
          post.authorNrp?.toLowerCase().includes(q)
        );
      });
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [posts, activeTab, showBookmarksOnly, searchQuery, currentUser?.nrp]);

  const hasSearch = Boolean(searchQuery.trim());
  const hasNoResults = hasSearch && matchedUsers.length === 0 && filteredPosts.length === 0;

  return (
    <div className="space-y-3 sm:space-y-4 w-full p-3 sm:p-4">
      
      {/* INTEGRATED SINGLE TOPBAR */}
      <div className="flex items-center justify-between gap-2.5 w-full">
        {/* LOGO MBUDIARY */}
        <span className="font-black text-xl sm:text-2xl text-slate-900 dark:text-zinc-100 tracking-tight shrink-0">
          mbudiary.
        </span>

        {/* SEARCH BAR BERSATU DI ATAS */}
        <div className="relative flex-1 min-w-0 flex items-center">
          <div className="absolute left-3 flex items-center pointer-events-none z-10">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-zinc-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari post/akun..."
            className="w-full pl-8 sm:pl-9 pr-7 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-200 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* TOMBOL (X) CLOSE SHEET */}
        <button
          type="button"
          onClick={() => onCloseSheet?.()}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-colors"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* HASIL PENCARIAN AKUN */}
      {hasSearch && matchedUsers.length > 0 && !showBookmarksOnly && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-3 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>Akun Pengguna ({matchedUsers.length})</span>
          </div>

          <div className="space-y-1">
            {matchedUsers.map((user) => (
              <div
                key={user.nrp}
                onClick={() => onSelectAuthor?.(user.nrp)}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/80 dark:border-zinc-700/80 group-hover:scale-105 transition-transform">
                    {user.photoUrl ? (
                      <img
                        src={getOptimizedImageUrl(user.photoUrl)}
                        alt={user.nickname}
                        loading="lazy"
                        decoding="async"
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
        </div>
      )}

      {/* CONTAINER TIMELINE */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-zinc-800 transform-gpu">
        
        {/* HEADER TAB */}
        <div className="flex items-center border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 pr-2">
          <button
            type="button"
            onClick={() => { setShowBookmarksOnly(false); setActiveTab('for_you'); }}
            className={`flex-1 py-3 text-center text-xs sm:text-[13px] font-bold transition-all relative cursor-pointer ${
              activeTab === 'for_you' && !showBookmarksOnly
                ? 'text-slate-900 dark:text-zinc-100'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
          >
            <span>Untuk Anda</span>
            {activeTab === 'for_you' && !showBookmarksOnly && (
              <motion.div
                layoutId="feedTabIndicator"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-full"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => { setShowBookmarksOnly(false); setActiveTab('following'); }}
            className={`flex-1 py-3 text-center text-xs sm:text-[13px] font-bold transition-all relative cursor-pointer ${
              activeTab === 'following' && !showBookmarksOnly
                ? 'text-slate-900 dark:text-zinc-100'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
          >
            <span>Mengikuti</span>
            {activeTab === 'following' && !showBookmarksOnly && (
              <motion.div
                layoutId="feedTabIndicator"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-full"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowBookmarksOnly((prev) => !prev)}
            className={`p-2 rounded-xl transition-all active:scale-90 cursor-pointer ${
              showBookmarksOnly
                ? 'bg-amber-500/15 text-amber-500'
                : 'text-slate-400 dark:text-zinc-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
            title="Lihat Postingan Tersimpan"
          >
            <Bookmark className={`w-4 h-4 transition-all ${showBookmarksOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
          </button>
        </div>

        {/* INLINE CREATE POST FORM */}
        {!showBookmarksOnly && !hasSearch && (
          <CreatePostForm
            userProfile={currentUser}
            onPostCreated={silentLoadPosts}
            onSelectAuthor={onSelectAuthor}
            onOpenOwnProfile={onOpenOwnProfile}
          />
        )}

        {/* FEED LIST / EMPTY STATES */}
        {hasNoResults || filteredPosts.length === 0 ? (
          <div className="p-10 text-center space-y-2.5">
            <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
              {showBookmarksOnly ? (
                <Bookmark className="w-5 h-5" />
              ) : activeTab === 'following' ? (
                <UserCheck className="w-5 h-5" />
              ) : (
                <Users className="w-5 h-5" />
              )}
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
              {showBookmarksOnly
                ? 'Belum Ada Bookmark'
                : activeTab === 'following'
                ? 'Belum Ada Postingan dari Teman'
                : 'Tidak Ada Hasil Ditemukan'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              {showBookmarksOnly
                ? 'Kamu belum menyimpan postingan apa pun ke Bookmark.'
                : activeTab === 'following'
                ? 'Akun yang kamu ikuti belum membuat postingan atau kamu belum mengikuti siapa pun.'
                : searchQuery
                ? `Tidak ada akun atau postingan yang cocok dengan kata kunci "${searchQuery}".`
                : 'Belum ada aktivitas di feed. Buat postingan pertama untuk kelas!'}
            </p>
            {(searchQuery || showBookmarksOnly) && (
              <button 
                onClick={() => { setSearchQuery(''); setShowBookmarksOnly(false); }} 
                className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-500 transition-colors inline-block shadow-xs mt-1 cursor-pointer"
              >
                Kembali ke Feed
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onPostUpdate={silentLoadPosts}
              onSelectPost={onSelectPost}
              onSelectAuthor={onSelectAuthor}
            />
          ))
        )}
      </div>
    </div>
  );
};