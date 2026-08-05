import React, { useState } from 'react';
import { UserProfile } from '../types';
import { savePost, saveUserProfile } from './lib/storage';
import { 
  Send, 
  Sparkles, 
  Edit3,
  X,
  CheckCircle2,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatePostFormProps {
  userProfile: UserProfile;
  onPostCreated?: () => void;
  onSelectAuthor?: (authorUsername: string) => void;
}

const MAX_CHARS = 280;
const EMOJI_OPTIONS = [
  '😊', '😎', '🎓', '🚀', '🐱', '☕', '🌟', '📚', '💬', '⚡', '🔥', '🌈', 
  '🐶', '🍕', '💡', '🥑', '🦊', '🍀', '🎧', '🎨', '📌', '✨', '🙋‍♂️', '🙋‍♀️',
  '🥳', '🤖', '👾', '💻', '🎮', '⚽', '🏀', '🎾', '🎸', '🎹', '🍩', '🍔',
  '🍟', '🍦', '🍜', '🍣', '🧋', '🛵', '🚗', '✈️', '⛵', '🐼', '🦁', '🐯',
  '🐸', '🦄', '🌻', '🌸', '🌊', '🌙', '⭐', '🎈', '🎉', '🏆', '💎', '🔑',
  '🕵️', '🧑‍💻', '🧑‍🎨', '👨‍🎓', '👩‍🎓', '🧠', '✌️', '🙌', '👏', '🤝', '❤️', '💖'
];

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ userProfile, onPostCreated, onSelectAuthor }) => {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Identity Edit Modal / Inline Drawer
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(userProfile.nickname);
  const [editNrp, setEditNrp] = useState(userProfile.nrp);
  const [editEmoji, setEditEmoji] = useState(userProfile.emoji || '😊');

  const remainingChars = MAX_CHARS - content.length;
  const isOverLimit = remainingChars < 0;
  const isSubmitDisabled = !content.trim() || isOverLimit || isPosting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setIsPosting(true);

    try {
      await savePost({
        authorName: userProfile.nickname,
        authorUsername: userProfile.nrp,
        authorEmoji: userProfile.emoji || '😊',
        content: content.trim(),
        isOfficerPost: false,
      });

      setContent('');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2500);
      onPostCreated?.();
    } catch (error) {
      console.error('[mbudiary] Gagal membuat postingan:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleOpenEdit = () => {
    setEditName(userProfile.nickname);
    setEditNrp(userProfile.nrp);
    setEditEmoji(userProfile.emoji || '😊');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editNrp.trim()) return;

    const updated: UserProfile = {
      nickname: editName.trim(),
      nrp: editNrp.trim().slice(0, 12),
      emoji: editEmoji,
      isOfficer: userProfile.isOfficer,
    };

    saveUserProfile(updated);
    setIsEditModalOpen(false);
    if (onPostCreated) onPostCreated();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden transition-all duration-200">
      
      {/* Top Header: User Profile Badge, Emoji Avatar, and Compact Edit Button */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <button 
            type="button" 
            onClick={handleOpenEdit}
            title="Ubah Emoji Profil"
            className="text-2xl shrink-0 transition-transform active:scale-95 hover:opacity-80 leading-none"
          >
            {userProfile.emoji || '😊'}
          </button>
          <div 
            className="min-w-0 cursor-pointer group/userBadge"
            onClick={() => onSelectAuthor?.(userProfile.nrp)}
            title="Lihat profil saya"
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-900 dark:text-zinc-100 font-bold text-xs truncate group-hover/userBadge:text-indigo-600 dark:group-hover/userBadge:text-indigo-400 transition-colors">
                {userProfile.nickname}
              </span>
              <span className="text-slate-400 dark:text-zinc-500 text-[10px] font-mono shrink-0">
                @{userProfile.nrp}
              </span>
            </div>

          </div>
        </div>

        {/* Compact Edit Profile & NRP Button (Requirement 13) */}
        <button
          type="button"
          onClick={handleOpenEdit}
          className="px-2.5 py-1 rounded-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 border border-slate-100 dark:border-zinc-700 text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
          title="Ubah profil & NRP"
        >
          <Edit3 className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
          <span>Ubah Profil</span>
        </button>
      </div>

      {/* Main Textarea Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Apa yang ingin kamu bagikan ke teman-teman kelas hari ini?"
            rows={3}
            className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
          />

          {/* Toast feedback */}
          <AnimatePresence>
            {showSuccessToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-2 right-2 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-xl shadow-lg flex items-center gap-1.5 z-10"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Postingan berhasil terbit!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Controls & Character Counter */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
          <span className={`text-[10px] font-mono font-medium ${
            isOverLimit 
              ? 'text-rose-600 dark:text-rose-400 font-bold' 
              : remainingChars < 30 
              ? 'text-amber-600 dark:text-amber-400' 
              : 'text-slate-400 dark:text-zinc-500'
          }`}>
            {remainingChars}
          </span>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              isSubmitDisabled
                ? 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed border border-transparent'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95'
            }`}
          >
            {isPosting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Posting</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
                    Ubah Identitas & Emoji
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Pilih Emoji Profil
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 custom-scrollbar">
                    {EMOJI_OPTIONS.map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setEditEmoji(em)}
                        className={`w-8 h-8 text-lg rounded-xl flex items-center justify-center transition-all ${
                          editEmoji === em
                            ? 'bg-indigo-600 text-white scale-110 shadow-sm'
                            : 'hover:bg-slate-200/80 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Nama
                    </label>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                      (Tidak dapat diubah)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editName}
                    disabled
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800/80 text-slate-400 dark:text-zinc-500 text-sm cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Username unik
                    </label>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                      {editNrp.length}/12
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editNrp}
                    maxLength={12}
                    onChange={(e) => setEditNrp(e.target.value.slice(0, 12))}
                    placeholder="Contoh: fadhil_mbud"
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-2xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
