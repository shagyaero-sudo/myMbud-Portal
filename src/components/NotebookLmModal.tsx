import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowUpRight,
  Settings2,
  Check,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface NotebookLmModalProps {
  isOpen: boolean;
  isOfficer: boolean;
  onClose: () => void;
}

export interface CourseCardData {
  id: string;
  name: string;
  code: string;
  description: string;
  notebook_url: string;
  color_theme?: string;
}

const DEFAULT_COURSES: CourseCardData[] = [
  {
    id: 'ekonomi_makro',
    name: 'Ekonomi Makro',
    code: 'EM-2026',
    description: 'Bahas konsep makro, inflasi, kurva IS-LM, hingga kebijakan moneter.',
    notebook_url: 'https://notebooklm.google.com/notebook/0042bb0c-47d3-4ab8-a832-e96810af1b29',
    color_theme: 'blue',
  },
  {
    id: 'dasar_manajemen',
    name: 'Dasar-dasar Manajemen',
    code: 'DDM-2026',
    description: 'Diskusi konsep POAC, kepemimpinan, dan manajemen strategis organisasi.',
    notebook_url: '',
    color_theme: 'purple',
  },
  {
    id: 'etika_pembangunan',
    name: 'Etika Pembangunan',
    code: 'EP-2026',
    description: 'Eksplorasi etika moral, filsafat keadilan sosial, dan studi dampak pembangunan.',
    notebook_url: '',
    color_theme: 'emerald',
  },
  {
    id: 'gender_pembangunan',
    name: 'Gender dan Pembangunan',
    code: 'GNP-2026',
    description: 'Analisis isu pengarusutamaan gender, SDGs 5, dan inklusivitas sosial.',
    notebook_url: '',
    color_theme: 'rose',
  },
  {
    id: 'infrastruktur_pembangunan',
    name: 'Infrastruktur Pembangunan',
    code: 'INF-2026',
    description: 'Perencanaan tata wilayah, transportasi umum, dan proyek infrastruktur.',
    notebook_url: '',
    color_theme: 'amber',
  },
  {
    id: 'kebijakan_publik',
    name: 'Kebijakan Publik dan Pem...',
    code: 'KPP-2026',
    description: 'Analisis siklus perumusan kebijakan, advokasi, dan evaluasi dampak.',
    notebook_url: '',
    color_theme: 'sky',
  },
  {
    id: 'komunikasi_pembangunan',
    name: 'Komunikasi Pembangunan',
    code: 'KOM-2026',
    description: 'Strategi kampanye sosial, partisipasi publik, dan dinamika media komunikasi.',
    notebook_url: '',
    color_theme: 'fuchsia',
  },
  {
    id: 'manusia_ruang_hidup',
    name: 'Manusia dan Ruang Hidup',
    code: 'MRH-2026',
    description: 'Kajian interaksi ekologi manusia, tata kelola lingkungan, dan ruang kota.',
    notebook_url: '',
    color_theme: 'lime',
  },
  {
    id: 'statistik_sosial',
    name: 'Statistik Sosial',
    code: 'STA-2026',
    description: 'Praktik analisis data, uji hipotesis, korelasi, dan interpretasi output SPSS.',
    notebook_url: '',
    color_theme: 'indigo',
  },
];

const THEME_STYLES: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  sky: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
  lime: 'bg-lime-500/10 text-lime-400 border-lime-500/30',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
};

