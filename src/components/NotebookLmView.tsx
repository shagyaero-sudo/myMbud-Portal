import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ArrowRight,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Check,
  X,
  ChevronLeft,
  BookOpen,
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
    code: 'DS234320',
    description: 'Analisis pendapatan nasional, inflasi, kurva IS-LM, pertumbuhan ekonomi, dan kebijakan fiskal-moneter.',
    notebook_url: 'https://notebooklm.google.com/notebook/0042bb0c-47d3-4ab8-a832-e96810af1b29',
    color_theme: 'blue',
  },
  {
    id: 'dasar_manajemen',
    name: 'Dasar-dasar Manajemen',
    code: 'DS234315',
    description: 'Konsep fungsi manajemen (POAC), kepemimpinan tim, pengambilan keputusan, dan etika organisasi.',
    notebook_url: '',
    color_theme: 'blue',
  },
  {
    id: 'etika_pembangunan',
    name: 'Etika Pembangunan',
    code: 'DS234324',
    description: 'Eksplorasi etika moral, filsafat keadilan sosial, dan studi dampak pembangunan.',
    notebook_url: '',
    color_theme: 'blue',
  },
  {
    id: 'gender_pembangunan',
    name: 'Gender dan Pembangunan',
    code: 'DS234318',
    description: 'Analisis isu pengarusutamaan gender, SDGs 5, dan inklusivitas sosial.',
    notebook_url: '',
    color_theme: 'blue',
  },
  {
    id: 'infrastruktur_pembangunan',
    name: 'Infrastruktur Pembangunan',
    code: 'DS234326',
    description: 'Perencanaan jaringan infrastruktur wilayah, transportasi publik, utilitas perkotaan, dan proyek strategis.',
    notebook_url: '',
    color_theme: 'blue',
  },
  {
    id: 'kebijakan_publik',
    name: 'Kebijakan Publik dan Pembangunan',
    code: 'DS234322',
    description: 'Analisis siklus perumusan kebijakan, advokasi, dan evaluasi dampak.',
    notebook_url: '',
    color_theme: 'blue',
  },
  {
    id: 'komunikasi_pembangunan',
    name: 'Komunikasi Pembangunan',
    code: 'DS234319',
    description: 'Strategi kampanye sosial, partisipasi publik, dan dinamika media komunikasi.',
    notebook_url: '',
    color_theme: 'blue',
  },
  {
    id: 'manusia_ruang_hidup',
    name: 'Manusia dan Ruang Hidup',
    code: 'DS234316',
    description: 'Kajian interaksi ekologi manusia, tata kelola lingkungan, dan ruang kota.',
    notebook_url: '',
    color_theme: 'blue',
  },
  {
    id: 'statistik_sosial',
    name: 'Statistik Sosial',
    code: 'DS234317',
    description: 'Praktik analisis data, uji hipotesis, korelasi, dan interpretasi output SPSS.',
    notebook_url: '',
    color_theme: 'blue',
  },
];

