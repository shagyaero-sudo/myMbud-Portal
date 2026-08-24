import React, { useState, useEffect, useRef } from 'react';
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

type ToolMode = 'highlighter' | 'pen' | 'eraser' | 'comment';

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ material, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolMode>('highlighter');
  const [color, setColor] = useState('#EAB308');
  const [isSaving, setIsSaving] = useState(false);

  // Sticky comment pins state
  const [comments, setComments] = useState<PinComment[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const userNrp = localStorage.getItem('mymbud_user_nrp') || 'anonymous';
  const materialId = material?.id || 'default_pdf';

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

  // Load Saved Annotations from Supabase
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
          if (data.draw_data && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const img = new Image();
            img.src = data.draw_data;
            img.onload = () => ctx?.drawImage(img, 0, 0);
          }
          if (data.comments) {
            setComments(data.comments);
          }
        }
      } catch (err) {
        console.warn('Error loading annotations from Supabase:', err);
      }
    };

    loadAnnotations();
  }, [material, materialId, userNrp]);

  // Sync canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !viewportRef.current) return;
    canvas.width = viewportRef.current.clientWidth || 1200;
    canvas.height = viewportRef.current.clientHeight || 1800;
  }, [zoomLevel, isAnnotating]);

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

  // Sync / Upsert to Supabase
  const saveToSupabase = async (updatedComments?: PinComment[], clearDraw = false) => {
    setIsSaving(true);
    try {
      const drawData = clearDraw ? null : canvasRef.current?.toDataURL() || null;
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
      console.error('Failed to save annotation to Supabase:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAnnotating) return;

    if (activeTool === 'comment') {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

      const newComment: PinComment = {
        id: `pin_${Date.now()}`,
        xPercent,
        yPercent,
        text: 'Tulis catatan...',
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

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 22;
    } else if (activeTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.38;
      ctx.lineWidth = 16;
      ctx.lineCap = 'square';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
    }

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isAnnotating || activeTool === 'comment') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveToSupabase();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
          className="fixed inset-0 z-50 overflow-hidden pointer-events-auto touch-none"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full bg-slate-950 dark:bg-black rounded-none flex flex-col shadow-none overflow-hidden relative"
          >
            {/* Header Modal */}
            <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-6 py-3 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 shrink-0">
              
              {/* Sisi Kiri: Menu Dots + Info Matkul */}
              <div className="flex items-center gap-2.5 min-w-0 pr-3">
                
                {/* 3-Dots Menu */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition-all cursor-pointer shadow-xs active:scale-95"
                    aria-label="Menu Aksi"
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
                          <button
                            type="button"
                            onClick={() => {
                              setIsAnnotating((prev) => !prev);
                              setIsMenuOpen(false);
                            }}
                            className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-zinc-200 hover:bg-zinc-800/80 hover:text-white transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isAnnotating ? 'Matikan Mode Coret' : 'Mode Coret-Coret'}</span>
                          </button>

                          <a
                            href={getDirectDriveUrl(material.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-zinc-200 hover:bg-zinc-800/80 hover:text-white transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                            <span>Buka di Google Drive</span>
                          </a>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Text Title */}
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
                    {isSaving && (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                        Menyimpan...
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm sm:text-base font-bold text-zinc-100 mt-0.5 truncate">
                    {material.title}
                  </h3>
                </div>
              </div>

              {/* Sisi Kanan: Close */}
              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
                aria-label="Tutup Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewport Dokumen */}
            <div 
              ref={viewportRef}
              className="flex-1 w-full h-full bg-slate-950 dark:bg-black flex flex-col min-h-0 overflow-hidden relative"
            >
              {/* Zoom Control */}
              <div className="absolute top-[78px] right-2 sm:right-4 z-30 flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.8)] px-2.5 py-1.5 rounded-2xl select-none">
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))}
                  className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
                  aria-label="Perkecil"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                
                <span className="text-xs sm:text-sm font-bold text-zinc-200 px-1.5 min-w-[44px] text-center select-none tabular-nums">
                  {Math.round(zoomLevel * 100)}%
                </span>
                
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5))}
                  className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
                  aria-label="Perbesar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {zoomLevel !== 1 && (
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border-l border-zinc-800 ml-0.5 cursor-pointer"
                    aria-label="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Floating Toolbar Anotasi */}
              {isAnnotating && (
                <div className="absolute top-[78px] left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-2xl backdrop-blur-xl select-none">
                  <button
                    type="button"
                    onClick={() => { setActiveTool('highlighter'); setColor('#EAB308'); }}
                    className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTool === 'highlighter'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                    title="Stabilo Kuning"
                  >
                    <Highlighter className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTool('pen'); setColor('#38BDF8'); }}
                    className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTool === 'pen'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                    title="Pulpen Biru"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTool('comment')}
                    className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTool === 'comment'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                    title="Pin Catatan Komentar"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTool('eraser')}
                    className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTool === 'eraser'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                    title="Penghapus"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Bersihkan Semua Coretan"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Area Frame PDF & Overlay */}
              <div className="flex-1 rounded-none bg-slate-950 dark:bg-black overflow-auto shadow-none flex relative isolate z-10 pt-[60px]">
                <div 
                  className="w-full h-full min-w-full min-h-full transition-transform duration-200 ease-out origin-top-left relative"
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

                  {/* Canvas Drawing Overlay */}
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className={`absolute inset-0 z-20 ${
                      isAnnotating ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
                    }`}
                  />

                  {/* Sticky Comment Pins */}
                  {comments.map((item) => (
                    <div
                      key={item.id}
                      style={{ left: `${item.xPercent}%`, top: `${item.yPercent}%` }}
                      className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCommentId(activeCommentId === item.id ? null : item.id);
                        }}
                        className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/50"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                      </button>

                      {/* Tooltip Popup Catatan */}
                      {activeCommentId === item.id && (
                        <div
                          className="absolute left-8 top-0 w-60 p-3 rounded-2xl bg-zinc-900/95 border border-zinc-700 shadow-2xl backdrop-blur-xl z-40 text-left space-y-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <textarea
                            value={item.text}
                            onChange={(e) => updateCommentText(item.id, e.target.value)}
                            onBlur={saveCommentOnBlur}
                            rows={3}
                            className="w-full bg-zinc-800/80 rounded-xl p-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none border-none"
                            placeholder="Tulis catatan..."
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
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};