import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ImagePlus, Music, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveStory } from './lib/storage';
import { uploadImagesToCloudinary } from './lib/cloudinary';
import { MusicSearchModal } from '../../components/MusicSearchModal';
import { MusicPlayerBadge } from '../../components/MusicPlayerBadge';
import { TrackResult } from '../../services/musicService';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // State Musik iTunes
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrackResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!selectedFile || isUploading) return;
    setIsUploading(true);

    try {
      // Upload media ke Cloudinary
      const uploadedUrls = await uploadImagesToCloudinary([selectedFile]);
      if (!uploadedUrls.length) throw new Error('Gagal mengunggah media.');

      await saveStory({
        mediaUrl: uploadedUrls[0],
        mediaType,
        caption: caption.trim() || undefined,
        musicTitle: selectedTrack?.trackName,
        musicArtist: selectedTrack?.artistName,
        musicCover: selectedTrack?.artworkUrl,
        musicPreviewUrl: selectedTrack?.previewUrl,
      });

      // Reset State
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      setSelectedTrack(null);
      onStoryCreated();
      onClose();
    } catch (err) {
      console.error('Gagal membuat story:', err);
      alert('Gagal membuat story. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              {/* HEADER */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-800 text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-white">Buat MbudStory</span>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedFile || isUploading}
                  className="px-4 py-1.5 rounded-full bg-blue-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Posting</span>
                </button>
              </div>

              {/* BODY PREVIEW */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {previewUrl ? (
                  <div className="relative aspect-[9/16] max-h-[380px] w-full mx-auto rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-zinc-800">
                    {mediaType === 'video' ? (
                      <video src={previewUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    )}
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[9/16] max-h-[300px] w-full border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <ImagePlus className="w-8 h-8 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-400">Pilih Foto atau Video</span>
                  </div>
                )}

                {/* MUSIK BADGE PREVIEW */}
                {selectedTrack && (
                  <div className="flex items-center gap-2 bg-zinc-800/60 p-2 rounded-2xl border border-zinc-700">
                    <MusicPlayerBadge
                      title={selectedTrack.trackName}
                      artist={selectedTrack.artistName}
                      coverUrl={selectedTrack.artworkUrl}
                      previewUrl={selectedTrack.previewUrl}
                    />
                    <button onClick={() => setSelectedTrack(null)} className="text-rose-400 ml-auto p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* INPUT CAPTION */}
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tambah pesan singkat..."
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none border border-zinc-700"
                />

                {/* BUTTON PILIH MUSIK */}
                <button
                  type="button"
                  onClick={() => setIsMusicModalOpen(true)}
                  className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-purple-400 flex items-center justify-center gap-2 border border-zinc-700"
                >
                  <Music className="w-4 h-4" />
                  <span>{selectedTrack ? 'Ganti Musik iTunes' : 'Tambah Musik iTunes'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      <MusicSearchModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
        onSelectTrack={(t) => setSelectedTrack(t)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </>
  );
};