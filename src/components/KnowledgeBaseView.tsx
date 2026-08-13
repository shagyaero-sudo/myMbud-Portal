import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { MaterialFile } from '../types';

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
    return matchSearch && matchCourse;
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
    const GAS_URL = "https://script.google.com/macros/s/AKfycbyce8cTZ2F25PwyfISpmVJJDMiIunl8G8lCyzkPKQaiuUl-nxKNM5i9b72MMo4M_xis/exec";

    setUploadProgress(10);
    const base64Data = await fileToBase64(file);
    setUploadProgress(40);

    const payload = {
      fileName: file.name,
      mimeType: file.type,
      base64: base64Data,
      folderName: "myMbud Materials",
    };

    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setUploadProgress(80);

    if (!response.ok) {
      throw new Error(`Upload G-Drive gagal (${response.status}).`);
    }

    const data = await response.json();
    setUploadProgress(100);

    if (data.status !== 'success') {
      throw new Error(data.message);
    }

    return data.url;
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
      className="space-y-6 pb-28 sm:pb-16 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-[calc(4rem+env(safe-area-inset-bottom))]"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-4 sm:pt-6 pb-4 sm:pb-6 mb-2 sm:mb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            Bank PDF Matkul
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Perpustakaan Materi Perkuliahan
          </p>
        </div>

        {isOfficer && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenUploadModal}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Unggah PDF</span>
          </motion.button>
        )}
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Vertical Course Tabs */}
        <div className="hidden md:block md:col-span-4 lg:col-span-3 space-y-2">
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-4 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-1.5 transition-colors">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Daftar Mata Kuliah
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCourse('ALL')}
              className={`relative w-full text-left px-4 py-3 rounded-2xl text-xs transition-all flex items-center justify-between overflow-hidden ${
                selectedCourse === 'ALL'
                  ? 'text-white font-bold'
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium'
              }`}
            >
              {selectedCourse === 'ALL' && (
                <motion.div
                  layoutId="activeCourseBg"
                  className="absolute inset-0 bg-blue-600 rounded-2xl shadow-md shadow-blue-500/20"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">Semua Matkul</span>
              <span
                className={`relative z-10 text-[11px] px-2 py-0.5 rounded-full ${
                  selectedCourse === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                }`}
              >
                {materials.length}
              </span>
            </motion.button>

            {dynamicCoursesList.map((course) => {
              const count = materials.filter((m) => m.courseName === course).length;
              const isSelected = selectedCourse === course;
              return (
                <motion.button
                  key={course}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCourse(course)}
                  className={`relative w-full text-left px-4 py-3 rounded-2xl text-xs transition-all flex items-center justify-between overflow-hidden ${
                    isSelected
                      ? 'text-white font-bold'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeCourseBg"
                      className="absolute inset-0 bg-blue-600 rounded-2xl shadow-md shadow-blue-500/20"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 truncate pr-2">{course}</span>
                  <span
                    className={`relative z-10 text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Files List View */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berkas PDF, judul, atau pertemuan..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none"
            />
          </div>

          <div className="block md:hidden w-full">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none"
            >
              <option value="ALL">Semua Mata Kuliah ({materials.length} PDF)</option>
              {dynamicCoursesList.map((course) => {
                const count = materials.filter((m) => m.courseName === course).length;
                return (
                  <option key={course} value={course}>
                    {course} ({count} PDF)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Files List */}
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-2 transition-colors">
            {filteredMaterials.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/70 dark:bg-zinc-800/50 rounded-2xl">
                Tidak ada berkas PDF untuk mata kuliah ini.
              </div>
            ) : (
              <motion.div layout className="space-y-2">
                <AnimatePresence>
                  {filteredMaterials.map((mat) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                      key={mat.id}
                      onClick={() => onPreviewPdf(mat)}
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 cursor-pointer transition-all flex items-center justify-between gap-3 group border border-transparent hover:border-blue-100 dark:hover:border-blue-900"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {mat.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                            {mat.courseName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 px-3 py-1 rounded-full shadow-xs border border-slate-100 dark:border-zinc-700">
                          {mat.session}
                        </span>

                        {isOfficer && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMaterial(mat.id);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 transition-all"
                            title="Hapus Berkas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
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
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  Unggah Materi / Slide PDF
                </h3>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="flex flex-col flex-1 overflow-hidden">
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
                      className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
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
                            File PDF maksimal 25 MB
                          </p>
                        </div>
                      )}
                    </div>

                    {isUploading && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                          <span>Mengunggah ke Server...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="bg-slate-100 dark:bg-zinc-800 rounded-full h-2 w-full overflow-hidden">
                          <motion.div
                            className="h-full bg-blue-600"
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ ease: "easeInOut" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-zinc-900">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => setShowUploadModal(false)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      'Unggah Berkas'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};