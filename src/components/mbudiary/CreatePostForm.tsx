import React, {
  useRef,
  useState,
} from 'react';

import { UserProfile } from './types';

import {
  savePost,
  saveUserProfile,
} from './lib/storage';

import {
  uploadImagesToCloudinary,
} from './lib/cloudinary';

import {
  Send,
  Smile,
  X,
  Edit3,
  CheckCircle2,
  ImagePlus,
  Camera,
  Images,
  Loader2,
} from 'lucide-react';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

interface CreatePostFormProps {
  userProfile: UserProfile;
  onPostCreated?: () => void;
  onSelectAuthor?: (
    authorNrp: string
  ) => void;
}

const MAX_CHARS = 280;
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE =
  10 * 1024 * 1024;

const EMOJI_OPTIONS = [
  '😊',
  '😎',
  '🎓',
  '🚀',
  '🐱',
  '☕',
  '🌟',
  '📚',
  '💬',
  '⚡',
  '🔥',
  '🌈',
  '🐶',
  '🍕',
  '💡',
  '🥑',
  '🦊',
  '☘️',
  '🎧',
  '🎨',
  '📌',
  '✨',
  '🙋‍♂️',
  '🙋‍♀️',
  '🥳',
  '🤖',
  '👾',
  '💻',
  '🎮',
  '⚽',
  '🏀',
  '🎾',
  '🎸',
  '🎹',
  '🍩',
  '🍔',
  '🍟',
  '🍦',
  '🍲',
  '🍱',
  '🧋',
  '🛵',
  '🏎️',
  '✈️',
  '🏕️',
];

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const CreatePostForm: React.FC<
  CreatePostFormProps
