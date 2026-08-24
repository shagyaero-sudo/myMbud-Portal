import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MoreVertical,
  ExternalLink,
  Pencil,
  Highlighter,
  Eraser,
  MessageSquarePlus,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { MaterialFile } from '../types';

interface PdfViewerModalProps {
  material: MaterialFile | null;
  onClose: () => void;
}

interface PinComment {
  id: string;
  xPercent: number;
  yPercent: number;
  text: string;
}

type ToolMode = 'highlighter' | 'pen' | 'comment' | 'eraser';

const COLOR_PALETTE = [
  { id: 'yellow', color: '#EAB308' },
  { id: 'green', color: '#22C55E' },
  { id: 'blue', color: '#38BDF8' },
  { id: 'rose', color: '#F43F5E' },
  { id: 'purple', color: '#A855F7' },
];

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ material, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolMode>('pen');
  const [selectedColor, setSelectedColor] = useState('#38BDF8');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sticky comment pins state
  const [comments, setComments] = useState<PinComment[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastDrawDataRef = useRef<string | null>(null);

  const userNrp = localStorage.getItem('mymbud_user_nrp') || 'anonymous';
  const materialId = material?.id || 'default_pdf';

  // Redraw canvas dari data gambar
  const redrawCanvas = useCallback((dataUrl: string | null) => {
    if (!dataUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
  }, []);

  // Load Annotations & Comments dari Supabase
  useEffect(() => {
    if (!material) return;

    const loadAnnotations = async () => {
      try {
        const { data, error } = await supabase
          .from('material_annotations')
          .select('draw_data, comments')
          .eq('user_nrp', userNrp)
          .eq('material_id', materialId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          if (data.draw_data) {
            lastDrawDataRef.current = data.draw_data;
            redrawCanvas(data.draw_data);
          }
          if (data.comments) {
            setComments(data.comments);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat data anotasi:', err);
      }
    };

    loadAnnotations();
  }, [material, materialId, userNrp, redrawCanvas]);

  // Sinkronkan resolusi internal canvas dengan display CSS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;

      if (lastDrawDataRef.current) {
        redrawCanvas(lastDrawDataRef.current);
      }
    }
  }, [isAnnotating, zoomLevel, redrawCanvas]);

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

  // Simpan anotasi & komentar ke Supabase
  const saveToSupabase = async (updatedComments?: PinComment[], clearDraw = false) => {
    setIsSaving(true);
    try {
      const drawData = clearDraw ? null : canvasRef.current?.toDataURL() || null;
      if (drawData) {
        lastDrawDataRef.current = drawData;
      } else if (clearDraw) {
        lastDrawDataRef.current = null;
      }

      const currentComments = updatedComments !== undefined ? updatedComments : comments;

      await supabase.from('material_annotations').upsert(
        {
          user_nrp: userNrp,
          material_id: materialId,
          draw_data: drawData,
          comments: currentComments,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_nrp,material_id' }
      );
    } catch (err) {
      console.error('Error saat menyimpan ke Supabase:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Coordinates Helper
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, xPercent: 0, yPercent: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x,
      y,
      xPercent: (x / rect.width) * 100,
      yPercent: (y / rect.height) * 100,
    };
  };

  // Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAnnotating) return;

    // Mode Tambah Pin Komentar
    if (activeTool === 'comment') {
      const { xPercent, yPercent } = getCoordinates(e);
      const newComment: PinComment = {
        id: `pin_${Date.now()}`,
        xPercent,
        yPercent,
        text: '',
      };

      const updated = [...comments, newComment];
      setComments(updated);
      setActiveCommentId(newComment.id);
      saveToSupabase(updated);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (activeTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 20;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'bevel';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !isAnnotating || activeTool === 'comment') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    saveToSupabase();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastDrawDataRef.current = null;
    saveToSupabase(undefined, true);
  };

  const updateCommentText = (id: string, text: string) => {
    const updated = comments.map((c) => (c.id === id ? { ...c, text } : c));
    setComments(updated);
  };

  const saveCommentOnBlur = () => {
    saveToSupabase(comments);
  };

  const deleteComment = (id: string) => {
    const updated = comments.filter((c) => c.id !== id);
    setComments(updated);
    if (activeCommentId === id) setActiveCommentId(null);
    saveToSupabase(updated);
  };

  return (
    <AnimatePresence>
      {material && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-hidden bg-slate-950 dark:bg-black flex flex-col select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 shrink-0 z-40">
            <div className="flex items-center gap-2.5 min-w-0 pr-3">
              
              {/* 3-Dots Action Menu */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-all cursor-pointer"
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
                        className="absolute left-0 top-11 z-50 w-52 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 backdrop-blur-xl"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setIsAnnotating((prev) => !prev);
                            setIsMenuOpen(false);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isAnnotating ? 'Tutup Mode Coret' : 'Mode Coret-Coret'}</span>
                        </button>

                        <a
                          href={getDirectDriveUrl(material.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          <span>Buka di Google Drive</span>
                        </a>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Title & Status */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-blue-400 shrink-0 border border-zinc-700/60">
                    {material.session}
                  </span>
                  <span className="text-xs font-medium text-zinc-400 truncate">
                    {material.courseName}
                  </span>
                  {isSaving && (
                    <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                      Menyimpan...
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mt-0.5 truncate">
                  {material.title}
                </h3>
              </div>
            </div>

            {/* Exit Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Floating Toolbar Mode Coret */}
          {isAnnotating && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-950/95 border border-zinc-700 shadow-2xl backdrop-blur-xl">
              <button
                type="button"
                onClick={() => { setActiveTool('pen'); setShowColorPicker(false); }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  activeTool === 'pen'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
                title="Pulpen"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => { setActiveTool('highlighter'); setShowColorPicker(false); }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  activeTool === 'highlighter'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
                title="Stabilo"
              >
                <Highlighter className="w-4 h-4" />
              </button>

              {/* Color Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker((prev) => !prev)}
                  style={{ backgroundColor: selectedColor }}
                  className="w-5 h-5 rounded-full border border-white/60 mx-1 cursor-pointer hover:scale-110 transition-transform"
                  title="Ganti Warna"
                />
                {showColorPicker && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50">
                    {COLOR_PALETTE.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedColor(item.color);
                          setShowColorPicker(false);
                        }}
                        style={{ backgroundColor: item.color }}
                        className="w-5 h-5 rounded-full border border-white/40 cursor-pointer flex items-center justify-center"
                      >
                        {selectedColor === item.color && (
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tool Pin Komentar */}
              <button
                type="button"
                onClick={() => { setActiveTool('comment'); setShowColorPicker(false); }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  activeTool === 'comment'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
                title="Pin Komentar Catatan"
              >
                <MessageSquarePlus className="w-4 h-4" />
              </button>

              {/* Penghapus */}
              <button
                type="button"
                onClick={() => { setActiveTool('eraser'); setShowColorPicker(false); }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  activeTool === 'eraser'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
                title="Penghapus"
              >
                <Eraser className="w-4 h-4" />
              </button>

              {/* Hapus Semua */}
              <button
                type="button"
                onClick={clearCanvas}
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Hapus Semua Coretan"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

              {/* Shortcut Tombol Selesai */}
              <button
                type="button"
                onClick={() => setIsAnnotating(false)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Selesai
              </button>
            </div>
          )}

          {/* Floating Zoom Control */}
          <div className="fixed top-16 right-3 z-40 flex items-center gap-1 bg-zinc-950/90 border border-zinc-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))}
              className="p-1.5 rounded-xl text-zinc-300 hover:bg-zinc-800 cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-zinc-200 px-1 select-none">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5))}
              className="p-1.5 rounded-xl text-zinc-300 hover:bg-zinc-800 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoomLevel !== 1 && (
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 rounded-xl text-zinc-400 hover:bg-zinc-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Body Preview PDF & Overlay Layer */}
          <div className="flex-1 w-full h-full relative overflow-hidden bg-white">
            <iframe
              src={getEmbedUrl(material.fileUrl)}
              className="w-full h-full border-0 absolute inset-0 z-0"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
              }}
              allow="autoplay"
            />

            {/* Canvas Overlay */}
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: 'none' }}
              className={`absolute inset-0 z-20 w-full h-full ${
                isAnnotating ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
              }`}
            />

            {/* Sticky Comment Pins */}
            {comments.map((item) => (
              <div
                key={item.id}
                style={{ left: `${item.xPercent}%`, top: `${item.yPercent}%` }}
                className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCommentId(activeCommentId === item.id ? null : item.id);
                  }}
                  className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/60"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                </button>

                {/* Pop-up Box Catatan */}
                {activeCommentId === item.id && (
                  <div
                    className="absolute left-8 top-0 w-60 p-3 rounded-2xl bg-zinc-900/95 border border-zinc-700 shadow-2xl backdrop-blur-xl z-40 text-left space-y-2 select-text"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <textarea
                      value={item.text}
                      onChange={(e) => updateCommentText(item.id, e.target.value)}
                      onBlur={saveCommentOnBlur}
                      rows={3}
                      autoFocus
                      className="w-full bg-zinc-800/90 rounded-xl p-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none border-none"
                      placeholder="Tulis catatan di sini..."
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-zinc-400">Tersinkron di Cloud</span>
                      <button
                        type="button"
                        onClick={() => deleteComment(item.id)}
                        className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};