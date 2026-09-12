// src/components/MusicSearchModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music, Play, Pause, Check, X, Loader2 } from 'lucide-react';
import { searchTracks, TrackResult } from '../services/musicService';

interface MusicSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: TrackResult) => void;
}

export const MusicSearchModal: React.FC<MusicSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTrack,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrackResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Debounce search input
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const tracks = await searchTracks(query);
      setResults(tracks);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle Play/Pause Audio Preview
  const handleTogglePlayPreview = (e: React.MouseEvent, track: TrackResult) => {
    e.stopPropagation();

    if (playingTrackId === track.trackId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(track.previewUrl);
      newAudio.play();
      newAudio.onended = () => setPlayingTrackId(null);
      audioRef.current = newAudio;
      setPlayingTrackId(track.trackId);
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingTrackId(null);
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* HEADER */}
        <div className="p-4 border-b border-slate-200/60 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100 font-bold text-sm">
            <Music className="w-4 h-4 text-blue-500" />
            <span>Pilih Musik untuk Postingan</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* INPUT PENCARIAN */}
        <div className="p-4 border-b border-slate-200/40 dark:border-zinc-800/60">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari lagu, penyanyi (misal: Bernadya, Hindia)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
            )}
          </div>
        </div>

        {/* LIST HASIL PENCARIAN */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar min-h-[250px]">
          {!query.trim() ? (
            <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs space-y-2">
              <Music className="w-8 h-8 mx-auto opacity-40" />
              <p>Ketik nama penyanyi atau judul lagu favoritmu!</p>
            </div>
          ) : results.length === 0 && !isLoading ? (
            <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs">
              Lagu tidak ditemukan. Coba kata kunci lain.
            </div>
          ) : (
            results.map((track) => {
              const isPlaying = playingTrackId === track.trackId;

              return (
                <div
                  key={track.trackId}
                  onClick={() => {
                    if (audioRef.current) audioRef.current.pause();
                    onSelectTrack(track);
                    handleClose();
                  }}
                  className="p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200/50 dark:border-zinc-700/50 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                      <img
                        src={track.artworkUrl}
                        alt={track.trackName}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleTogglePlayPreview(e, track)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-90 group-hover:opacity-100 transition-opacity"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                      </button>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-blue-500 transition-colors">
                        {track.trackName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                        {track.artistName}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold shadow-xs hover:bg-blue-500 transition-colors shrink-0"
                  >
                    Pilih
                  </button>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};