export const NotebookLmModal: React.FC<NotebookLmModalProps> = ({
  isOpen,
  isOfficer,
  onClose,
}) => {
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CourseCardData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Data & Supabase Realtime
  useEffect(() => {
    if (!isOpen) return;

    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('notebooklm_courses')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setCourses(data);
        } else {
          setCourses(DEFAULT_COURSES);
          if (isOfficer) {
            await supabase.from('notebooklm_courses').upsert(DEFAULT_COURSES);
          }
        }
      } catch (err) {
        console.warn('Menggunakan data fallback:', err);
        setCourses(DEFAULT_COURSES);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();

    // Setup Realtime Listener
    const channel = supabase
      .channel('notebooklm_courses_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notebooklm_courses' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCourses((prev) => [...prev, payload.new as CourseCardData]);
          } else if (payload.eventType === 'UPDATE') {
            setCourses((prev) =>
              prev.map((c) =>
                c.id === (payload.new as CourseCardData).id ? (payload.new as CourseCardData) : c
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setCourses((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, isOfficer]);

  // Simpan / Update Kartu
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from('notebooklm_courses').upsert({
        ...editingCard,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setEditingCard(null);
    } catch (err) {
      console.error('Gagal menyimpan kartu:', err);
      alert('Gagal menyimpan perubahan ke database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Hapus Kartu
  const handleDeleteCard = async (id: string) => {
    if (!confirm('Hapus mata kuliah ini dari daftar AI Space?')) return;

    try {
      const { error } = await supabase
        .from('notebooklm_courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Gagal menghapus:', err);
      alert('Gagal menghapus data.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
                  Gemini Notebook
                </h2>
                <p className="text-xs text-zinc-400">
                  Fitur diskusi materi bersama AI
                </p>
              </div>

              {/* Action Buttons Header */}
              <div className="flex items-center gap-2 shrink-0">
                {isOfficer && (
                  <button
                    type="button"
                    onClick={() => setIsEditMode((prev) => !prev)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isEditMode
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/30'
                        : 'bg-zinc-900 text-zinc-300 hover:text-white border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>{isEditMode ? 'Selesai' : 'Kelola Kartu'}</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* ACCORDION / COLLAPSIBLE: APA ITU NOTEBOOKLM */}
            <div className="mt-3.5 border border-zinc-800/80 rounded-2xl bg-zinc-900/40 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsAccordionOpen((prev) => !prev)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-semibold text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <span>Apa itu dan bagaimana cara kerjanya?</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${
                    isAccordionOpen ? 'rotate-180 text-purple-400' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isAccordionOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-zinc-800/60 bg-zinc-950/40 px-4 py-3"
                  >
                    <div className="text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                      <p>
                        <strong className="text-purple-300 font-semibold">Gemini Notebook</strong> adalah AI asisten Google yang khusus membaca dan memahami seluruh slide PPT & dokumen PDF materi kuliah kita.
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Kamu bisa bertanya konsep yang sulit, minta dibuatkan rangkuman ujian/kisi-kisi, kuis dan latihan soal, hingga mendengarkan podcast rangkuman audio dari PDF materi perkuliahan.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Content Body: Loading / View / Edit */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="text-xs">Menyiapkan daftar ruang belajar...</span>
              </div>
            ) : (
              <div className="mt-4 max-h-[58vh] overflow-y-auto pr-1">
                {/* Tombol Tambah Kartu Baru (Hanya Pengurus) */}
                {isEditMode && isOfficer && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingCard({
                          id: `course_${Date.now()}`,
                          name: '',
                          code: 'BARU-2026',
                          description: '',
                          notebook_url: '',
                          color_theme: 'blue',
                        })
                      }
                      className="w-full py-3 rounded-2xl border-2 border-dashed border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Mata Kuliah Baru</span>
                    </button>
                  </div>
                )}

                {/* Grid Kartu Matkul */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {courses.map((course) => {
                    const themeClass =
                      THEME_STYLES[course.color_theme || 'blue'] ||
                      THEME_STYLES.blue;
                    const hasLink = Boolean(
                      course.notebook_url && course.notebook_url.trim() !== ''
                    );

                    return (
                      <div
                        key={course.id}
                        className="group relative flex flex-col justify-between p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700 transition-all duration-200 shadow-sm hover:shadow-xl overflow-hidden"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${themeClass}`}
                            >
                              {course.code}
                            </span>

                            {isEditMode && isOfficer && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingCard(course)}
                                  className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                  title="Edit Kartu"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCard(course.id)}
                                  className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                                  title="Hapus Kartu"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors line-clamp-1">
                            {course.name}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {course.description ||
                              'Diskusi materi kuliah dengan AI yang bersumber dari slide perkuliahan.'}
                          </p>
                        </div>

                        {/* Footer Action Button */}
                        <div className="mt-4 pt-3 border-t border-zinc-800/60">
                          {hasLink ? (
                            <a
                              href={course.notebook_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-purple-600/90 text-zinc-200 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer group-hover:border-purple-500/30"
                            >
                              <span>Buka Notebook</span>
                              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </a>
                          ) : (
                            <div className="w-full py-2 px-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-500 text-center text-[11px] font-medium">
                              {isOfficer ? 'Link belum diatur (Klik Kelola)' : 'Segera Hadir'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MODAL EDIT / FORM KARTU (PENGURUS) */}
            <AnimatePresence>
              {editingCard && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-5 shadow-2xl text-left"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                      <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-purple-400" />
                        Atur Mata Kuliah & Link
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingCard(null)}
                        className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveCard} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          Nama Mata Kuliah
                        </label>
                        <input
                          type="text"
                          required
                          value={editingCard.name}
                          onChange={(e) =>
                            setEditingCard({ ...editingCard, name: e.target.value })
                          }
                          placeholder="Misal: Ekonomi Makro"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                            Kode Singkat
                          </label>
                          <input
                            type="text"
                            required
                            value={editingCard.code}
                            onChange={(e) =>
                              setEditingCard({ ...editingCard, code: e.target.value })
                            }
                            placeholder="EM-2026"
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                            Tema Warna
                          </label>
                          <select
                            value={editingCard.color_theme || 'blue'}
                            onChange={(e) =>
                              setEditingCard({
                                ...editingCard,
                                color_theme: e.target.value,
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                          >
                            <option value="blue">Blue</option>
                            <option value="purple">Purple</option>
                            <option value="emerald">Emerald</option>
                            <option value="rose">Rose</option>
                            <option value="amber">Amber</option>
                            <option value="sky">Sky</option>
                            <option value="fuchsia">Fuchsia</option>
                            <option value="lime">Lime</option>
                            <option value="indigo">Indigo</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          Deskripsi Singkat Topik
                        </label>
                        <textarea
                          rows={2}
                          value={editingCard.description}
                          onChange={(e) =>
                            setEditingCard({
                              ...editingCard,
                              description: e.target.value,
                            })
                          }
                          placeholder="Fokus materi yang dipelajari..."
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          Link Share NotebookLM
                        </label>
                        <input
                          type="url"
                          value={editingCard.notebook_url}
                          onChange={(e) =>
                            setEditingCard({
                              ...editingCard,
                              notebook_url: e.target.value,
                            })
                          }
                          placeholder="https://notebooklm.google.com/notebook/..."
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCard(null)}
                          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer disabled:opacity-50"
                        >
                          {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Simpan Perubahan</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};