import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  ArrowUpRight,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Check,
  X,
  ChevronLeft,
  Mic,
  BookOpen,
  Zap,
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

export const NotebookLmView: React.FC<NotebookLmViewProps> = ({
  isOfficer,
  onBack,
}) => {
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

    // Close dropdown on outside click
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

  // Handle Select Course & Redirect
  const handleSelectCourse = (course: CourseCardData) => {
    setIsDropdownOpen(false);
    if (!course.notebook_url || course.notebook_url.trim() === '') {
      alert(`Link NotebookLM untuk mata kuliah "${course.name}" belum diatur.`);
      return;
    }

    setRedirectingCourse(course);
    setTimeout(() => {
      window.open(course.notebook_url, '_blank');
      setRedirectingCourse(null);
    }, 1000);
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
    <div className="fixed inset-0 z-50 bg-[#050507] text-zinc-100 flex flex-col justify-between p-4 sm:p-8 select-none overflow-hidden font-sans">
      
      {/* BACKGROUND AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[580px] h-[300px] sm:h-[580px] bg-gradient-to-tr from-purple-600/10 via-indigo-600/15 to-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80vw] h-[220px] bg-gradient-to-t from-purple-900/15 to-transparent blur-[100px] pointer-events-none" />

      {/* TOP MINIMAL CONTROLS */}
      <div className="w-full flex items-center justify-between z-20">
        {/* Tombol Back murni < */}
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 backdrop-blur-md transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-lg"
          title="Kembali ke Portal"
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
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/40'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Selesai' : 'Kelola Link'}</span>
          </button>
        )}
      </div>

      {/* CENTER INTERACTIVE HERO AREA (Desktop: Center Viewport, Mobile: Flex Flow) */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full px-2 z-10 space-y-5 my-auto">
        
        {/* Sparkle Glow Icon */}
        <div className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-3xl bg-gradient-to-tr from-purple-600/20 via-indigo-600/20 to-blue-600/20 border border-purple-500/30 shadow-2xl backdrop-blur-xl">
          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400 animate-pulse" />
          <div className="absolute inset-0 rounded-3xl bg-purple-500/10 blur-md -z-10" />
        </div>

        {/* Branding Subtitle */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-purple-400">
          myMbud x NotebookLM
        </div>

        {/* Dynamic Greeting */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-100 leading-snug">
            Mau belajar apa hari ini, <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">{currentUserName}</span>?
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Pilih mata kuliah
          </p>
        </div>

        {/* DESKTOP INTEGRATED PROMPT BAR (Muncul di tengah layar pada PC) */}
        <div className="hidden md:block w-full max-w-xl relative pt-2" ref={dropdownRef}>
          {/* Dropdown Options List Popover */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-3 left-0 right-0 bg-zinc-900/95 border border-zinc-800/90 rounded-3xl p-3 shadow-2xl backdrop-blur-2xl max-h-[46vh] overflow-y-auto custom-scrollbar z-40 space-y-1.5 text-left"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                  <span>Daftar Mata Kuliah ({courses.length})</span>
                  <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                </div>

                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleSelectCourse(course)}
                    className="w-full p-3 rounded-2xl bg-zinc-950/60 hover:bg-purple-600/20 hover:border-purple-500/40 border border-zinc-800/60 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                          {course.code}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                          {course.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1 leading-snug">
                        {course.description || 'Diskusi materi bersama AI'}
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-zinc-900 group-hover:bg-purple-600 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fake Prompt Bar Box */}
          <div 
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="relative w-full bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800/90 hover:border-purple-500/40 rounded-full py-3.5 px-5 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-xl cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
                Pilih matkul untuk mulai...
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="p-2 text-zinc-500 group-hover:text-purple-400 transition-colors">
                <Mic className="w-4 h-4" />
              </div>
              <div className={`w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* OFFICER EDIT PANEL (Jika Mode Edit Aktif) */}
        {isOfficer && isEditMode && (
          <div className="w-full mt-4 p-4 rounded-3xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl text-left max-h-[35vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-purple-400">Kelola Link Mata Kuliah</span>
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
                className="px-2.5 py-1 rounded-xl bg-purple-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
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

      {/* MOBILE BOTTOM FLOATING PROMPT BAR (Hanya Tampil di Layar HP) */}
      <div className="block md:hidden w-full max-w-xl mx-auto relative z-30 pb-3" ref={dropdownRef}>
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full mb-3 left-0 right-0 bg-zinc-900/95 border border-zinc-800/90 rounded-3xl p-3 shadow-2xl backdrop-blur-2xl max-h-[50vh] overflow-y-auto custom-scrollbar z-40 space-y-1.5 text-left"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                <span>Daftar Mata Kuliah ({courses.length})</span>
                <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
              </div>

              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleSelectCourse(course)}
                  className="w-full p-3 rounded-2xl bg-zinc-950/60 hover:bg-purple-600/20 hover:border-purple-500/40 border border-zinc-800/60 transition-all flex items-center justify-between gap-3 group cursor-pointer text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                        {course.code}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                        {course.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1 leading-snug">
                      {course.description || 'Diskusi materi bersama AI'}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-zinc-900 group-hover:bg-purple-600 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="relative w-full bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800/90 hover:border-purple-500/40 rounded-full py-3.5 px-5 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-xl cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
              Pilih matkul untuk mulai...
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="p-2 text-zinc-500 group-hover:text-purple-400 transition-colors">
              <Mic className="w-4 h-4" />
            </div>
            <div className={`w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* OPENING ONBOARDING POPUP MODAL */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="w-full max-w-lg bg-zinc-950 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left"
            >
              {/* Purple Ambient Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/15 rounded-full blur-[80px] pointer-events-none" />

              {/* Header Co-Branding: Logo myMbud + Logo Gemini/NotebookLM */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-600/30">
                  M
                </div>
                <span className="text-zinc-500 font-light text-sm">×</span>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
                  <Sparkles className="w-4 h-4 text-purple-200" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight leading-snug">
                Selamat Datang di myMbud x NotebookLM
              </h2>

              {/* Paragraphs Opsi 1 */}
              <div className="mt-3 space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                <p>
                  Sebuah kolaborasi strategis yang dirancang untuk mendefinisikan ulang cara kamu memahami materi perkuliahan. Melalui integrasi kecerdasan buatan berbasis dokumen resmi, seluruh slide dan literatur kelas kini bertransformasi menjadi ruang diskusi interaktif dan akurat berbasis data.
                </p>
                <p className="text-zinc-400">
                  Setiap sesi eksplorasi, tanya jawab materi, hingga ringkasan berjalan dalam enkripsi privat tanpa akses dari pihak mana pun. Akses materi akademikmu dengan standar belajar yang lebih presisi, efisien, dan mendalam.
                </p>
              </div>

              {/* Compact Pill "Mulai" Button */}
              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={handleCloseWelcomeModal}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Mulai</span>
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
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-2xl shadow-purple-600/50 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Membuka Ruang Belajar...</h3>
                <p className="text-xs text-purple-400 font-medium">{redirectingCourse.name}</p>
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
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
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
                      placeholder="EM-2026"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
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
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
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
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500 resize-none"
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
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500 font-mono"
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
                    className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer disabled:opacity-50"
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