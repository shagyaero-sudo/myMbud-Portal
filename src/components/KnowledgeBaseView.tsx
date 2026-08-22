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
  Plus,
} from 'lucide-react';
import { MaterialFile } from '../types';
import {
  subscribeUserMaterialBookmarks,
  toggleMaterialBookmark,
} from '../services/api';

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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-5 pb-12"
    >
      {/* HEADER BANNER */}
      <div className="flex items-center justify-between gap-3 px-1 pt-4 sm:pt-6 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            Bank PDF Matkul
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Perpustakaan Materi Perkuliahan
          </p>
        </div>

        {/* Action Control: Bookmark Button (GLASSMORPHISM) */}
        <button
          type="button"
          onClick={() => setShowOnlyBookmarked((prev) => !prev)}
          className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer shrink-0 ${
            showOnlyBookmarked
              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border-white/60 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 shadow-xs'
          }`}
          title="Tampilkan hanya materi yang disimpan"
        >
          <Bookmark
            className={`w-3.5 h-3.5 ${
              showOnlyBookmarked ? 'fill-white text-white' : 'text-slate-400 dark:text-zinc-400'
            }`}
          />
          <span className="hidden sm:inline">Bookmark</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              showOnlyBookmarked
                ? 'bg-white/20 text-white'
                : 'bg-slate-100/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300'
            }`}
          >
            {bookmarkedIds.length}
          </span>
        </button>
      </div>

      {/* DEDICATED UPLOAD BANNER (GLASSMORPHISM) */}
      {isOfficer && (
        <div className="p-4 sm:p-5 rounded-3xl bg-blue-50/80 dark:bg-blue-950/30 backdrop-blur-md border border-blue-100/80 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">
                Unggah Materi / Slide Perkuliahan
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Tambahkan berkas PDF baru untuk dapat diakses oleh seluruh mahasiswa.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenUploadModal}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Unggah PDF Baru</span>
          </motion.button>
        </div>
      )}

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-1">
        {/* Left Column: Vertical Course Tabs (GLASSMORPHISM) */}
        <div className="hidden md:block md:col-span-4 lg:col-span-3 space-y-2">
          <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none space-y-1.5 transition-all">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Daftar Matkul</span>
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
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/50 font-medium'
              }`}
            >
              <span>Semua Matkul</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  selectedCourse === 'ALL' && !showOnlyBookmarked
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100/80 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400'
                }`}
              >
                {materials.length}
              </span>
            </button>

            {dynamicCoursesList.map((course) => {
              const count = materials.filter((m) => m.courseName === course).length;
              const isSelected = selectedCourse === course && !showOnlyBookmarked;

              return (
                <button
                  key={course}
                  onClick={() => {
                    setSelectedCourse(course);
                    setShowOnlyBookmarked(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/50 font-medium'
                  }`}
                >
                  <span className="truncate pr-2">{course}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100/80 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: List View */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          {/* Search Bar Full Width (GLASSMORPHISM) */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari buku, modul, slide PPT, atau topik..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none"
            />
          </div>

          {/* Mobile Course Dropdown */}
          <div className="flex md:hidden items-center gap-2 w-full">
            <div className="relative flex-1">
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setShowOnlyBookmarked(false);
                }}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              >
                <option value="ALL">Semua Matkul ({materials.length})</option>
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
          </div>

          {/* Main Content: Adaptive List Container (GLASSMORPHISM) */}
          <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl p-3 sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-all">
            {filteredMaterials.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl space-y-2 border border-slate-200/30 dark:border-white/5">
                <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600 mb-1" />
                <p className="font-semibold text-slate-600 dark:text-zinc-300">
                  {showOnlyBookmarked
                    ? 'Belum ada berkas yang disimpan di bookmark.'
                    : 'Rak ini masih kosong.'}
                </p>
                <p className="text-[11px]">
                  {showOnlyBookmarked
                    ? 'Klik ikon bookmark pada modul untuk menyimpannya di sini.'
                    : 'Belum ada berkas PDF untuk mata kuliah yang dipilih.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMaterials.map((mat) => {
                  const isBookmarked = bookmarkedIds.includes(mat.id);

                  return (
                    <motion.div
                      key={mat.id}
                      whileHover={{ x: 3 }}
                      onClick={() => onPreviewPdf(mat)}
                      className="group relative overflow-hidden p-3 sm:p-3.5 rounded-2xl bg-white/60 dark:bg-zinc-800/40 hover:bg-white/90 dark:hover:bg-zinc-800/70 backdrop-blur-sm cursor-pointer transition-all flex items-center justify-between gap-3 border border-slate-200/60 dark:border-white/5 hover:border-blue-500/40 dark:hover:border-blue-500/40 shadow-xs"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 group-hover:w-2 transition-all rounded-l-2xl" />

                      <div className="flex items-center gap-3 min-w-0 flex-1 pl-1.5">
                        <div className="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {mat.title}
                          </h4>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                            {mat.courseName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-slate-100/70 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-white/5">
                          {mat.session || 'MODUL'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleToggleBookmark(e, mat.id)}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                            isBookmarked
                              ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 shadow-xs'
                              : 'bg-white/80 dark:bg-zinc-800/80 border-slate-200/70 dark:border-white/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-700'
                          }`}
                          title={isBookmarked ? 'Hapus dari Bookmark' : 'Simpan Materi'}
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              isBookmarked ? 'fill-blue-600 dark:fill-blue-400 text-blue-600 dark:text-blue-400' : ''
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
                            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Hapus Berkas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
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
              className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-slate-200/40 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-900/50">
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
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isDragOver
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/40 hover:bg-white/80 dark:hover:bg-zinc-700/50'
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
                          <div className="p-3 bg-blue-100/80 dark:bg-blue-900/40 rounded-full">
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
                          <div className="p-3 bg-slate-200/80 dark:bg-zinc-700 rounded-full">
                            <UploadCloud className="w-6 h-6 text-slate-600 dark:text-zinc-400" />
                          </div>
                          <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                            Klik atau seret file PDF di sini
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                            Format PDF ONLY dan maks 10 MB
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

                <div className="px-6 sm:px-8 py-4 border-t border-slate-200/40 dark:border-white/10 flex items-center justify-end gap-3 shrink-0 bg-white/50 dark:bg-zinc-900/50">
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
    </motion.div>
  );
};