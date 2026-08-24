import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  ExternalLink,
  BookOpen,
  ArrowUpRight,
  Settings2,
  Check,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface NotebookLmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CourseItem {
  id: string;
  name: string;
  code: string;
  color: string;
  defaultUrl: string;
  description: string;
}

const COURSES_DATA: CourseItem[] = [
  {
    id: 'ekonomi_makro',
    name: 'Ekonomi Makro',
    code: 'EM-2026',
    color: 'from-blue-600/20 to-cyan-600/10 border-blue-500/30 text-blue-400',
    defaultUrl: 'https://notebooklm.google.com/notebook/0042bb0c-47d3-4ab8-a832-e96810af1b29',
    description: '16 Pertemuan Materi Teori Makro, Kurva IS-LM, dan Kebijakan Fiskal-Moneter.',
  },
  {
    id: 'dasar_manajemen',
    name: 'Dasar-dasar Manajemen',
    code: 'DDM-2026',
    color: 'from-purple-600/20 to-pink-600/10 border-purple-500/30 text-purple-400',
    defaultUrl: '',
    description: 'Konsep POAC, Kepemimpinan Organisasi, dan Manajemen Strategis.',
  },
  {
    id: 'etika_pembangunan',
    name: 'Etika Pembangunan',
    code: 'EP-2026',
    color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30 text-emerald-400',
    defaultUrl: '',
    description: 'Filsafat Etika Moral, Keadilan Sosial, dan Dampak Pembangunan.',
  },
  {
    id: 'gender_pembangunan',
    name: 'Gender dan Pembangunan',
    code: 'GNP-2026',
    color: 'from-rose-600/20 to-orange-600/10 border-rose-500/30 text-rose-400',
    defaultUrl: '',
    description: 'Pengarusutamaan Gender, SDGs 5, dan Inklusivitas Kebijakan.',
  },
  {
    id: 'infrastruktur_pembangunan',
    name: 'Infrastruktur Pembangunan',
    code: 'INF-2026',
    color: 'from-amber-600/20 to-yellow-600/10 border-amber-500/30 text-amber-400',
    defaultUrl: '',
    description: 'Perencanaan Infrastruktur Wilayah, Transportasi Publik, dan Energi.',
  },
  {
    id: 'kebijakan_publik',
    name: 'Kebijakan Publik dan Pem...',
    code: 'KPP-2026',
    color: 'from-sky-600/20 to-indigo-600/10 border-sky-500/30 text-sky-400',
    defaultUrl: '',
    description: 'Siklus Kebijakan, Evaluasi Dampak, dan Administrasi Publik.',
  },
  {
    id: 'komunikasi_pembangunan',
    name: 'Komunikasi Pembangunan',
    code: 'KOM-2026',
    color: 'from-fuchsia-600/20 to-violet-600/10 border-fuchsia-500/30 text-fuchsia-400',
    defaultUrl: '',
    description: 'Strategi Kampanye Publik, Partisipasi Komunitas, dan Media.',
  },
  {
    id: 'manusia_ruang_hidup',
    name: 'Manusia dan Ruang Hidup',
    code: 'MRH-2026',
    color: 'from-lime-600/20 to-emerald-600/10 border-lime-500/30 text-lime-400',
    defaultUrl: '',
    description: 'Ekologi Manusia, Tata Ruang Spasial, dan Kelestarian Lingkungan.',
  },
  {
    id: 'statistik_sosial',
    name: 'Statistik Sosial',
    code: 'STA-2026',
    color: 'from-indigo-600/20 to-blue-600/10 border-indigo-500/30 text-indigo-400',
    defaultUrl: '',
    description: 'Uji Hipotesis, Regresi Linear, SPSS, dan Interpretasi Data Sosial.',
  },
];

