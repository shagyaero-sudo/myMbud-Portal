import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, User, X, Camera, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, MbudiaryPost } from './mbudiary/types';
import { getUserProfile, getPosts, saveUserProfile } from './mbudiary/lib/storage';
import { uploadImagesToCloudinary } from './mbudiary/lib/cloudinary';
import { PostList } from './mbudiary/PostList';
import { PostCard } from './mbudiary/PostCard';
import { UserProfileView } from './mbudiary/UserProfileView';
import { PostSkeleton } from './mbudiary/PostSkeleton';

let cachedPosts: MbudiaryPost[] | null = null;

interface MbudiaryViewProps {
  onNavigateToChat?: (targetNrp?: string) => void;
  onCloseSheet?: () => void;
}

export const MbudiaryView: React.FC<MbudiaryViewProps> = ({ 
  onNavigateToChat,
  onCloseSheet 
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getUserProfile());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedAuthorNrp, setSelectedAuthorNrp] = useState<string | null>(null);
  const [refreshKey, forceRefresh] = useState(0);

  const [isLoading, setIsLoading] = useState<boolean>(!cachedPosts);

  const [allPosts, setAllPosts] = useState<MbudiaryPost[]>(() => {
    if (cachedPosts) return cachedPosts;
    const initial = getPosts();
    cachedPosts = initial;
    return initial;
  });

  // REF CONTAINER UNTUK MENJAGA LOKASI SCROLL
  const containerRef = useRef<HTMLDivElement>(null);
  const feedScrollPositionRef = useRef<number>(0);

  const [isEdgeSwiping, setIsEdgeSwiping] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState(currentUser.username || '');
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | undefined>(currentUser.photoUrl);
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isFeedActive = !selectedAuthorNrp && !selectedPostId;

  useEffect(() => {
    if (!cachedPosts) {
      setIsLoading(true);
    }
    const updated = getPosts();
    cachedPosts = updated;
    setAllPosts(updated);
    setIsLoading(false);
  }, [refreshKey]);

  const handleExitToDashboard = () => {
    if (window.location.hash) {
      window.location.hash = '';
    } else {
      window.history.back();
    }
  };

  // RESTORE SCROLL POSITION KE POSISI TERAKHIR NONGKRONG
  const restoreFeedScroll = useCallback(() => {
    setSelectedAuthorNrp(null);
    setSelectedPostId(null);
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = feedScrollPositionRef.current;
      }
    });
  }, []);

  // NAVIGASI DENGAN HISTORY STATE BERTINGKAT
  const handleSelectAuthor = useCallback((nrp: string | null) => {
    if (!selectedAuthorNrp && !selectedPostId && containerRef.current) {
      feedScrollPositionRef.current = containerRef.current.scrollTop;
    }
    setSelectedAuthorNrp(nrp);
    setSelectedPostId(null);
    if (nrp) {
      window.history.pushState({ tab: 'mbudiary', subView: 'user' }, '', '#mbudiary/user');
    }
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [selectedAuthorNrp, selectedPostId]);

  const handleSelectPost = useCallback((postId: string | null) => {
    if (!selectedAuthorNrp && !selectedPostId && containerRef.current) {
      feedScrollPositionRef.current = containerRef.current.scrollTop;
    }
    setSelectedPostId(postId);
    setSelectedAuthorNrp(null);
    if (postId) {
      window.history.pushState({ tab: 'mbudiary', subView: 'post' }, '', '#mbudiary/post');
    }
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [selectedAuthorNrp, selectedPostId]);

  // LISTEN POPSTATE KHUSUS UNTUK INTERNAL MBUDIARY (DETAIL/PROFILE -> FEED)
  useEffect(() => {
    const handleSubPopState = () => {
      const hash = window.location.hash;
      if (hash === '#mbudiary') {
        restoreFeedScroll();
      }
    };

    window.addEventListener('popstate', handleSubPopState);
    return () => window.removeEventListener('popstate', handleSubPopState);
  }, [restoreFeedScroll]);

  // EDGE SWIPE GESTURE DETECTOR UNTUK SHEET
  useEffect(() => {
    if (!selectedAuthorNrp && !selectedPostId) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      if (startX < 45) {
        setIsEdgeSwiping(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEdgeSwiping) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - startX;
      const deltaY = Math.abs(currentY - startY);

      if (deltaX > 80 && deltaY < 50) {
        setIsEdgeSwiping(false);
        window.history.back();
      }
    };

    const handleTouchEnd = () => {
      setIsEdgeSwiping(false);
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener('touchstart', handleTouchStart, { passive: true });
      el.addEventListener('touchmove', handleTouchMove, { passive: true });
      el.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (el) {
        el.removeEventListener('touchstart', handleTouchStart);
        el.removeEventListener('touchmove', handleTouchMove);
        el.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [selectedAuthorNrp, selectedPostId, isEdgeSwiping]);

  useEffect(() => {
    const sync = () => {
      const updatedUser = getUserProfile();
      setCurrentUser(updatedUser);
      forceRefresh((value) => value + 1);
    };

    window.addEventListener('mbud_user_change', sync);
    window.addEventListener('mbud_posts_change', sync);

    return () => {
      window.removeEventListener('mbud_user_change', sync);
      window.removeEventListener('mbud_posts_change', sync);
    };
  }, []);

  const handleOpenEditModal = () => {
    setEditUsername(currentUser.username || '');
    setEditPhotoUrl(currentUser.photoUrl);
    setEditBio(currentUser.bio || '');
    setIsEditModalOpen(true);
  };

  const handleAvatarSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const uploadedUrls = await uploadImagesToCloudinary([file]);
      if (uploadedUrls && uploadedUrls.length > 0) {
        setEditPhotoUrl(uploadedUrls[0]);
      }
    } catch (error) {
      alert('Gagal mengunggah foto profil.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsername.trim()) return;

    try {
      await saveUserProfile({
        ...currentUser,
        username: editUsername.trim().toLowerCase(),
        emoji: '😊',
        photoUrl: editPhotoUrl,
        bio: editBio.trim(),
      });
      setIsEditModalOpen(false);
    } catch (error) {
      alert('Gagal menyimpan profil.');
    }
  };

  const selectedPost: MbudiaryPost | undefined = allPosts.find((post) => post.id === selectedPostId);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-y-auto overscroll-contain text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-300 antialiased relative custom-scrollbar px-2 sm:px-4 pb-16 transform-gpu"
      style={{ willChange: 'scroll-position' }}
    >
      <AnimatePresence>
        {isEdgeSwiping && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed left-3 top-1/2 -translate-y-1/2 z-[9999] pointer-events-none flex items-center gap-1.5"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl border border-white/20">
              <ArrowLeft className="w-5 h-5 animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="w-full max-w-3xl mx-auto py-2 sm:py-4 relative z-10 space-y-3 sm:space-y-4">
        {selectedAuthorNrp && (
          <UserProfileView
            authorNrp={selectedAuthorNrp}
            currentUser={currentUser}
            onBack={() => window.history.back()}
            onSelectPost={(postId) => handleSelectPost(postId)}
            onPostUpdate={() => forceRefresh((value) => value + 1)}
            onSelectAuthor={(authorNrp) => handleSelectAuthor(authorNrp)}
            onOpenEditProfile={handleOpenEditModal}
            onNavigateToChat={onNavigateToChat}
          />
        )}

        {selectedPostId && (
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-xs active:scale-95 group ml-1 sm:ml-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors group-hover:-translate-x-0.5 transform" />
              <span>Kembali</span>
            </button>

            {selectedPost ? (
              <PostCard
                post={selectedPost}
                currentUser={currentUser}
                onPostUpdate={() => forceRefresh((value) => value + 1)}
                onSelectAuthor={(authorNrp) => handleSelectAuthor(authorNrp)}
                isDetailPage
              />
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 text-center text-xs font-medium text-slate-500 dark:text-zinc-400 shadow-xs">
                Postingan tidak ditemukan atau telah dihapus.
              </div>
            )}
          </div>
        )}

        <div className={isFeedActive ? 'space-y-3 sm:space-y-4 block' : 'hidden'}>
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : (
            <PostList
              currentUser={currentUser}
              onSelectPost={(postId) => handleSelectPost(postId)}
              onSelectAuthor={(authorNrp) => handleSelectAuthor(authorNrp)}
              onExitToDashboard={handleExitToDashboard}
              onOpenOwnProfile={() => handleSelectAuthor(currentUser.nrp)}
              onNavigateToChat={onNavigateToChat}
              onCloseSheet={onCloseSheet}
            />
          )}
        </div>
      </main>

      {/* MODAL EDIT PROFIL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  <span>Kustomisasi Profilmu</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                    Foto Profil
                  </label>
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-700">
                      {isUploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      ) : editPhotoUrl ? (
                        <img src={editPhotoUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">😊</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <button
                        type="button"
                        disabled={isUploadingAvatar}
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{editPhotoUrl ? 'Ganti Foto' : 'Upload Foto'}</span>
                      </button>
                      {editPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setEditPhotoUrl(undefined)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Foto</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarSelection}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 dark:text-zinc-500">
                      @
                    </span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                      placeholder="usernameunik"
                      maxLength={30}
                      className="w-full pl-7 pr-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Deskripsi
                    </label>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {editBio.length}/150
                    </span>
                  </div>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value.slice(0, 150))}
                    placeholder="Tulis deskripsi..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!editUsername.trim() || isUploadingAvatar}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isUploadingAvatar && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Simpan Profil</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};