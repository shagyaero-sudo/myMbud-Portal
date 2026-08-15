import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { MaterialFile } from '../types';

interface PdfViewerModalProps {
  material: MaterialFile | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ material, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(1);

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

  // Listen to pomodoro tick from Header.tsx
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
          className="fixed inset-0 z-50 overflow-hidden pointer-events-auto touch-none"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full bg-slate-950 dark:bg-black rounded-none flex flex-col shadow-none overflow-hidden"
          >
            {/* Header Modal Imersif */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 shrink-0">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* COUNTDOWN POMODORO DI SEBELAH KIRI BADGE */}
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

                  {/* Badge & Info Dokumen */}
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

              {/* Tombol Exit / Tutup Preview: Lebih Mencolok & Berwarna Merah */}
              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
                title="Tutup Preview"
                aria-label="Tutup Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Container Iframe PDF */}
            <div className="flex-1 w-full h-full bg-slate-950 dark:bg-black flex flex-col min-h-0 overflow-hidden relative">
              
              {/* Floating Zoom Control Menutupi Tombol Pop-Out */}
              <div className="absolute top-[78px] right-2 sm:right-3 z-30 flex items-center gap-1.5 bg-zinc-950 border border-zinc-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.8)] px-2.5 py-1.5 rounded-2xl">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>
                
                <span className="text-xs sm:text-sm font-bold text-zinc-200 px-1.5 min-w-[46px] text-center select-none tabular-nums">
                  {Math.round(zoomLevel * 100)}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>

                {zoomLevel !== 1 && (
                  <button
                    onClick={handleResetZoom}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border-l border-zinc-800 ml-0.5 cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Viewport PDF Fullscreen */}
              <div className="flex-1 rounded-none bg-slate-950 dark:bg-black overflow-auto shadow-none flex relative isolate z-10 pt-[60px]">
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
                    title={material.title}
                    className="w-full h-full border-0 bg-white"
                    allow="autoplay"
                  />
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};