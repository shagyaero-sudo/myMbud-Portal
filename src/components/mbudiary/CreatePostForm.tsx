import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { savePost, saveUserProfile } from './lib/storage';
import { Send, Smile, X, Edit3, Lock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatePostFormProps {
  userProfile: UserProfile;
  onPostCreated?: () => void;
  onSelectAuthor?: (authorUsername: string) => void;
}

const MAX_CHARS = 280;
const EMOJI_OPTIONS = [
  '😊', '😎', '🎓', '🚀', '🐱', '☕', '🌟', '📚', '💬',
  '⚡', '🔥', '🌈', '🐶', '🍕', '💡', '🥑', '🦊', '☘️',
  '🎧', '🎨', '📌', '✨', '🙋‍♂️', '🙋‍♀️', '🥳', '🤖', '👾',
  '💻', '🎮', '⚽', '🏀', '🎾', '🎸', '🎹', '🍩', '🍔',
  '🍟', '🍦', '🍲', '🍱', '🧋', '🛵', '🏎️', '✈️', '🏕️',
];

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  userProfile,
  onPostCreated,
  onSelectAuthor,
}) => {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(userProfile.nickname);
  const [editUsername, setEditUsername] = useState(userProfile.nrp);
  const [editEmoji, setEditEmoji] = useState(userProfile.emoji || '😊');

  // Status apakah user sudah pernah mengganti username (Username != NRP)
  const isUsernameChanged = userProfile.nrp.toLowerCase() !== userProfile.nickname.toLowerCase() && 
                            !userProfile.nickname.match(/^\d+$/);

  useEffect(() => {
    setEditName(userProfile.nickname);
    setEditUsername(userProfile.nickname);
    setEditEmoji(userProfile.emoji || '😊');
  }, [userProfile]);

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPosting || content.length > MAX_CHARS) return;

    setIsPosting(true);
    try {
      await savePost({
        authorName: userProfile.nickname,
        authorUsername: userProfile.nickname,
        authorEmoji: userProfile.emoji || '😊',
        content: content.trim(),
        isOfficerPost: userProfile.isOfficer,
      });

      setContent('');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error('[mbudiary] Gagal membuat postingan:', error);
      alert('Gagal mengirim cerita. Silakan coba lagi.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format username hanya huruf, angka, underscore
    const formattedUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    await saveUserProfile({
      ...userProfile,
      nickname: formattedUsername || userProfile.nickname,
      emoji: editEmoji,
    });

    setIsEditModalOpen(false);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
      {/* Toast Success */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Cerita kamu berhasil diterbitkan di mbudiary!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmitPost} className="space-y-3">
        <div className="flex items-start gap-3">
          {/* Avatar Emoji Button to Edit Profile */}
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="text-2xl p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all shrink-0 active:scale-95 group relative"
            title="Ubah emoji & username"
          >
            <span>{userProfile.emoji || '😊'}</span>
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-full shadow-xs">
              <Edit3 className="w-2.5 h-2.5" />
            </div>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span 
                onClick={() => onSelectAuthor && onSelectAuthor(userProfile.nickname)}
                className="text-xs font-bold text-slate-800 dark:text-zinc-100 hover:text-indigo-600 cursor-pointer"
              >
                @{userProfile.nickname}
              </span>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                Ubah
              </button>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Apa yang sedang terjadi di kelasmu hari ini? Ceritakan..."
              rows={3}
              maxLength={MAX_CHARS}
              className="w-full text-xs bg-transparent text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/80">
          <span className={`text-[10px] font-mono ${content.length > MAX_CHARS - 20 ? 'text-rose-500 font-bold' : 'text-slate-400 dark:text-zinc-500'}`}>
            {content.length}/{MAX_CHARS}
          </span>

          <button
            type="submit"
            disabled={!content.trim() || isPosting}
            className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPosting ? 'Posting...' : 'Kirim'}</span>
          </button>
        </div>
      </form>

      {/* Modal Edit Identitas & Emoji */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Smile className="w-5 h-5 text-indigo-500" />
                  <span>Ubah Identitas & Emoji</span>
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Pilih Emoji */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                    Pilih Emoji Profil
                  </label>
                  <div className="grid grid-cols-9 gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 max-h-36 overflow-y-auto">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setEditEmoji(emoji)}
                        className={`text-xl p-1.5 rounded-xl transition-all ${
                          editEmoji === emoji
                            ? 'bg-indigo-600 text-white scale-110 shadow-sm'
                            : 'hover:bg-slate-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nama (Locked) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Nama
                    </label>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      (Tidak dapat diubah)
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={userProfile.nrp}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 text-xs border border-slate-200 dark:border-zinc-700/60 cursor-not-allowed font-medium"
                  />
                </div>

                {/* Username Unik (1x Kesempatan Ubah) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                      <span>Username unik</span>
                      {isUsernameChanged && <Lock className="w-3 h-3 text-amber-500" />}
                    </label>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {isUsernameChanged ? '(Kesempatan ganti sudah habis)' : 'Bisa diganti 1x'}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      disabled={isUsernameChanged}
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="Username_unik"
                      maxLength={15}
                      className={`w-full px-4 py-3 rounded-2xl text-xs border transition-all ${
                        isUsernameChanged
                          ? 'bg-slate-100 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700/60 cursor-not-allowed font-mono'
                          : 'bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono'
                      }`}
                    />
                  </div>
                  {!isUsernameChanged && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                      ⚠️ Catatan: Username hanya bisa diubah 1 kali. Setelah disimpan tidak bisa diubah kembali.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                  >
                    Simpan
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