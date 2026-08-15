import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { MaterialFile } from '../types';

interface PdfViewerModalProps {
  material: MaterialFile | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ material, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(1); // Default scale 100%

  const getEmbedUrl = (url: string) => {
    if (url.includes('drive.google.com') && url.includes('/view')) {
      return url.replace('/view', '/preview');
    }
    return url;
  };

  // Fungsi Kontrol Zoom
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5)); // Maksimal 250%
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75)); // Minimal 75%
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <AnimatePresence>
      {material && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // FIXED: We change this from 'flex items-center justify-center p-X' to 'inset-0' to make it fullscreen
          // and allow it to cover the entire screen.
          className="fixed inset-0 z-50 overflow-hidden pointer-events-auto touch-none"
        >
          {/* We remove the rounded corners entirely to make it feel like a "Fullscreen Mode" */}
          <motion.div 
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            className="w-full h-full bg-slate-900 dark:bg-black rounded-none flex flex-col shadow-none overflow-hidden"
          >
            {/* 
              Immersive Header Modal: 
              Instead of a surface-colored block (bg-white/dark), we make this a 
              frosted glass overlay sitting *on top* of the reader area.
            */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 sm:px-8 py-3 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/60 shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {/* Icons are restyled to blend with the dark immersive header */}
                <div className="p-2.5 rounded-xl bg-zinc-800/70 text-blue-400 shrink-0 border border-zinc-700/50">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-blue-400 shrink-0 border border-zinc-700/50">
                      {material.session}
                    </span>
                    <span className="text-xs font-medium text-zinc-400 truncate">{material.courseName}</span>
                  </div>
                  {/* Title text is now white/zinc-100 by default in this mode */}
                  <h3 className="text-base sm:text-lg font-bold text-zinc-100 mt-0.5 truncate">{material.title}</h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800/80 transition-all shrink-0 cursor-pointer"
                title="Tutup Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Immersive Iframe PDF Container */}
            <div className="flex-1 w-full h-full bg-slate-900 dark:bg-black flex flex-col min-h-0 overflow-hidden relative">
              
              {/* Floating Zoom Control di Pojok Kanan Atas (MD breakpoint is sufficient) */}
              <div className="absolute top-24 right-6 z-20 flex md:hidden items-center gap-1 bg-zinc-950/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-zinc-800/70">
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-all active:scale-95"
                  title="Perkecil"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-zinc-200 px-1.5 min-w-[42px] text-center select-none tabular-nums">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-all active:scale-95"
                  title="Perbesar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {zoomLevel !== 1 && (
                  <button
                    onClick={handleResetZoom}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border-l border-zinc-700 ml-0.5"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Area Viewport PDF (Internal borders/padding removed for expansion) */}
              <div className="flex-1 rounded-none bg-slate-900 dark:bg-black overflow-auto shadow-none flex relative isolate z-10 pt-[75px]">
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