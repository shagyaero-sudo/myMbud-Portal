import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { MaterialFile } from '../types';

interface PdfViewerModalProps {
  material: MaterialFile | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ material, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Real-time Pomodoro Sync State
  const [pomoState, setPomoState] = useState<{
    timeLeft: number;
    isRunning: boolean;
    pomoMode: 'focus' | 'break';
  }>({
    timeLeft: 0,
    isRunning: false,
    pomoMode: 'focus',
  });

  // Listen to pomodoro tick from Header
  useEffect(() => {
    const handlePomoSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setPomoState(customEvent.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mymbud_pomodoro_sync', handlePomoSync);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mymbud_pomodoro_sync', handlePomoSync);
      }
    };
  }, []);

  const formatPomoTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('drive.google.com') && url.includes('/view')) {
      return url.replace('/view', '/preview');
    }
    return url;
  };

  const getDirectDriveUrl = (url: string) => {
    if (url.includes('drive.google.com') && url.includes('/preview')) {
      return url.replace('/preview', '/view');
    }
    return url;
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <AnimatePresence>
      {material && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-hidden pointer-events-auto touch-none select-none bg-slate-950 dark:bg-black flex flex-col"
        >
          {/* Header Modal */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 shrink-0 z-40">
            
            {/* Sisi Kiri: Menu 3-Dots + Info Matkul */}
            <div className="flex items-center gap-2.5 min-w-0 pr-3">
              
              {/* 3-Dots Action Sheet */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition-all cursor-pointer shadow-xs active:scale-95"
                  aria-label="Menu Opsi Dokumen"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute left-0 top-11 z-50 w-52 rounded-2xl bg-zinc-900/95 border border-zinc-800 shadow-2xl p-1.5 backdrop-blur-xl text-left select-none"
                      >
                        {/* Opsi: Buka di Google Drive */}
                        <a
                          href={getDirectDriveUrl(material.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-zinc-200 hover:bg-zinc-800/80 hover:text-white transition-colors cursor-pointer group"
                        >
                          <ExternalLink className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                          <div className="flex flex-col">
                            <span>Buka di Google Drive</span>
                            <span className="text-[10px] text-zinc-400 font-normal">Download File Asli</span>
                          </div>
                        </a>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Info Dokumen & Pomodoro */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {pomoState.isRunning && (
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold border shadow-xs transition-all ${
                        pomoState.pomoMode === 'focus'
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      }`}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            pomoState.pomoMode === 'focus' ? 'bg-rose-400' : 'bg-emerald-400'
                          }`}
                        />
                        <span
                          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                            pomoState.pomoMode === 'focus' ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                        />
                      </span>
                      <span>{formatPomoTime(pomoState.timeLeft)}</span>
                    </div>
                  )}

                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-blue-400 shrink-0 border border-zinc-700/60">
                    {material.session}
                  </span>
                  <span className="text-xs font-medium text-zinc-400 truncate">
                    {material.courseName}
                  </span>
                </div>
                
                <h3 className="text-sm sm:text-base font-bold text-zinc-100 mt-0.5 truncate">
                  {material.title}
                </h3>
              </div>
            </div>

            {/* Tombol Tutup Preview */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
              aria-label="Tutup Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Container Viewport Dokumen */}
          <div className="flex-1 w-full h-full bg-slate-950 dark:bg-black flex flex-col min-h-0 overflow-hidden relative">
            
            {/* Floating Zoom Control */}
            <div className="absolute top-4 right-3 sm:right-6 z-30 flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.8)] px-2.5 py-1.5 rounded-2xl select-none">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
                aria-label="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <span className="text-xs sm:text-sm font-bold text-zinc-200 px-1.5 min-w-[44px] text-center select-none tabular-nums">
                {Math.round(zoomLevel * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
                aria-label="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {zoomLevel !== 1 && (
                <button
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border-l border-zinc-800 ml-0.5 cursor-pointer"
                  aria-label="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Viewport Dokumen */}
            <div className="flex-1 rounded-none bg-slate-950 dark:bg-black overflow-auto shadow-none flex relative isolate z-10">
              <div 
                className="w-full h-full min-w-full min-h-full transition-transform duration-200 ease-out origin-top-left"
                style={{
                  transform: `scale(${zoomLevel})`,
                  width: `${100 / zoomLevel}%`,
                  height: `${100 / zoomLevel}%`,
                }}
              >
                <iframe
                  src={getEmbedUrl(material.fileUrl)}
                  className="w-full h-full border-0 bg-white"
                  allow="autoplay"
                />
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};