> = ({
  userProfile,
  onPostCreated,
  onSelectAuthor,
}) => {
  const [content, setContent] =
    useState('');

  const [selectedImages, setSelectedImages] =
    useState<File[]>([]);

  const [previewUrls, setPreviewUrls] =
    useState<string[]>([]);

  const [isPosting, setIsPosting] =
    useState(false);

  const [
    showSuccessToast,
    setShowSuccessToast,
  ] = useState(false);

  const [
    isUploadMenuOpen,
    setIsUploadMenuOpen,
  ] = useState(false);

  const [
    isEditModalOpen,
    setIsEditModalOpen,
  ] = useState(false);

  const [
    editEmoji,
    setEditEmoji,
  ] = useState(
    userProfile.emoji || '😊'
  );

  const [
    editUsername,
    setEditUsername,
  ] = useState(
    userProfile.username || ''
  );

  const galleryInputRef =
    useRef<HTMLInputElement>(null);

  const cameraInputRef =
    useRef<HTMLInputElement>(null);

  /* =========================================================
     IMAGE CLEANUP
     ========================================================= */

  const clearSelectedImages =
    () => {
      previewUrls.forEach((url) =>
        URL.revokeObjectURL(url)
      );

      setSelectedImages([]);
      setPreviewUrls([]);
    };

  const removeImage = (
    index: number
  ) => {
    const preview =
      previewUrls[index];

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setSelectedImages((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );

    setPreviewUrls((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  /* =========================================================
     IMAGE PICKER
     ========================================================= */

  const handleImageSelection = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      e.target.files || []
    );

    // Reset input supaya file yang sama
    // tetap bisa dipilih lagi.
    e.target.value = '';

    if (!files.length) {
      return;
    }

    const remainingSlots =
      MAX_IMAGES -
      selectedImages.length;

    if (remainingSlots <= 0) {
      alert(
        `Maksimal ${MAX_IMAGES} gambar per postingan.`
      );

      setIsUploadMenuOpen(false);

      return;
    }

    const filesToAdd =
      files.slice(0, remainingSlots);

    const validFiles: File[] = [];

    for (const file of filesToAdd) {
      if (
        !ALLOWED_IMAGE_TYPES.includes(
          file.type
        )
      ) {
        alert(
          `"${file.name}" bukan format gambar yang didukung.`
        );

        continue;
      }

      if (
        file.size >
        MAX_IMAGE_SIZE
      ) {
        alert(
          `"${file.name}" terlalu besar. Maksimal 10 MB per gambar.`
        );

        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      setIsUploadMenuOpen(false);

      return;
    }

    const newPreviews =
      validFiles.map((file) =>
        URL.createObjectURL(file)
      );

    setSelectedImages((prev) => [
      ...prev,
      ...validFiles,
    ]);

    setPreviewUrls((prev) => [
      ...prev,
      ...newPreviews,
    ]);

    setIsUploadMenuOpen(false);
  };

  /* =========================================================
     CREATE POST
     ========================================================= */

  const handleSubmitPost =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (
        !content.trim() ||
        isPosting ||
        content.length > MAX_CHARS
      ) {
        return;
      }

      setIsPosting(true);

      try {
        /**
         * Upload semua gambar terlebih dahulu.
         *
         * Cloudinary mengembalikan array URL.
         */
        const imageUrls =
          await uploadImagesToCloudinary(
            selectedImages
          );

        await savePost({
          authorNrp:
            userProfile.nrp,

          content:
            content.trim(),

          isOfficerPost:
            userProfile.isOfficer,

          imageUrls,

          isRepost: false,
        });

        setContent('');

        clearSelectedImages();

        setShowSuccessToast(
          true
        );

        setTimeout(
          () =>
            setShowSuccessToast(
              false
            ),
          3000
        );

        onPostCreated?.();
      } catch (error) {
        console.error(
          '[mbudiary] Gagal membuat postingan:',
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : 'Gagal mengirim cerita. Silakan coba lagi.'
        );
      } finally {
        setIsPosting(false);
      }
    };

  /* =========================================================
     EDIT PROFILE
     ========================================================= */

  const handleSaveProfile =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      const normalizedUsername =
        editUsername
          .trim()
          .toLowerCase();

      if (!normalizedUsername) {
        alert(
          'Username tidak boleh kosong.'
        );

        return;
      }

      try {
        await saveUserProfile({
          ...userProfile,

          username:
            normalizedUsername,

          emoji:
            editEmoji,
        });

        setIsEditModalOpen(
          false
        );
      } catch (error) {
        console.error(
          '[mbudiary] Gagal menyimpan profil:',
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : 'Gagal menyimpan profil.'
        );
      }
    };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">

      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />

            <span>
              Cerita kamu berhasil
              diterbitkan di mbudiary!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE POST FORM */}
      <form
        onSubmit={
          handleSubmitPost
        }
        className="space-y-3"
      >
        <div className="flex items-start gap-3">

          {/* EMOJI / EDIT PROFILE BUTTON */}
          <button
            type="button"
            onClick={() => {
              setEditEmoji(
                userProfile.emoji ||
                  '😊'
              );

              setEditUsername(
                userProfile.username ||
                  ''
              );

              setIsEditModalOpen(
                true
              );
            }}
            className="text-2xl p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all shrink-0 active:scale-95 group relative"
            title="Edit Profil"
          >
            <span>
              {userProfile.emoji ||
                '😊'}
            </span>

            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-full shadow-xs">
              <Edit3 className="w-2.5 h-2.5" />
            </div>
          </button>

          <div className="flex-1 min-w-0">

            {/* CURRENT USER IDENTITY */}
            <div className="flex flex-col mb-1">

              <span
                onClick={() =>
                  onSelectAuthor?.(
                    userProfile.nrp
                  )
                }
                className="text-xs font-bold text-slate-800 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
              >
                {userProfile.nickname}
              </span>

              <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                @{userProfile.username}
              </span>

            </div>

            {/* POST CONTENT */}
            <textarea
              value={content}
              onChange={(e) =>
                setContent(
                  e.target.value
                )
              }
              placeholder="Apa yang terjadi hari ini? Ceritakan..."
              rows={3}
              maxLength={
                MAX_CHARS
              }
              className="w-full text-xs bg-transparent text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* IMAGE PREVIEWS */}
        <AnimatePresence>
          {previewUrls.length > 0 && (
            <motion.div
              initial={{
                opacity: 0,
                y: 4,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -4,
              }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-0 sm:pl-[52px]"
            >
              {previewUrls.map(
                (
                  preview,
                  index
                ) => (
                  <motion.div
                    key={preview}
                    layout
                    className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 group"
                  >
                    <img
                      src={preview}
                      alt={`Preview gambar ${
                        index + 1
                      }`}
                      className="w-full h-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(
                          index
                        )
                      }
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-500 text-white flex items-center justify-center transition-colors shadow-sm"
                      title="Hapus gambar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-lg bg-black/60 text-white text-[9px] font-bold">
                      {index + 1}
                    </div>
                  </motion.div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* POST ACTIONS */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/80">

          {/* LEFT SIDE */}
          <div className="flex items-center gap-2">

            {/* UPLOAD MENU */}
            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setIsUploadMenuOpen(
                    (prev) => !prev
                  )
                }
                disabled={
                  isPosting ||
                  selectedImages.length >=
                    MAX_IMAGES
                }
                className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] sm:text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
              >
                <ImagePlus className="w-3.5 h-3.5" />

                <span>
                  + Upload Gambar
                </span>

                {selectedImages.length >
                  0 && (
                  <span className="text-indigo-500 dark:text-indigo-400 font-bold">
                    {selectedImages.length}/
                    {MAX_IMAGES}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isUploadMenuOpen && (
                  <>
                    {/* BACKDROP */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() =>
                        setIsUploadMenuOpen(
                          false
                        )
                      }
                    />

                    {/* MENU */}
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 5,
                        scale: 0.97,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: 5,
                        scale: 0.97,
                      }}
                      transition={{
                        duration: 0.15,
                      }}
                      className="absolute left-0 bottom-full mb-2 z-40 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-1.5 shadow-xl"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsUploadMenuOpen(
                            false
                          );

                          cameraInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <Camera className="w-4 h-4" />
                        </span>

                        <span>
                          Ambil Gambar
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUploadMenuOpen(
                            false
                          );

                          galleryInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Images className="w-4 h-4" />
                        </span>

                        <span>
                          Pilih dari Galeri
                        </span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* CHARACTER COUNT */}
            <span
              className={`text-[10px] font-mono ${
                content.length >
                MAX_CHARS - 20
                  ? 'text-rose-500 font-bold'
                  : 'text-slate-400 dark:text-zinc-500'
              }`}
            >
              {content.length}/
              {MAX_CHARS}
            </span>
          </div>

          {/* SEND */}
          <button
            type="submit"
            disabled={
              !content.trim() ||
              isPosting
            }
            className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
          >
            {isPosting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}

            <span>
              {isPosting
                ? 'Posting...'
                : 'Kirim'}
            </span>
          </button>
        </div>

        {/* HIDDEN FILE INPUTS */}

        {/* CAMERA */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={
            handleImageSelection
          }
        />

        {/* GALLERY */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={
            handleImageSelection
          }
        />
      </form>

      {/* =====================================================
          EDIT PROFILE MODAL
          ===================================================== */}

      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{
                scale: 0.95,
                opacity: 0,
                y: 10,
              }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
              }}
              exit={{
                scale: 0.95,
                opacity: 0,
                y: 10,
              }}
              className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >

              {/* MODAL HEADER */}
              <div className="flex items-center justify-between">

                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Smile className="w-5 h-5 text-indigo-500" />

                  <span>
                    Edit Profil
                  </span>
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setIsEditModalOpen(
                      false
                    )
                  }
                  className="p-2 rounded-2xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

              </div>

              {/* PROFILE FORM */}
              <form
                onSubmit={
                  handleSaveProfile
                }
                className="space-y-4"
              >

                {/* USERNAME */}
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
                      value={
                        editUsername
                      }
                      onChange={(e) =>
                        setEditUsername(
                          e.target.value
                            .replace(
                              /\s+/g,
                              ''
                            )
                            .toLowerCase()
                        )
                      }
                      placeholder="usernamekamu"
                      maxLength={30}
                      className="w-full pl-7 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5">
                    Username digunakan sebagai identitas publik dan harus unik.
                  </p>
                </div>

                {/* EMOJI */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                    Pilih emoji yang menggambarkan perasaanmu sekarang...
                  </label>

                  <div className="grid grid-cols-9 gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 max-h-48 overflow-y-auto">
                    {EMOJI_OPTIONS.map(
                      (emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() =>
                            setEditEmoji(
                              emoji
                            )
                          }
                          className={`text-xl p-1.5 rounded-xl transition-all ${
                            editEmoji ===
                            emoji
                              ? 'bg-indigo-600 text-white scale-110 shadow-sm'
                              : 'hover:bg-slate-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {emoji}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* MODAL ACTIONS */}
                <div className="flex items-center justify-end gap-2 pt-2">

                  <button
                    type="button"
                    onClick={() =>
                      setIsEditModalOpen(
                        false
                      )
                    }
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={
                      !editUsername.trim()
                    }
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                  >
                    Simpan Profil
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