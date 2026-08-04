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
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden"
        >
          <motion.div 
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                      {material.session}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate">{material.courseName}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-zinc-100 mt-0.5 truncate">{material.title}</h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shrink-0"
                title="Tutup Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Container Iframe PDF (Tanpa Footer di Bawah) */}
            <div className="flex-1 p-3 sm:p-5 bg-slate-50/50 dark:bg-zinc-950/50 flex flex-col min-h-0 overflow-hidden relative">
              
              {/* Floating Zoom Control di Pojok Kanan Atas (Menutupi/Menyamarkan Pop-Out) */}
              {/* Menggunakan 'md:hidden' agar otomatis tersembunyi jika dibuka di PC/Laptop */}
              <div className="absolute top-6 right-6 z-20 flex md:hidden items-center gap-1 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-zinc-700/80">
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95"
                  title="Perkecil"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 px-1.5 min-w-[42px] text-center select-none">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95"
                  title="Perbesar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {zoomLevel !== 1 && (
                  <button
                    onClick={handleResetZoom}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all border-l border-slate-200 dark:border-zinc-700 ml-0.5"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Area Viewport PDF */}
              <div className="flex-1 rounded-2xl bg-slate-900 dark:bg-black border border-slate-200/80 dark:border-zinc-800 overflow-auto shadow-inner flex relative">
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