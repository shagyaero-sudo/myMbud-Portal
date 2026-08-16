import React, { useEffect, useState } from 'react';
import { ArrowLeft, User, Edit3, X, Camera, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, MbudiaryPost } from './mbudiary/types';
import { getUserProfile, getPosts, initializeMbudiary, saveUserProfile } from './mbudiary/lib/storage';
import { uploadImagesToCloudinary } from './mbudiary/lib/cloudinary';
import { CreatePostForm } from './mbudiary/CreatePostForm';
import { PostList } from './mbudiary/PostList';
import { PostCard } from './mbudiary/PostCard';
import { UserProfileView } from './mbudiary/UserProfileView';

const ONBOARDING_PROFILE_KEY = 'mbud_onboarded_mbudiary_profile';

export const MbudiaryView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getUserProfile());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedAuthorNrp, setSelectedAuthorNrp] = useState<string | null>(null);
  const [, forceRefresh] = useState(0);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState(currentUser.username || '');
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | undefined>(currentUser.photoUrl);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // AUTO PROMPT MODAL PROFIL PADA FIRST VISIT
  useEffect(() => {
    const hasPrompted = localStorage.getItem(ONBOARDING_PROFILE_KEY);
    const isDefaultUsername = !currentUser.username || currentUser.username.startsWith('mbuder_') || currentUser.username === 'mbuders';
    const isNoCustomPhoto = !currentUser.photoUrl;

    if (!hasPrompted && (isDefaultUsername || isNoCustomPhoto)) {
      setEditUsername(currentUser.username || '');
      setEditPhotoUrl(currentUser.photoUrl);
      setIsEditModalOpen(true);
      localStorage.setItem(ONBOARDING_PROFILE_KEY, 'true');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = initializeMbudiary();
    const sync = () => {
      const updatedUser = getUserProfile();
      setCurrentUser(updatedUser);
      forceRefresh((value) => value + 1);
    };

    const handleNotificationNavigation = () => {
      const targetPostId = localStorage.getItem('mbud_target_post_id');
      const targetActorNrp = localStorage.getItem('mbud_target_actor_nrp');

      if (targetPostId) {
        setSelectedPostId(targetPostId);
        setSelectedAuthorNrp(null);
        localStorage.removeItem('mbud_target_post_id');
      } else if (targetActorNrp) {
        setSelectedAuthorNrp(targetActorNrp);
        setSelectedPostId(null);
        localStorage.removeItem('mbud_target_actor_nrp');
      }
    };

    handleNotificationNavigation();

    window.addEventListener('mbud_user_change', sync);
    window.addEventListener('mbud_users_change', sync);
    window.addEventListener('mbud_posts_change', sync);
    window.addEventListener('mbud_follows_change', sync);
    window.addEventListener('mbud_notification_navigate', handleNotificationNavigation);

    return () => {
      window.removeEventListener('mbud_user_change', sync);
      window.removeEventListener('mbud_users_change', sync);
      window.removeEventListener('mbud_posts_change', sync);
      window.removeEventListener('mbud_follows_change', sync);
      window.removeEventListener('mbud_notification_navigate', handleNotificationNavigation);
      unsubscribe();
    };
  }, []);

  const handleOpenEditModal = () => {
    setEditUsername(currentUser.username || '');
    setEditPhotoUrl(currentUser.photoUrl);
    setIsEditModalOpen(true);
  };

  const handleAvatarSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran foto profil maksimal 10 MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadedUrls = await uploadImagesToCloudinary([file]);
      if (uploadedUrls && uploadedUrls.length > 0) {
        setEditPhotoUrl(uploadedUrls[0]);
      }
    } catch (error) {
      console.error('[mbudiary] Gagal upload foto profil:', error);
      alert('Gagal mengunggah foto profil. Silakan coba lagi.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = editUsername.trim().toLowerCase();

    if (!normalizedUsername) {
      alert('Username tidak boleh kosong.');
      return;
    }

    try {
      await saveUserProfile({
        ...currentUser,
        username: normalizedUsername,
        emoji: '😊',
        photoUrl: editPhotoUrl,
      });
      localStorage.setItem(ONBOARDING_PROFILE_KEY, 'true');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('[mbudiary] Gagal menyimpan profil:', error);
      alert(error instanceof Error ? error.message : 'Gagal menyimpan profil.');
    }
  };

  const allPosts = getPosts();
  const selectedPost: MbudiaryPost | undefined = allPosts.find((post) => post.id === selectedPostId);

  return (
    <div className="w-full text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-300 antialiased relative">
      <main className="w-full max-w-3xl mx-auto px-0 sm:px-2 py-2 sm:py-6 pb-24 sm:pb-8 relative z-10 space-y-3 sm:space-y-5">
        {selectedAuthorNrp ? (
          <UserProfileView
            authorNrp={selectedAuthorNrp}
            currentUser={currentUser}
            onBack={() => setSelectedAuthorNrp(null)}
            onSelectPost={(postId) => {
              setSelectedPostId(postId);
              setSelectedAuthorNrp(null);
            }}
            onPostUpdate={() => forceRefresh((value) => value + 1)}
            onSelectAuthor={(authorNrp) => setSelectedAuthorNrp(authorNrp)}
          />
        ) : selectedPostId ? (
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => setSelectedPostId(null)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all shadow-xs active:scale-95 group ml-1 sm:ml-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              <span>Kembali</span>
            </button>

            {selectedPost ? (
              <PostCard
                post={selectedPost}
                currentUser={currentUser}
                onPostUpdate={() => forceRefresh((value) => value + 1)}
                onSelectAuthor={(authorNrp) => {
                  setSelectedAuthorNrp(authorNrp);
                  setSelectedPostId(null);
                }}
                isDetailPage
              />
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8 text-center text-xs font-medium text-slate-500 dark:text-zinc-400 shadow-xs">
                Postingan tidak ditemukan atau telah dihapus.
              </div>
            )}
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between gap-3 px-3 sm:px-1 pt-1 pb-1">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                    mbudiary.
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                    Satu hari, sejuta cerita.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleOpenEditModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900/60 hover:bg-blue-50/50 dark:hover:bg-zinc-800/80 transition-all shadow-xs active:scale-95 cursor-pointer"
                    title="Kustomisasi Profilmu"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                    <span className="hidden xs:inline">Kustomisasi</span>
                  </button>

                  <button
                    onClick={() => setSelectedAuthorNrp(currentUser.nrp)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900/60 hover:bg-blue-50/50 dark:hover:bg-zinc-800/80 transition-all shadow-xs active:scale-95 cursor-pointer"
                    title="Lihat Profil Saya"
                  >
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Profil Saya</span>
                  </button>
                </div>
              </div>
            </motion.div>

            <CreatePostForm
              userProfile={currentUser}
              onPostCreated={() => forceRefresh((value) => value + 1)}
              onSelectAuthor={(authorNrp) => setSelectedAuthorNrp(authorNrp)}
            />

            <AnimatePresence mode="popLayout">
              <PostList
                currentUser={currentUser}
                onSelectPost={(postId) => setSelectedPostId(postId)}
                onSelectAuthor={(authorNrp) => setSelectedAuthorNrp(authorNrp)}
              />
            </AnimatePresence>
          </>
        )}
      </main>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
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
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-zinc-700">
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
                          <Trash2 className="w-3 h-3" />
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
                      className="w-full pl-7 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-xs border border-slate-200/80 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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