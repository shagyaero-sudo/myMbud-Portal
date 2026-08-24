import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  Settings2,
  Check,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  ChevronDown,
  X,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface NotebookLmViewProps {
  isOfficer: boolean;
  onBack: () => void;
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
    description: 'Analisis pendapatan nasional, inflasi, kurva IS-LM, pertumbuhan ekonomi, dan kebijakan fiskal-moneter.',
    notebook_url: 'https://notebooklm.google.com/notebook/0042bb0c-47d3-4ab8-a832-e96810af1b29',
    color_theme: 'blue',
  },
  {
    id: 'dasar_manajemen',
    name: 'Dasar-dasar Manajemen',
    code: 'DDM-2026',
    description: 'Konsep fungsi manajemen (POAC), kepemimpinan tim, pengambilan keputusan, dan etika organisasi.',
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
    description: 'Perencanaan jaringan infrastruktur wilayah, transportasi publik, utilitas perkotaan, dan proyek strategis.',
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

export const NotebookLmView: React.FC<NotebookLmViewProps> = ({
  isOfficer,
  onBack,
}) => {
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CourseCardData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Data & Supabase Realtime
  useEffect(() => {
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

    // Realtime Listener
    const channel = supabase
      .channel('notebooklm_courses_page_realtime')
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
  }, [isOfficer]);

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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-5 pb-12"
    >
      {/* HEADER UTAMA HALAMAN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-4 sm:pt-6 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-500/40 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            title="Kembali ke Bank PDF"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Gemini Notebook
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Fitur diskusi materi bersama AI
            </p>
          </div>
        </div>

        {/* Action Button: Kelola Kartu (Khusus Pengurus) */}
        {isOfficer && (
          <button
            type="button"
            onClick={() => setIsEditMode((prev) => !prev)}
            className={`px-4 py-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto shadow-xs active:scale-95 ${
              isEditMode
                ? 'bg-purple-600 text-white border-purple-500 shadow-purple-900/20'
                : 'bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border-white/60 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>{isEditMode ? 'Selesai' : 'Kelola Kartu'}</span>
          </button>
        )}
      </div>

      {/* ACCORDION / COLLAPSIBLE PENJELASAN */}
      <div className="border border-white/60 dark:border-white/10 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-all">
        <button
          type="button"
          onClick={() => setIsAccordionOpen((prev) => !prev)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <span>Apa itu dan bagaimana cara kerjanya?</span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 dark:text-zinc-500 transition-transform duration-300 ${
              isAccordionOpen ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''
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
              className="overflow-hidden border-t border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-950/40 px-5 py-4"
            >
              <div className="text-xs text-slate-600 dark:text-zinc-300 space-y-1.5 leading-relaxed">
                <p>
                  <strong className="text-purple-600 dark:text-purple-300 font-semibold">Gemini Notebook</strong> adalah AI asisten Google yang khusus membaca dan memahami seluruh slide PPT & dokumen PDF materi kuliah kita.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Kamu bisa bertanya konsep yang sulit, minta dibuatkan rangkuman ujian/kisi-kisi, kuis dan latihan soal, hingga mendengarkan podcast rangkuman audio dari PDF materi perkuliahan.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* GRID CONTAINER MATKUL */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-zinc-500">
          <Loader2 className="w-7 h-7 animate-spin text-purple-600 dark:text-purple-400" />
          <span className="text-xs">Menyiapkan daftar ruang belajar...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tombol Tambah Kartu Baru (Hanya Pengurus) */}
          {isEditMode && isOfficer && (
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
              className="w-full py-4 rounded-3xl border-2 border-dashed border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mata Kuliah Baru</span>
            </button>
          )}

          {/* Grid Kartu Mata Kuliah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all duration-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-xl overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${themeClass}`}
                      >
                        {course.code}
                      </span>

                      {isEditMode && isOfficer && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingCard(course)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                            title="Edit Kartu"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(course.id)}
                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                            title="Hapus Kartu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                      {course.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {course.description ||
                        'Diskusi materi kuliah dengan AI yang bersumber dari slide perkuliahan.'}
                    </p>
                  </div>

                  {/* Tombol Aksi Buka */}
                  <div className="mt-5 pt-3.5 border-t border-slate-200/60 dark:border-white/5">
                    {hasLink ? (
                      <a
                        href={course.notebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 text-slate-700 dark:text-zinc-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                      >
                        <span>Buka Notebook</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    ) : (
                      <div className="w-full py-2.5 px-4 rounded-2xl bg-slate-100/50 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-zinc-500 text-center text-xs font-medium">
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

      {/* MODAL FORM EDIT / TAMBAH KARTU (PENGURUS) */}
      <AnimatePresence>
        {editingCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3.5 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Atur Mata Kuliah & Link
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCard} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
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
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
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
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
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
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
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
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
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
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingCard(null)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/20 cursor-pointer disabled:opacity-50 transition-all"
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
  );
};