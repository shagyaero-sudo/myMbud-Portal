import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MbudiaryStory, MbudiaryUser } from './types';
import { getCachedUserByNrp } from './lib/storage';
import { MusicPlayerBadge } from '../../components/MusicPlayerBadge';

interface StoryViewerModalProps {
  stories: MbudiaryStory[];
  isOpen: boolean;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!isOpen || !currentStory) return;
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onClose();
      }
    }, 7000); // Autoplay 7 detik per story

    return () => clearTimeout(timer);
  }, [currentIndex, isOpen, stories, currentStory, onClose]);

  if (!isOpen || !currentStory) return null;

  const author: MbudiaryUser | null = getCachedUserByNrp(currentStory.authorNrp);

  return (
    <>
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999999] bg-black/90 flex items-center justify-center">
          <div className="relative w-full max-w-sm h-full max-h-[90vh] bg-zinc-950 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl border border-zinc-800">
            {/* PROGRESS BARS */}
            <div className="absolute top-3 inset-x-3 z-30 flex gap-1">
              {stories.map((s, idx) => (
                <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-white transition-all duration-300 ${
                      idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full animate-pulse' : 'w-0'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* HEADER AUTHOR */}
            <div className="absolute top-7 inset-x-3 z-30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-white/20">
                  {author?.photoUrl ? (
                    <img src={author.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">{author?.emoji || '😊'}</span>
                  )}
                </div>
                <span className="text-xs font-bold text-white shadow-sm">{author?.nickname || 'Mbuders'}</span>
              </div>
              <button onClick={onClose} className="p-1 rounded-full bg-black/40 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MEDIA DISPLAY */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black">
              {currentStory.mediaType === 'video' ? (
                <video src={currentStory.mediaUrl} autoPlay loop muted className="w-full h-full object-contain" />
              ) : (
                <img src={currentStory.mediaUrl} alt="Story" className="w-full h-full object-contain" />
              )}
            </div>

            {/* FOOTER (CAPTION & MUSIK ITUNES) */}
            <div className="absolute bottom-4 inset-x-3 z-30 space-y-2">
              {currentStory.musicPreviewUrl && currentStory.musicTitle && currentStory.musicArtist && (
                <div className="flex justify-center">
                  <MusicPlayerBadge
                    title={currentStory.musicTitle}
                    artist={currentStory.musicArtist}
                    coverUrl={currentStory.musicCover}
                    previewUrl={currentStory.musicPreviewUrl}
                  />
                </div>
              )}
              {currentStory.caption && (
                <p className="text-center text-xs text-white font-medium bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl">
                  {currentStory.caption}
                </p>
              )}
            </div>

            {/* TOMBOL NAVIGASI KIRI KANAN */}
            {currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-black/40 text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {currentIndex < stories.length - 1 && (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-black/40 text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};