export const NotebookLmModal: React.FC<NotebookLmModalProps> = ({ isOpen, onClose }) => {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Ambil Tautan dari Supabase saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    const fetchLinks = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('course_notebook_links')
          .select('course_id, notebook_url');

        if (error) throw error;

        const linkMap: Record<string, string> = {};
        // Set default dulu
        COURSES_DATA.forEach((c) => {
          linkMap[c.id] = c.defaultUrl;
        });

        // Timpa dengan data dari Supabase jika sudah ada
        if (data && data.length > 0) {
          data.forEach((row) => {
            if (row.notebook_url) {
              linkMap[row.course_id] = row.notebook_url;
            }
          });
        }

        setLinks(linkMap);
      } catch (err) {
        console.warn('Gagal memuat link dari Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, [isOpen]);

  const handleUrlChange = (id: string, value: string) => {
    setLinks((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Simpan massal / Upsert ke Supabase
  const handleSaveUrls = async () => {
    setIsSaving(true);
    try {
      const upsertPayload = COURSES_DATA.map((c) => ({
        course_id: c.id,
        notebook_url: links[c.id] || '',
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('course_notebook_links')
        .upsert(upsertPayload, { onConflict: 'course_id' });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditMode(false);
      }, 1000);
    } catch (err) {
      console.error('Gagal menyimpan ke Supabase:', err);
      alert('Gagal menyimpan ke cloud. Cek koneksi atau izin database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    NotebookLM Matkul
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      Cloud Sync
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                    {isEditMode
                      ? 'Tempelkan link share NotebookLM masing-masing mata kuliah untuk disimpan ke database.'
                      : 'Pilih mata kuliah untuk berdiskusi dengan AI yang menguasai materi 16 pertemuan.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons Header */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditMode((prev) => !prev)}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isEditMode
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-zinc-900 text-zinc-300 hover:text-white border-zinc-700 hover:bg-zinc-800'
                  }`}
                  title="Atur URL Matkul"
                >
                  <Settings2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{isEditMode ? 'Batal Edit' : 'Atur URL'}</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body: Loading / View / Edit */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
                <Loader2 className="w-7 h-7 animate-spin text-purple-500" />
                <span className="text-xs">Memuat daftar tautan cloud...</span>
              </div>
            ) : !isEditMode ? (
              /* VIEW MODE: Grid 9 Kartu Matkul */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mt-6 max-h-[62vh] overflow-y-auto pr-1">
                {COURSES_DATA.map((course) => {
                  const targetUrl = links[course.id] || course.defaultUrl || 'https://notebooklm.google.com';
                  const isConfigured = Boolean(links[course.id] || course.defaultUrl);

                  return (
                    <a
                      key={course.id}
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex flex-col justify-between p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700 transition-all duration-200 hover:shadow-xl cursor-pointer overflow-hidden"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-zinc-950 ${course.color}`}>
                            {course.code}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </div>

                        <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors line-clamp-1">
                          {course.name}
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>
                      </div>

                      <div className="mt-3.5 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> 16 Sesi PDF
                        </span>
                        <span className={`${isConfigured ? 'text-purple-400' : 'text-zinc-500'} font-medium flex items-center gap-0.5 group-hover:underline`}>
                          {isConfigured ? 'Buka AI Space' : 'Atur Link'} <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              /* EDIT MODE: Form Isian Input Link 9 Matkul */
              <div className="mt-6 max-h-[60vh] overflow-y-auto pr-1 space-y-3.5">
                <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 p-3 rounded-2xl">
                  <LinkIcon className="w-4 h-4 shrink-0" />
                  <span>Paste link share NotebookLM masing-masing matkul. Perubahan akan tersimpan ke database Supabase dan langsung aktif untuk semua pengguna:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COURSES_DATA.map((course) => (
                    <div key={course.id} className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-200 truncate">
                          {course.name}
                        </label>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {course.code}
                        </span>
                      </div>
                      <input
                        type="url"
                        value={links[course.id] || ''}
                        onChange={(e) => handleUrlChange(course.id, e.target.value)}
                        placeholder="https://notebooklm.google.com/notebook/..."
                        className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  ))}
                </div>

                {/* Tombol Simpan ke Supabase */}
                <div className="pt-3 flex justify-end gap-2 sticky bottom-0 bg-zinc-950/90 backdrop-blur-md pb-1">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer border border-zinc-700"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveUrls}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-900/30 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan ke Cloud...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        Tersimpan di Cloud!
                      </>
                    ) : (
                      'Simpan ke Supabase'
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};