export const NotebookLmView: React.FC<NotebookLmViewProps> = ({
  isOfficer,
  onBack,
}) => {
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseCardData | null>(null);
  const [redirectingCourse, setRedirectingCourse] = useState<CourseCardData | null>(null);

  // Officer / Edit States
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCard, setEditingCard] = useState<CourseCardData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Welcome Onboarding Modal State
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => {
    return !localStorage.getItem('mymbud_notebooklm_welcomed');
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentUserName = localStorage.getItem('mymbud_user_name') || 'Aero';

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

    const channel = supabase
      .channel('notebooklm_ai_interface_realtime')
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

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOfficer]);

  const handleCloseWelcomeModal = () => {
    localStorage.setItem('mymbud_notebooklm_welcomed', 'true');
    setShowWelcomeModal(false);
  };

  const handleSelectCourse = (course: CourseCardData) => {
    setSelectedCourse(course);
    setIsDropdownOpen(false);
  };

  const handleExecuteRedirect = () => {
    if (!selectedCourse) return;

    if (!selectedCourse.notebook_url || selectedCourse.notebook_url.trim() === '') {
      alert(`Link NotebookLM untuk mata kuliah "${selectedCourse.name}" belum diatur.`);
      return;
    }

    setRedirectingCourse(selectedCourse);
    setTimeout(() => {
      window.open(selectedCourse.notebook_url, '_blank');
      setRedirectingCourse(null);
    }, 800);
  };

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
      console.error('Gagal menyimpan:', err);
      alert('Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Hapus mata kuliah ini?')) return;
    try {
      await supabase.from('notebooklm_courses').delete().eq('id', id);
    } catch (err) {
      console.error('Gagal menghapus:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-zinc-100 flex flex-col justify-between overflow-y-auto select-none font-sans custom-scrollbar">
      
      {/* ATMOSPHERIC GEMINI-STYLE AMBIENT GLOW */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[500px] sm:h-[700px] bg-[radial-gradient(ellipse_at_center,_rgba(29,78,216,0.14)_0%,_rgba(15,23,42,0.06)_50%,_transparent_75%)] pointer-events-none -z-10" />
      <div className="fixed -bottom-32 left-1/2 -translate-x-1/2 w-[90vw] h-[350px] bg-[radial-gradient(ellipse_at_bottom,_rgba(37,99,235,0.18)_0%,_transparent_70%)] pointer-events-none -z-10" />

      {/* TOP CONTROLS */}
      <div className="w-full flex items-center justify-between p-4 sm:p-8 z-20 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 backdrop-blur-md transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-md"
          title="Kembali"
          aria-label="Kembali"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {isOfficer && (
          <button
            type="button"
            onClick={() => setIsEditMode((prev) => !prev)}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md ${
              isEditMode
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Selesai' : 'Kelola Link'}</span>
          </button>
        )}
      </div>

      {/* CENTER INTERACTIVE AREA */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full px-4 z-10 space-y-4 py-8">
        
        {/* Real Logo Gemini Notebook (Clean) */}
        <div className="flex items-center justify-center">
          <img
            src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-notebook__full-color.max-1440x810.png"
            alt="Gemini Notebook"
            className="w-10 h-10 object-contain"
          />
        </div>

        {/* Real Text Subtitle Tipis */}
        <p className="text-xs tracking-wide text-zinc-400 font-normal">
          myMbud x NotebookLM
        </p>

        {/* Heading Sapaan */}
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-100 leading-snug">
            Mau belajar apa hari ini, <span className="text-blue-400 font-semibold">{currentUserName}</span>?
          </h1>
        </div>

        {/* PROMPT BAR & DROPDOWN CONTAINER */}
        <div className="w-full max-w-xl relative pt-2" ref={dropdownRef}>
          
          {/* Prompt Bar Box */}
          <div 
            className="relative w-full bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800/90 rounded-full py-2.5 pl-4 pr-3 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-xl transition-all"
          >
            <div 
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <span className={`text-xs sm:text-sm font-medium truncate ${selectedCourse ? 'text-zinc-100 font-semibold' : 'text-zinc-400'}`}>
                {selectedCourse ? selectedCourse.name : 'Pilih matkul untuk mulai belajar...'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {selectedCourse ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedCourse(null)}
                    className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Batal pilih"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteRedirect}
                    className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-900/30 transition-all cursor-pointer active:scale-95"
                  >
                    <span>Go</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className={`w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-transform duration-200 cursor-pointer ${isDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* FULL EXPANDABLE DROPDOWN LIST (Scrolls Entire Screen Smoothly) */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.99 }}
                transition={{ duration: 0.15 }}
                className="mt-3 w-full bg-zinc-900/95 border border-zinc-800/90 rounded-3xl p-3 shadow-2xl backdrop-blur-2xl space-y-1.5 text-left z-30"
              >
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between border-b border-zinc-800/50 pb-2 mb-1">
                  <span>Daftar Mata Kuliah ({courses.length})</span>
                  <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                </div>

                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleSelectCourse(course)}
                    className="w-full p-3 rounded-2xl bg-zinc-950/60 hover:bg-blue-600/15 border border-zinc-800/60 hover:border-blue-500/40 transition-all flex items-center justify-between gap-3 group cursor-pointer text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 group-hover:bg-blue-950 group-hover:text-blue-300 group-hover:border group-hover:border-blue-800/40 transition-colors">
                          {course.code}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-200 group-hover:text-blue-300 transition-colors truncate">
                          {course.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1 leading-snug">
                        {course.description || 'Diskusi materi bersama AI'}
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-zinc-900 group-hover:bg-blue-600 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* OFFICER EDIT PANEL */}
        {isOfficer && isEditMode && (
          <div className="w-full mt-4 p-4 rounded-3xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl text-left max-h-[40vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-blue-400">Kelola Link Mata Kuliah</span>
              <button
                type="button"
                onClick={() =>
                  setEditingCard({
                    id: `course_${Date.now()}`,
                    name: '',
                    code: 'DS234000',
                    description: '',
                    notebook_url: '',
                    color_theme: 'blue',
                  })
                }
                className="px-2.5 py-1 rounded-xl bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>

            <div className="space-y-2">
              {courses.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-200 truncate">{c.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate font-mono">{c.notebook_url || 'Belum ada link'}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingCard(c)}
                      className="p-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(c.id)}
                      className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER PADDING (Provides bottom spacing when scrolling) */}
      <div className="w-full py-4 text-center shrink-0" />

      {/* OPENING ONBOARDING POPUP MODAL */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.95)] relative overflow-hidden text-left"
            >
              {/* Header Co-Branding: Logo Asli myMbud + Logo Asli Gemini Notebook */}
              <div className="flex items-center gap-3 mb-5">
                <img
                  src="/logombud.png"
                  alt="myMbud Logo"
                  className="w-8 h-8 object-contain"
                />
                <span className="text-zinc-500 font-light text-base">×</span>
                <img
                  src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-notebook__full-color.max-1440x810.png"
                  alt="Gemini Notebook"
                  className="w-8 h-8 object-contain"
                />
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight leading-snug">
                Selamat Datang di myMbud x NotebookLM
              </h2>

              {/* Narasi Opsi 1 */}
              <div className="mt-3.5 space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                <p>
                  Sebuah kolaborasi strategis yang dirancang untuk mendefinisikan ulang cara kamu memahami materi perkuliahan. Melalui integrasi kecerdasan buatan berbasis dokumen resmi, seluruh slide dan literatur kelas kini bertransformasi menjadi ruang diskusi interaktif, akurat, dan sepenuhnya bebas dari halusinasi.
                </p>
                <p className="text-zinc-400">
                  Setiap sesi eksplorasi, tanya jawab materi, hingga ringkasan audio berjalan dalam enkripsi privat tanpa akses dari pihak mana pun. Akses materi akademikmu dengan standar belajar yang lebih presisi, efisien, dan mendalam.
                </p>
              </div>

              {/* Tombol Mulai Single-Color Biru */}
              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={handleCloseWelcomeModal}
                  className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-900/30 transition-all cursor-pointer active:scale-95"
                >
                  Mulai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REDIRECTION LOADING OVERLAY */}
      <AnimatePresence>
        {redirectingCourse && (
          <div className="fixed inset-0 z-[9999] bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="space-y-4"
            >
              <img
                src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-notebook__full-color.max-1440x810.png"
                alt="Gemini Notebook"
                className="w-12 h-12 object-contain mx-auto animate-pulse"
              />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Membuka Ruang Belajar...</h3>
                <p className="text-xs text-blue-400 font-medium">{redirectingCourse.name}</p>
              </div>
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500 mx-auto mt-2" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OFFICER EDIT MODAL FORM */}
      <AnimatePresence>
        {editingCard && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-400" />
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

              <form onSubmit={handleSaveCard} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Kode Singkat
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCard.code}
                      onChange={(e) =>
                        setEditingCard({ ...editingCard, code: e.target.value })
                      }
                      placeholder="DS234320"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="blue">Blue</option>
                      <option value="purple">Purple</option>
                      <option value="emerald">Emerald</option>
                      <option value="rose">Rose</option>
                      <option value="amber">Amber</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingCard(null)}
                    className="px-4 py-2.5 rounded-2xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/30 cursor-pointer disabled:opacity-50"
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

    </div>
  );
};