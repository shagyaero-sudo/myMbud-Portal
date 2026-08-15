import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
          className="fixed inset-0 z-50 overflow-hidden pointer-events-auto touch-none"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full bg-slate-950 dark:bg-black rounded-none flex flex-col shadow-none overflow-hidden"
          >
            {/* Header Modal Imersif (Tanpa Logo Document) */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 shrink-0">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2 flex-wrap">
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

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shrink-0 cursor-pointer"
                title="Tutup Preview"
                aria-label="Tutup Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Container Iframe PDF */}
            <div className="flex-1 w-full h-full bg-slate-950 dark:bg-black flex flex-col min-h-0 overflow-hidden relative">
              
              {/* Floating Zoom Control - Diposisikan Presisi Menutupi Tombol Pop-Out Google Drive */}
              <div className="absolute top-[68px] right-2 sm:right-3 z-30 flex items-center gap-1 bg-zinc-950/95 backdrop-blur-md p-1 rounded-xl shadow-2xl border border-zinc-800">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                
                <span className="text-xs font-bold text-zinc-200 px-1 min-w-[40px] text-center select-none tabular-nums">
                  {Math.round(zoomLevel * 100)}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {zoomLevel !== 1 && (
                  <button
                    onClick={handleResetZoom}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border-l border-zinc-800 ml-0.5 cursor-pointer"
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