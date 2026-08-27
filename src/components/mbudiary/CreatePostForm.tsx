import React, { useRef, useState, useEffect } from 'react';
import { UserProfile, MbudiaryUser } from '../../types';
import { savePost, processMentionsInContent, searchUsersForMention } from './lib/storage';
import { uploadImagesToCloudinary } from './lib/cloudinary';
import { getOptimizedImageUrl } from './lib/utils';
import {
  Send,
  X,
  CheckCircle2,
  ImagePlus,
  Camera,
  Images,
  Loader2,
  AtSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatePostFormProps {
  userProfile: UserProfile;
  onPostCreated?: () => void;
  onSelectAuthor?: (authorNrp: string) => void;
}

const MAX_CHARS = 280;
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  userProfile,
  onPostCreated,
  onSelectAuthor,
}) => {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);

  const [mentionSuggestions, setMentionSuggestions] = useState<MbudiaryUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(48, textareaRef.current.scrollHeight)}px`;
    }
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtMatch = textBeforeCursor.match(/@([a-zA-Z0-9_.]*)$/);

    if (lastAtMatch) {
      const q = lastAtMatch[1];
      setMentionQuery(q);
      setMentionSuggestions(searchUsersForMention(q));
    } else {
      setMentionQuery(null);
      setMentionSuggestions([]);
    }
  };

  const selectMentionUser = (username: string) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);

    const updatedBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_.]*)$/, `@${username} `);
    setContent(updatedBefore + textAfterCursor);

    setMentionQuery(null);
    setMentionSuggestions([]);
    textareaRef.current.focus();
  };

  const clearSelectedImages = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setPreviewUrls([]);
  };

  const removeImage = (index: number) => {
    const preview = previewUrls[index];
    if (preview) URL.revokeObjectURL(preview);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';

    if (!files.length) return;

    const remainingSlots = MAX_IMAGES - selectedImages.length;
    if (remainingSlots <= 0) {
      alert(`Maksimal ${MAX_IMAGES} gambar per postingan.`);
      setIsUploadMenuOpen(false);
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    const validFiles: File[] = [];

    for (const file of filesToAdd) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        alert(`"${file.name}" bukan format gambar yang didukung.`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        alert(`"${file.name}" terlalu besar. Maksimal 10 MB per gambar.`);
        continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) {
      setIsUploadMenuOpen(false);
      return;
    }

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

    setSelectedImages((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
    setIsUploadMenuOpen(false);
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isPosting || content.length > MAX_CHARS) return;

    setIsPosting(true);

    try {
      const imageUrls = await uploadImagesToCloudinary(selectedImages);

      const newPost = await savePost({
        authorNrp: userProfile.nrp,
        content: content.trim(),
        isOfficerPost: userProfile.isOfficer,
        imageUrls,
        isRepost: false,
      });

      await processMentionsInContent({
        content: content.trim(),
        senderNrp: userProfile.nrp,
        senderName: userProfile.nickname || userProfile.username || 'Mbuders',
        postId: newPost.id,
      });

      setContent('');
      clearSelectedImages();
      setShowSuccessToast(true);

      setTimeout(() => setShowSuccessToast(false), 3000);
      onPostCreated?.();
    } catch (error) {
      console.error('[mbudiary] Gagal membuat postingan:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Gagal mengirim cerita. Silakan coba lagi.'
      );
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="px-3.5 py-3 sm:px-4 sm:py-3.5 w-full bg-white/40 dark:bg-zinc-950/20 transition-colors">
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-2 mb-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Cerita kamu berhasil diposting!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-2.5 sm:gap-3">
        {/* AVATAR USER */}
        <div
          onClick={() => onSelectAuthor?.(userProfile.nrp)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/60 dark:bg-zinc-800 shrink-0 flex items-center justify-center overflow-hidden border border-slate-200/80 dark:border-zinc-700/80 cursor-pointer hover:opacity-90 transition-opacity mt-0.5"
        >
          {userProfile.photoUrl ? (
            <img src={getOptimizedImageUrl(userProfile.photoUrl)} alt="Foto Profil" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-lg leading-none">{userProfile.emoji || '😊'}</span>
          )}
        </div>

        {/* INPUT TEKS & ACTIONS */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Apa yang sedang terjadi?..."
              rows={2}
              maxLength={MAX_CHARS}
              className="w-full text-xs sm:text-sm bg-transparent text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none resize-none leading-relaxed min-h-[48px] max-h-[220px] overflow-y-auto"
            />

            {/* DROPDOWN MENTION */}
            {mentionQuery !== null && mentionSuggestions.length > 0 && (
              <div className="absolute left-0 top-full mt-1 z-[60] w-72 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-zinc-700 rounded-2xl p-1.5 shadow-2xl max-h-52 overflow-y-auto custom-scrollbar">
                <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-2 py-1 flex items-center gap-1">
                  <AtSign className="w-3 h-3 text-blue-500" />
                  <span>Pilih User</span>
                </div>
                {mentionSuggestions.map((u) => (
                  <div
                    key={u.nrp}
                    onClick={() => selectMentionUser(u.username)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-blue-50/80 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/50 dark:border-zinc-700">
                      {u.photoUrl ? (
                        <img src={getOptimizedImageUrl(u.photoUrl)} alt={u.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm leading-none">{u.emoji}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">{u.nickname}</div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-400 truncate">@{u.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PREVIEW GAMBAR */}
          <AnimatePresence>
            {previewUrls.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-2 pb-1"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {previewUrls.map((preview, index) => (
                    <div key={preview} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 group">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-500 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOTTOM CONTROLS & SUBMIT BUTTON */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/40 dark:border-white/5 mt-1 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUploadMenuOpen((prev) => !prev)}
                disabled={isPosting || selectedImages.length >= MAX_IMAGES}
                className="p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Upload Gambar"
              >
                <ImagePlus className="w-4 h-4" />
                {selectedImages.length > 0 && (
                  <span className="font-bold bg-blue-100 dark:bg-blue-900/50 px-1.5 rounded-md text-[10px]">
                    {selectedImages.length}/{MAX_IMAGES}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isUploadMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsUploadMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.97 }}
                      className="absolute left-0 bottom-full mb-2 z-40 w-44 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl border border-white/60 dark:border-zinc-700 rounded-2xl p-1 shadow-xl"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsUploadMenuOpen(false);
                          cameraInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-blue-500" />
                        <span>Kamera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUploadMenuOpen(false);
                          galleryInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        <Images className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Galeri Foto</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2.5">
              <span className={`text-[10px] font-mono font-bold ${content.length > MAX_CHARS - 20 ? 'text-rose-500' : 'text-slate-400 dark:text-zinc-500'}`}>
                {content.length > 0 && `${content.length}/${MAX_CHARS}`}
              </span>

              <button
                type="button"
                onClick={handleSubmitPost}
                disabled={!content.trim() || isPosting}
                className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-zinc-800 text-white disabled:text-slate-400 dark:disabled:text-zinc-500 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
              >
                {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>Post</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleImageSelection} />
      <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={handleImageSelection} />
    </div>
  );
};