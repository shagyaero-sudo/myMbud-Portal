import React, {
  useRef,
  useState,
} from 'react';

import { UserProfile } from './types';

import { savePost } from './lib/storage';

import { uploadImagesToCloudinary } from './lib/cloudinary';

import {
  Send,
  X,
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
     RENDER
     ========================================================= */

  return (
    <div className="relative bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-4 pb-2 sm:p-5 sm:pb-3 shadow-sm space-y-3">
      
      {/* CHARACTER COUNT */}
      <span
        className={`absolute top-4 right-4 sm:top-5 sm:right-5 text-[10px] font-mono ${
          content.length >
          MAX_CHARS - 20
            ? 'text-rose-500 font-bold'
            : 'text-slate-400 dark:text-zinc-500'
        }`}
      >
        {content.length}/
        {MAX_CHARS}
      </span>

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

          {/* AVATAR / PHOTO / EMOJI USER (TANPA PENSIL) */}
          <div
            onClick={() =>
              onSelectAuthor?.(
                userProfile.nrp
              )
            }
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all shrink-0 active:scale-95 cursor-pointer flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-zinc-700/60"
            title="Lihat Profil"
          >
            {userProfile.photoUrl ? (
              <img
                src={userProfile.photoUrl}
                alt="Foto Profil"
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <span className="text-2xl leading-none">
                {userProfile.emoji || '😊'}
              </span>
            )}
          </div>

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
                 Upload Gambar
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
    </div>
  );
};