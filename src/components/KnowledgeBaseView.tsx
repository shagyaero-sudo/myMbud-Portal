import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Trash2,
  Upload,
  X,
  UploadCloud,
  Loader2,
  Paperclip,
  Bookmark,
  BookOpen,
  LayoutGrid,
  List,
} from 'lucide-react';
import { MaterialFile } from '../types';
import {
  subscribeUserMaterialBookmarks,
  toggleMaterialBookmark,
} from '../services/api';

interface CourseTheme {
  border: string;
  spine: string;
  badge: string;
  icon: string;
  subtext: string;
  sidebarActive: string;
}

const COURSE_THEMES: Record<string, CourseTheme> = {
  'Ekonomi Makro': {
    border: 'hover:border-blue-300 dark:hover:border-blue-700',
    spine: 'bg-blue-600 dark:bg-blue-500',
    badge: 'bg-blue-100/70 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/40',
    icon: 'text-blue-600 dark:text-blue-400',
    subtext: 'text-blue-600 dark:text-blue-400',
    sidebarActive: 'bg-blue-600 text-white shadow-md shadow-blue-500/20',
  },
  'Dasar-dasar Manajemen': {
    border: 'hover:border-amber-300 dark:hover:border-amber-700',
    spine: 'bg-amber-500 dark:bg-amber-400',
    badge: 'bg-amber-100/70 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/40',
    icon: 'text-amber-600 dark:text-amber-400',
    subtext: 'text-amber-600 dark:text-amber-400',
    sidebarActive: 'bg-amber-600 text-white shadow-md shadow-amber-500/20',
  },
  'Etika Pembangunan': {
    border: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    spine: 'bg-emerald-600 dark:bg-emerald-500',
    badge: 'bg-emerald-100/70 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40',
    icon: 'text-emerald-600 dark:text-emerald-400',
    subtext: 'text-emerald-600 dark:text-emerald-400',
    sidebarActive: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20',
  },
  'Gender dan Pembangunan': {
    border: 'hover:border-pink-300 dark:hover:border-pink-700',
    spine: 'bg-pink-500 dark:bg-pink-400',
    badge: 'bg-pink-100/70 dark:bg-pink-950 text-pink-800 dark:text-pink-300 border-pink-200/50 dark:border-pink-800/40',
    icon: 'text-pink-600 dark:text-pink-400',
    subtext: 'text-pink-600 dark:text-pink-400',
    sidebarActive: 'bg-pink-600 text-white shadow-md shadow-pink-500/20',
  },
  'Infrastruktur Pembangunan': {
    border: 'hover:border-orange-300 dark:hover:border-orange-700',
    spine: 'bg-orange-500 dark:bg-orange-400',
    badge: 'bg-orange-100/70 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/40',
    icon: 'text-orange-600 dark:text-orange-400',
    subtext: 'text-orange-600 dark:text-orange-400',
    sidebarActive: 'bg-orange-600 text-white shadow-md shadow-orange-500/20',
  },
  'Kebijakan Publik dan Pembangunan': {
    border: 'hover:border-teal-300 dark:hover:border-teal-700',
    spine: 'bg-teal-600 dark:bg-teal-500',
    badge: 'bg-teal-100/70 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-200/50 dark:border-teal-800/40',
    icon: 'text-teal-600 dark:text-teal-400',
    subtext: 'text-teal-600 dark:text-teal-400',
    sidebarActive: 'bg-teal-600 text-white shadow-md shadow-teal-500/20',
  },
  'Komunikasi Pembangunan': {
    border: 'hover:border-cyan-300 dark:hover:border-cyan-700',
    spine: 'bg-cyan-500 dark:bg-cyan-400',
    badge: 'bg-cyan-100/70 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-200/50 dark:border-cyan-800/40',
    icon: 'text-cyan-600 dark:text-cyan-400',
    subtext: 'text-cyan-600 dark:text-cyan-400',
    sidebarActive: 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20',
  },
  'Manusia dan Ruang': {
    border: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    spine: 'bg-indigo-600 dark:bg-indigo-500',
    badge: 'bg-indigo-100/70 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/40',
    icon: 'text-indigo-600 dark:text-indigo-400',
    subtext: 'text-indigo-600 dark:text-indigo-400',
    sidebarActive: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20',
  },
  'Statistik Sosial': {
    border: 'hover:border-purple-300 dark:hover:border-purple-700',
    spine: 'bg-purple-600 dark:bg-purple-500',
    badge: 'bg-purple-100/70 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/40',
    icon: 'text-purple-600 dark:text-purple-400',
    subtext: 'text-purple-600 dark:text-purple-400',
    sidebarActive: 'bg-purple-600 text-white shadow-md shadow-purple-500/20',
  },
};

