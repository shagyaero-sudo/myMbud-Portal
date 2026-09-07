import React from 'react';

export const PostSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 animate-pulse shadow-xs transform-gpu">
      {/* Header Profile Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 shrink-0" />
          <div className="space-y-1.5 min-w-0">
            <div className="w-32 h-3.5 rounded-md bg-slate-200 dark:bg-zinc-800" />
            <div className="w-20 h-2.5 rounded-md bg-slate-200/70 dark:bg-zinc-800/60" />
          </div>
        </div>
        <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-zinc-800 shrink-0" />
      </div>

      {/* Teks Konten Skeleton */}
      <div className="space-y-2 pt-1">
        <div className="w-full h-3.5 rounded-md bg-slate-200 dark:bg-zinc-800" />
        <div className="w-11/12 h-3.5 rounded-md bg-slate-200 dark:bg-zinc-800" />
        <div className="w-3/4 h-3.5 rounded-md bg-slate-200/70 dark:bg-zinc-800/60" />
      </div>

      {/* Box Gambar Skeleton */}
      <div className="w-full h-52 sm:h-64 rounded-2xl bg-slate-200 dark:bg-zinc-800" />

      {/* Action Bar Skeleton */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/60">
        <div className="w-16 h-4 rounded-md bg-slate-200 dark:bg-zinc-800" />
        <div className="w-16 h-4 rounded-md bg-slate-200 dark:bg-zinc-800" />
        <div className="w-16 h-4 rounded-md bg-slate-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
};