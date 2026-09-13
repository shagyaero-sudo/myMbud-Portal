import React, { useState, useEffect } from 'react';
import { Plus, Camera } from 'lucide-react';
import { UserProfile, MbudiaryStory, MbudiaryUser } from './types';
import { getActiveStories, fetchStoriesFromSupabase, getCachedUserByNrp } from './lib/storage';

interface StoryTrayProps {
  currentUser: UserProfile;
  onOpenCreateStory: () => void;
  onSelectStoryGroup: (stories: MbudiaryStory[]) => void;
}

export const StoryTray: React.FC<StoryTrayProps> = ({
  currentUser,
  onOpenCreateStory,
  onSelectStoryGroup,
}) => {
  const [stories, setStories] = useState<MbudiaryStory[]>(() => getActiveStories());

  useEffect(() => {
    fetchStoriesFromSupabase().then(setStories);

    const handleSync = () => setStories(getActiveStories());
    window.addEventListener('mbud_stories_change', handleSync);
    return () => window.removeEventListener('mbud_stories_change', handleSync);
  }, []);

  // Grouping story berdasarkan NRP user
  const storyGroups = stories.reduce<Record<string, MbudiaryStory[]>>((acc, story) => {
    if (!acc[story.authorNrp]) acc[story.authorNrp] = [];
    acc[story.authorNrp].push(story);
    return acc;
  }, {});

  const myStories = storyGroups[currentUser.nrp] || [];
  const otherNrps = Object.keys(storyGroups).filter((nrp) => nrp !== currentUser.nrp);

  return (
    <div className="w-full px-4 py-3 bg-white/40 dark:bg-zinc-950/20 border-b border-slate-200/40 dark:border-white/5 overflow-x-auto custom-scrollbar flex items-center gap-4">
      {/* LINGKARAN STORY SAYA (DENGAN TOMBOL +) */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="relative cursor-pointer group" onClick={myStories.length > 0 ? () => onSelectStoryGroup(myStories) : onOpenCreateStory}>
          <div className={`w-14 h-14 rounded-full p-0.5 transition-all ${myStories.length > 0 ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 animate-pulse' : 'border-2 border-dashed border-slate-300 dark:border-zinc-700'}`}>
            <div className="w-full h-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center border border-white dark:border-zinc-900">
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{currentUser.emoji || '😊'}</span>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenCreateStory();
            }}
            className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-md transition-transform active:scale-90"
            title="Tambah Story"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400 truncate max-w-[60px]">
          Cerita Saya
        </span>
      </div>

      {/* LINGKARAN STORY USERS LAIN */}
      {otherNrps.map((nrp) => {
        const userStories = storyGroups[nrp];
        const author: MbudiaryUser | null = getCachedUserByNrp(nrp);
        const displayName = author?.nickname || author?.username || 'Mbuders';

        return (
          <div
            key={nrp}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            onClick={() => onSelectStoryGroup(userStories)}
          >
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 transition-transform group-hover:scale-105">
              <div className="w-full h-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center border border-white dark:border-zinc-900">
                {author?.photoUrl ? (
                  <img src={author.photoUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">{author?.emoji || '😊'}</span>
                )}
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400 truncate max-w-[60px]">
              {displayName}
            </span>
          </div>
        );
      })}
    </div>
  );
};