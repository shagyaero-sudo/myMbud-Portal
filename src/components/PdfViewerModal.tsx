import React, { useState } from 'react';
import { X, Download, FileText, Share2, Check } from 'lucide-react';
import { MaterialFile } from '../types';

interface PdfViewerModalProps {
  material: MaterialFile | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ material, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!material) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: material.title,
        text: `Materi Perkuliahan Kelas A: ${material.title}`,
        url: material.fileUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(material.fileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
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

        {/* Modal Body: Maximized PDF Viewer Container */}
        <div className="flex-1 p-3 sm:p-5 bg-slate-50/50 dark:bg-zinc-950/50 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 rounded-2xl bg-slate-900 dark:bg-black border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-inner flex flex-col relative">
            <iframe
              src={material.fileUrl}
              title={material.title}
              className="w-full h-full border-0 flex-1"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-3.5 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Tautan Disalin</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                <span>Bagikan</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2.5">
            {/* Tombol Tutup dihapus dari sini */}
            <a
              href={material.fileUrl}
              download={material.title}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};