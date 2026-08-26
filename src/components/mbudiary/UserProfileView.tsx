import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import {
  getPosts,
  isFollowing,
  toggleFollow,
  getFollowerCount,
  getFollowingCount,
  getFollowerNrps,
  getFollowingNrps,
  getCachedUserByNrp,
  setUserVerified,
  saveUserProfile,
} from './lib/storage';
import { uploadImagesToCloudinary } from './lib/cloudinary';
import { getOptimizedImageUrl } from './lib/utils';
import { PostCard, VerifiedBadge, getBadgeTier } from './PostCard';
import {
  ArrowLeft,
  FileText,
  Users,
  UserPlus,
  UserCheck,
  BadgeCheck,
  Loader2,
  Edit2,
  Edit3,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { notifyUserFollowed } from '../../services/oneSignalNotification';

interface UserProfileViewProps {
  authorNrp: string;
  currentUser: UserProfile;
  onBack: () => void;
  onSelectPost?: (postId: string) => void;
  onPostUpdate?: () => void;
  onSelectAuthor?: (authorNrp: string) => void;
  onOpenEditProfile?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  authorNrp,
  currentUser,
  onBack,
  onSelectPost,
  onPostUpdate,
  onSelectAuthor,
  onOpenEditProfile,
}) => {
  const allPosts = getPosts();
  const [following, setFollowing] = useState<boolean>(isFollowing(authorNrp));
  const [followerCount, setFollowerCount] = useState<number>(getFollowerCount(authorNrp));
  const [followingCount, setFollowingCount] = useState<number>(getFollowingCount(authorNrp));
  const [isTogglingVerified, setIsTogglingVerified] = useState(false);
  
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);
  const headerInputRef = useRef<HTMLInputElement>(null);

  const [followModalType, setFollowModalType] = useState<'followers' | 'following' | null>(null);
  const [modalUsersList, setModalUsersList] = useState<string[]>([]);

  const authorProfile = getCachedUserByNrp(authorNrp);
  const isSelf = currentUser.nrp.toLowerCase() === authorNrp.toLowerCase();

  useEffect(() => {
    const syncProfileState = () => {
      setFollowing(isFollowing(authorNrp));
      setFollowerCount(getFollowerCount(authorNrp));
      setFollowingCount(getFollowingCount(authorNrp));
    };

    syncProfileState();
    window.addEventListener('mbud_follows_change', syncProfileState);
    window.addEventListener('mbud_users_change', syncProfileState);
    window.addEventListener('mbud_posts_change', syncProfileState);

    return () => {
      window.removeEventListener('mbud_follows_change', syncProfileState);
      window.removeEventListener('mbud_users_change', syncProfileState);
      window.removeEventListener('mbud_posts_change', syncProfileState);
    };
  }, [authorNrp]);

  const handleFollowToggle = async () => {
    try {
      const isNowFollowing = await toggleFollow(authorNrp);
      setFollowing(isNowFollowing);
      setFollowerCount(getFollowerCount(authorNrp));
      setFollowingCount(getFollowingCount(authorNrp));

      if (isNowFollowing) {
        void notifyUserFollowed({
          targetNrp: authorNrp,
          actorNrp: currentUser.nrp,
          actorName: currentUser.nickname || currentUser.username || 'Mbuders',
        });
      }
    } catch (error) {
      console.error('[mbudiary] Gagal mengubah follow:', error);
    }
  };

  // Siklus 3 Status: Normal -> Blue -> Gold -> Normal
  const handleVerifyCycle = async () => {
    if (isTogglingVerified) return;
    setIsTogglingVerified(true);
    try {
      const currentTier = getBadgeTier(authorNrp, (authorProfile as any)?.isVerified);
      
      let nextState: any = false;
      if (!currentTier) {
        nextState = 'blue';
      } else if (currentTier === 'blue') {
        nextState = 'gold';
      } else {
        nextState = false;
      }

      await setUserVerified(authorNrp, nextState);
    } catch (error) {
      console.error('[mbudiary] Gagal toggle badge status:', error);
      alert('Gagal mengubah status verifikasi user.');
    } finally {
      setIsTogglingVerified(false);
    }
  };

  const handleHeaderSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran foto header maksimal 10 MB.');
      return;
    }

    setIsUploadingHeader(true);
    try {
      const uploadedUrls = await uploadImagesToCloudinary([file]);
      if (uploadedUrls && uploadedUrls.length > 0) {
        await saveUserProfile({
          ...currentUser,
          photoUrl: currentUser.photoUrl || undefined,
          headerUrl: uploadedUrls[0],
        });
      }
    } catch (error) {
      console.error('[mbudiary] Gagal upload foto header:', error);
      alert('Gagal mengunggah foto header. Silakan coba lagi.');
    } finally {
      setIsUploadingHeader(false);
    }
  };

  const openFollowModal = (type: 'followers' | 'following') => {
    setFollowModalType(type);
    if (type === 'followers') {
      setModalUsersList(getFollowerNrps(authorNrp));
    } else {
      setModalUsersList(getFollowingNrps(authorNrp));
    }
  };

  const userPosts = allPosts.filter((post) => post.authorNrp.toLowerCase() === authorNrp.toLowerCase());

  const authorName = authorProfile?.nickname || (isSelf ? currentUser.nickname : 'Mbuders');
  const authorUsername = authorProfile?.username || (isSelf ? currentUser.username : '');
  const authorEmoji = authorProfile?.emoji || (isSelf ? currentUser.emoji : '😊');
  const authorPhotoUrl = authorProfile?.photoUrl || (isSelf ? currentUser.photoUrl : undefined);
  const authorHeaderUrl = authorProfile?.headerUrl || (isSelf ? currentUser.headerUrl : undefined);

  const activeBadgeTier = getBadgeTier(authorNrp, (authorProfile as any)?.isVerified);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* TOMBOL KEMBALI */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/90 dark:hover:bg-zinc-800 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none group active:scale-95 cursor-pointer ml-1 sm:ml-0"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        <span>Kembali</span>
      </button>

      {/* CARD PROFIL USER */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none relative overflow-hidden w-full"
      >
        <div className="w-full h-32 sm:h-44 relative bg-slate-200 dark:bg-zinc-800">
          {authorHeaderUrl ? (
            <img src={getOptimizedImageUrl(authorHeaderUrl)} alt="Header Profil" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-slate-200 via-blue-50 to-indigo-50 dark:from-zinc-800 dark:via-zinc-850 dark:to-zinc-900" />
          )}

          {isSelf && (
            <div className="absolute top-4 right-4 z-10">
              <input type="file" accept="image/*" className="hidden" ref={headerInputRef} onChange={handleHeaderSelection} />
              <button
                onClick={() => headerInputRef.current?.click()}
                disabled={isUploadingHeader}
                className="p-2 sm:px-3 sm:py-2 rounded-full sm:rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-[11px] font-bold shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isUploadingHeader ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                <span className="hidden sm:inline">Edit Sampul</span>
              </button>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 pb-5 sm:pb-6">
          <div className="flex justify-between items-end -mt-10 sm:-mt-12 mb-3 relative z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.25rem] sm:rounded-[1.5rem] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1.5 shadow-xs border border-white/60 dark:border-white/10">
              <div className="w-full h-full rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-slate-200/80 dark:border-zinc-700/80">
                {authorPhotoUrl ? (
                  <img src={getOptimizedImageUrl(authorPhotoUrl)} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl sm:text-5xl leading-none">{authorEmoji}</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              {isSelf && (
                <button
                  type="button"
                  onClick={onOpenEditProfile}
                  className="px-4 py-2 sm:py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-[13px] transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profil</span>
                </button>
              )}

              {/* TOMBOL OFFICER: SIKLUS NORMAL -> BIRU -> EMAS -> CABUT */}
              {currentUser.isOfficer && !isSelf && (
                <button
                  type="button"
                  disabled={isTogglingVerified}
                  onClick={handleVerifyCycle}
                  className={`p-2 sm:px-3 sm:py-2 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer ${
                    activeBadgeTier === 'gold'
                      ? 'bg-rose-50/80 text-rose-600 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60'
                      : activeBadgeTier === 'blue'
                      ? 'bg-amber-50/80 text-amber-600 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60'
                      : 'bg-blue-50/80 text-blue-600 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60'
                  }`}
                  title="Klik untuk mengubah tier centang akun ini"
                >
                  {isTogglingVerified ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : activeBadgeTier === 'gold' ? (
                    <BadgeCheck className="w-4 h-4 text-rose-500" />
                  ) : activeBadgeTier === 'blue' ? (
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  ) : (
                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                  )}

                  <span className="hidden sm:inline">
                    {activeBadgeTier === 'gold'
                      ? 'Cabut Centang'
                      : activeBadgeTier === 'blue'
                      ? '⭐ Upgrade Emas'
                      : '+ Kasih Cenblu'}
                  </span>
                </button>
              )}

              {!isSelf && (
                <button
                  onClick={handleFollowToggle}
                  className={`px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-[13px] font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer ${following ? 'bg-white/80 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-rose-50 hover:text-rose-600' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}
                >
                  {following ? (
                    <><UserCheck className="w-4 h-4 text-emerald-500" /><span className="hidden sm:inline">Mengikuti</span></>
                  ) : (
                    <><UserPlus className="w-4 h-4" /><span className="hidden sm:inline">Ikuti</span></>
                  )}
                  <span className="sm:hidden">{following ? 'Mengikuti' : 'Ikuti'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">{authorName}</h2>
              <VerifiedBadge authorNrp={authorNrp} isVerified={(authorProfile as any)?.isVerified} size="md" />
              {isSelf && (
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-blue-50/80 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 ml-1">Saya</span>
              )}
            </div>
            {authorUsername && (
              <div className="text-[13px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">@{authorUsername}</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 w-full">
            <div className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-white/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-white/5 flex flex-col xl:flex-row items-center justify-center gap-1 sm:gap-2 text-[11px] sm:text-[13px] transition-colors text-center">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-black text-slate-900 dark:text-zinc-100 leading-none">{userPosts.length}</span>
              </div>
              <span className="text-slate-500 dark:text-zinc-400 font-medium leading-none mt-0.5 xl:mt-0">Cerita</span>
            </div>

            <button onClick={() => openFollowModal('followers')} className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-white/60 hover:bg-white/90 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 border border-slate-200/50 dark:border-white/5 flex flex-col xl:flex-row items-center justify-center gap-1 sm:gap-2 text-[11px] sm:text-[13px] transition-all cursor-pointer text-center">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-black text-slate-900 dark:text-zinc-100 leading-none">{followerCount}</span>
              </div>
              <span className="text-slate-500 dark:text-zinc-400 font-medium leading-none mt-0.5 xl:mt-0">Pengikut</span>
            </button>

            <button onClick={() => openFollowModal('following')} className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-white/60 hover:bg-white/90 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 border border-slate-200/50 dark:border-white/5 flex flex-col xl:flex-row items-center justify-center gap-1 sm:gap-2 text-[11px] sm:text-[13px] transition-all cursor-pointer text-center">
              <div className="flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-black text-slate-900 dark:text-zinc-100 leading-none">{followingCount}</span>
              </div>
              <span className="text-slate-500 dark:text-zinc-400 font-medium leading-none mt-0.5 xl:mt-0">Mengikuti</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* DAFTAR POSTINGAN USER */}
      <div className="space-y-3 pt-1">
        {userPosts.length === 0 ? (
          <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl p-8 text-center text-xs text-slate-400 dark:text-zinc-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none w-full">
            User ini belum membuat postingan di mbudiary.
          </div>
        ) : (
          userPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUser={currentUser} onPostUpdate={onPostUpdate} onSelectPost={onSelectPost} onSelectAuthor={onSelectAuthor} />
          ))
        )}
      </div>

      {/* MODAL PENGIKUT & MENGIKUTI */}
      <AnimatePresence>
        {followModalType && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setFollowModalType(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[70dvh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/40 dark:border-white/10 shrink-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  {followModalType === 'followers' ? <Users className="w-5 h-5 text-amber-500" /> : <UserPlus className="w-5 h-5 text-emerald-500" />}
                  {followModalType === 'followers' ? 'Pengikut' : 'Mengikuti'}
                </h3>
                <button onClick={() => setFollowModalType(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-2 flex-1 custom-scrollbar pr-2">
                {modalUsersList.length === 0 ? (
                  <div className="text-center p-6 text-sm text-slate-500 dark:text-zinc-400 italic">
                    Belum ada {followModalType === 'followers' ? 'pengikut' : 'yang diikuti'}.
                  </div>
                ) : (
                  modalUsersList.map((nrp) => {
                    const user = getCachedUserByNrp(nrp);
                    if (!user) return null;
                    return (
                      <div
                        key={nrp}
                        onClick={() => {
                          setFollowModalType(null);
                          onSelectAuthor?.(nrp);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/60 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors border border-transparent hover:border-slate-200/50 dark:hover:border-white/5"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-zinc-700">
                          {user.photoUrl ? (
                            <img src={getOptimizedImageUrl(user.photoUrl)} alt={user.nickname} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl leading-none">{user.emoji}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{user.nickname}</span>
                            <VerifiedBadge authorNrp={nrp} isVerified={(user as any)?.isVerified} size="sm" />
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">@{user.username}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};