const DEFAULT_THEME: CourseTheme = {
  border: 'hover:border-rose-300 dark:hover:border-rose-700',
  spine: 'bg-rose-500 dark:bg-rose-400',
  badge: 'bg-rose-100/70 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/40',
  icon: 'text-rose-600 dark:text-rose-400',
  subtext: 'text-rose-600 dark:text-rose-400',
  sidebarActive: 'bg-rose-600 text-white shadow-md shadow-rose-500/20',
};

const getCourseTheme = (courseName: string): CourseTheme => {
  return COURSE_THEMES[courseName] || DEFAULT_THEME;
};

interface KnowledgeBaseViewProps {
  materials: MaterialFile[];
  isOfficer: boolean;
  availableCourses?: string[];
  onAddMaterial: (material: Omit<MaterialFile, 'id' | 'uploadDate'>) => void;
  onDeleteMaterial: (id: string) => void;
  onPreviewPdf: (material: MaterialFile) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  materials,
  isOfficer,
  availableCourses = [],
  onAddMaterial,
  onDeleteMaterial,
  onPreviewPdf,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'shelf' | 'list'>('shelf');

  // Sync Bookmarks per User NRP dari Firestore
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const currentUserNrp = localStorage.getItem('mymbud_user_nrp') || 'unknown';

  useEffect(() => {
    const unsub = subscribeUserMaterialBookmarks(currentUserNrp, (ids) => {
      setBookmarkedIds(ids);
    });
    return () => unsub();
  }, [currentUserNrp]);

  const handleToggleBookmark = async (e: React.MouseEvent, materialId: string) => {
    e.stopPropagation();
    const isCurrentlyBookmarked = bookmarkedIds.includes(materialId);
    try {
      await toggleMaterialBookmark(currentUserNrp, materialId, !isCurrentlyBookmarked);
    } catch (error) {
      console.error('Gagal memperbarui bookmark materi:', error);
    }
  };

  const dynamicCoursesList = Array.from(
    new Set([
      ...availableCourses.filter((c) => c && c.trim() !== ''),
      ...materials.map((m) => m.courseName).filter((c) => c && c.trim() !== ''),
    ])
  ).sort();

  // Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [formCourseName, setFormCourseName] = useState(
    dynamicCoursesList[0] || 'Umum'
  );
  const [formSession, setFormSession] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formUploader, setFormUploader] = useState('Pengurus Kelas A');

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMaterials = materials.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.courseName.toLowerCase().includes(search.toLowerCase()) ||
      m.session.toLowerCase().includes(search.toLowerCase());
    const matchCourse =
      selectedCourse === 'ALL' || m.courseName === selectedCourse;
    const matchBookmark = !showOnlyBookmarked || bookmarkedIds.includes(m.id);

    return matchSearch && matchCourse && matchBookmark;
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadFileToDrive = async (file: File): Promise<string> => {
    const GAS_URL =
      'https://script.google.com/macros/s/AKfycbyce8cTZ2F25PwyfISpmVJJDMiIunl8G8lCyzkPKQaiuUl-nxKNM5i9b72MMo4M_xis/exec';

    setUploadProgress(8);
    const base64Data = await fileToBase64(file);
    setUploadProgress(18);

    const payload = {
      fileName: file.name,
      mimeType: file.type,
      base64: base64Data,
      folderName: 'myMbud Materials',
    };

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 92) {
          clearInterval(progressInterval);
          return 92;
        }
        const step = prev < 50 ? Math.random() * 8 + 4 : Math.random() * 3 + 1;
        return Math.min(Math.round(prev + step), 92);
      });
    }, 280);

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Upload G-Drive gagal (${response.status}).`);
      }

      const data = await response.json();
      setUploadProgress(100);

      if (data.status !== 'success') {
        throw new Error(data.message);
      }

      return data.url;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  const handleOpenUploadModal = () => {
    if (dynamicCoursesList.length > 0) {
      setFormCourseName(dynamicCoursesList[0]);
    }
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourseName.trim() || !formTitle.trim() || !formSession.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let finalFileUrl =
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      let fileSizeStr = '3.2 MB';

      if (selectedFile) {
        finalFileUrl = await uploadFileToDrive(selectedFile);
        fileSizeStr = `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      onAddMaterial({
        courseId: formCourseName.slice(0, 6).toUpperCase().replace(/\s+/g, ''),
        courseName: formCourseName,
        session: formSession,
        title: formTitle.endsWith('.pdf') ? formTitle : `${formTitle}.pdf`,
        fileUrl: finalFileUrl,
        fileType: 'pdf',
        fileSize: fileSizeStr,
        uploader: formUploader,
      });

      setFormTitle('');
      setFormSession('');
      setSelectedFile(null);
      setShowUploadModal(false);
    } catch (error) {
      console.error('Gagal mengunggah materi:', error);
      alert('Terjadi kesalahan saat mengunggah berkas PDF.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-16 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-[calc(4rem+env(safe-area-inset-bottom))]">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 pt-4 sm:pt-6 pb-2 mb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Bank PDF Matkul
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Perpustakaan Arsip Materi Perkuliahan
          </p>
        </div>

        {/* Action Controls Desktop */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowOnlyBookmarked((prev) => !prev)}
            className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              showOnlyBookmarked
                ? 'bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/25'
                : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-amber-400 hover:text-amber-500 shadow-xs'
            }`}
            title="Tampilkan hanya materi yang disimpan"
          >
            <Bookmark
              className={`w-3.5 h-3.5 ${
                showOnlyBookmarked ? 'fill-white text-white' : 'text-amber-500'
              }`}
            />
            <span>Tersimpan</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                showOnlyBookmarked
                  ? 'bg-white/25 text-white'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
              }`}
            >
              {bookmarkedIds.length}
            </span>
          </button>

          {isOfficer && (
            <button
              onClick={handleOpenUploadModal}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Vertical Course Tabs */}
        <div className="hidden md:block md:col-span-4 lg:col-span-3 space-y-2">
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-4 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-1.5 transition-colors">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Daftar Rak Kuliah</span>
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <button
              onClick={() => {
                setSelectedCourse('ALL');
                setShowOnlyBookmarked(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                selectedCourse === 'ALL' && !showOnlyBookmarked
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium'
              }`}
            >
              <span>Semua Matkul</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  selectedCourse === 'ALL' && !showOnlyBookmarked
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                }`}
              >
                {materials.length}
              </span>
            </button>

            {dynamicCoursesList.map((course) => {
              const count = materials.filter((m) => m.courseName === course).length;
              const isSelected = selectedCourse === course && !showOnlyBookmarked;
              const theme = getCourseTheme(course);

              return (
                <button
                  key={course}
                  onClick={() => {
                    setSelectedCourse(course);
                    setShowOnlyBookmarked(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? `${theme.sidebarActive} font-bold`
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium'
                  }`}
                >
                  <span className="truncate pr-2">{course}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Library Shelf View */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          {/* Search Bar & View Mode Toggle */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari buku, modul, slide PPT, atau topik..."
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-1 rounded-2xl gap-1 shrink-0 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none">
              <button
                type="button"
                onClick={() => setViewMode('shelf')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'shelf'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
                title="Tampilan Rak Buku (Bookshelf)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
                title="Tampilan Daftar (List)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile Action Controls: Dropdown Bersebelahan dengan Tombol Tersimpan */}
          <div className="flex md:hidden items-center gap-2 w-full">
            <div className="relative flex-1">
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setShowOnlyBookmarked(false);
                }}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              >
                <option value="ALL">Semua Rak ({materials.length})</option>
                {dynamicCoursesList.map((course) => {
                  const count = materials.filter((m) => m.courseName === course).length;
                  return (
                    <option key={course} value={course}>
                      {course} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowOnlyBookmarked((prev) => !prev)}
              className={`px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer ${
                showOnlyBookmarked
                  ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
              }`}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  showOnlyBookmarked ? 'fill-white text-white' : 'text-amber-500'
                }`}
              />
              <span>Tersimpan</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  showOnlyBookmarked
                    ? 'bg-white/25 text-white'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                }`}
              >
                {bookmarkedIds.length}
              </span>
            </button>

            {isOfficer && (
              <button
                onClick={handleOpenUploadModal}
                className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs shrink-0 cursor-pointer"
                title="Unggah PDF"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Main Content: Bookshelf Container */}
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors min-h-[300px]">
            {filteredMaterials.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/70 dark:bg-zinc-800/50 rounded-2xl space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600 mb-1" />
                <p className="font-semibold text-slate-600 dark:text-zinc-300">
                  {showOnlyBookmarked
                    ? 'Belum ada berkas yang disimpan di rak favoritmu.'
                    : 'Rak ini masih kosong.'}
                </p>
                <p className="text-[11px]">
                  {showOnlyBookmarked
                    ? 'Klik ikon bookmark pada modul untuk menyimpannya di sini.'
                    : 'Belum ada berkas PDF untuk mata kuliah yang dipilih.'}
                </p>
              </div>
            ) : viewMode === 'shelf' ? (
              /* ================= BOOKSHELF GRID VIEW (COMPACT CARD) ================= */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredMaterials.map((mat) => {
                  const isBookmarked = bookmarkedIds.includes(mat.id);
                  const theme = getCourseTheme(mat.courseName);

                  return (
                    <motion.div
                      key={mat.id}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => onPreviewPdf(mat)}
                      className={`group relative rounded-2xl bg-gradient-to-b from-slate-50/90 to-slate-100/60 dark:from-zinc-800/80 dark:to-zinc-800/40 p-3.5 border border-slate-200/70 dark:border-zinc-700/60 shadow-xs hover:shadow-md ${theme.border} transition-all cursor-pointer flex flex-col justify-between overflow-hidden`}
                    >
                      {/* Left Spine Texture Accent */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.spine} group-hover:w-2 transition-all rounded-l-2xl`} />

                      <div className="pl-1.5 space-y-2.5">
                        {/* Top Meta: Session / Type & Bookmark Action */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${theme.badge}`}>
                            {mat.session || 'MODUL'}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleToggleBookmark(e, mat.id)}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                isBookmarked
                                  ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-500'
                                  : 'text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-zinc-700'
                              }`}
                              title={isBookmarked ? 'Hapus bookmark' : 'Simpan ke bookmark'}
                            >
                              <Bookmark
                                className={`w-3.5 h-3.5 ${
                                  isBookmarked ? 'fill-amber-500 text-amber-500' : ''
                                }`}
                              />
                            </button>

                            {isOfficer && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteMaterial(mat.id);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                                title="Hapus Berkas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Subject */}
                        <div className="space-y-1">
                          <div className="flex items-start gap-2">
                            <FileText className={`w-4 h-4 ${theme.icon} shrink-0 mt-0.5`} />
                            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                              {mat.title}
                            </h4>
                          </div>
                          <p className={`text-[11px] font-semibold truncate pl-6 ${theme.subtext}`}>
                            {mat.courseName}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* ================= COMPACT LIST VIEW ================= */
              <div className="space-y-2">
                {filteredMaterials.map((mat) => {
                  const isBookmarked = bookmarkedIds.includes(mat.id);
                  const theme = getCourseTheme(mat.courseName);

                  return (
                    <div
                      key={mat.id}
                      onClick={() => onPreviewPdf(mat)}
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors flex items-center justify-between gap-3 group border border-transparent hover:border-blue-100 dark:hover:border-blue-900 active:scale-[0.998]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-2.5 rounded-2xl bg-white dark:bg-zinc-900 ${theme.icon} shrink-0 shadow-xs`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {mat.title}
                          </h4>
                          <p className={`text-[11px] font-semibold truncate ${theme.subtext}`}>
                            {mat.courseName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${theme.badge}`}>
                          {mat.session}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleToggleBookmark(e, mat.id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isBookmarked
                              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 text-amber-500 shadow-xs'
                              : 'bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-zinc-700'
                          }`}
                          title={isBookmarked ? 'Hapus dari Tersimpan' : 'Simpan Materi'}
                        >
                          <Bookmark
                            className={`w-4 h-4 ${
                              isBookmarked ? 'fill-amber-500 text-amber-500' : ''
                            }`}
                          />
                        </button>

                        {isOfficer && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMaterial(mat.id);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Hapus Berkas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Material Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  Unggah Materi / Slide PDF
                </h3>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleUploadSubmit}
                className="flex flex-col flex-1 overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Mata Kuliah
                    </label>
                    {dynamicCoursesList.length > 0 ? (
                      <select
                        value={formCourseName}
                        onChange={(e) => setFormCourseName(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {dynamicCoursesList.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formCourseName}
                        onChange={(e) => setFormCourseName(e.target.value)}
                        placeholder="Masukkan Nama Mata Kuliah"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Pertemuan ke-
                      </label>
                      <input
                        type="text"
                        required
                        value={formSession}
                        onChange={(e) => setFormSession(e.target.value)}
                        placeholder="Misal: WEEK 14"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Pengunggah
                      </label>
                      <input
                        type="text"
                        required
                        value={formUploader}
                        onChange={(e) => setFormUploader(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Judul / Nama File Materi
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Pengantar Teori Pembangunan.pdf"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Berkas File PDF
                    </label>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        if (e.dataTransfer.files?.length) {
                          setSelectedFile(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                        isDragOver
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700/50'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />

                      {selectedFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                            <Paperclip className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 max-w-[200px] truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Siap diunggah
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-slate-200 dark:bg-zinc-700 rounded-full">
                            <UploadCloud className="w-6 h-6 text-slate-600 dark:text-zinc-400" />
                          </div>
                          <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                            Klik atau seret file PDF di sini
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                            File PDF maksimal 10 MB
                          </p>
                        </div>
                      )}
                    </div>

                    {isUploading && (
                      <div className="mt-3 space-y-1.5 p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {uploadProgress < 30
                              ? 'Menyiapkan materi...'
                              : uploadProgress < 85
                              ? 'Mengunggah ke Cloud Storage...'
                              : uploadProgress < 100
                              ? 'Memproses penyimpanan data...'
                              : 'Selesai!'}
                          </span>
                          <span className="font-mono text-xs tabular-nums font-bold">
                            {Math.round(uploadProgress)}%
                          </span>
                        </div>
                        <div className="bg-blue-100 dark:bg-zinc-800 rounded-full h-2 w-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center pt-0.5">
                          Harap tetap di halaman ini hingga proses unggah tuntas.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-zinc-900">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => setShowUploadModal(false)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      'Unggah Berkas'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};