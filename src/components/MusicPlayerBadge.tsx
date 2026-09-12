// src/components/MusicPlayerBadge.tsx

import React, { useState, useRef } from 'react';
import { Play, Pause, Music } from 'lucide-react';

interface MusicPlayerBadgeProps {
  title: string;
  artist: string;
  coverUrl?: string;
  previewUrl: string;
}

export const MusicPlayerBadge: React.FC<MusicPlayerBadgeProps> = ({
  title,
  artist,
  coverUrl,
  previewUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        const audio = new Audio(previewUrl);
        audio.onended = () => setIsPlaying(false);
        audioRef.current = audio;
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div
      onClick={togglePlay}
      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 dark:bg-zinc-800/90 text-white backdrop-blur-md border border-white/10 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 transition-all max-w-full"
    >
      <div className={`relative w-6 h-6 rounded-full overflow-hidden shrink-0 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-blue-600 flex items-center justify-center">
            <Music className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      <div className="min-w-0 leading-none">
        <p className="text-[11px] font-bold truncate max-w-[140px] sm:max-w-[180px]">
          {title}
        </p>
        <p className="text-[9px] text-zinc-400 truncate max-w-[140px] sm:max-w-[180px] mt-0.5">
          {artist}
        </p>
      </div>

      <button className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 ml-1">
        {isPlaying ? <Pause className="w-2.5 h-2.5 fill-white" /> : <Play className="w-2.5 h-2.5 fill-white ml-0.5" />}
      </button>
    </div>
  );
};