import React, { useState } from 'react';
import { FileText, Download, Eye, Plus, Search, Trash2, Upload, BookOpen, ExternalLink, X } from 'lucide-react';
import { MaterialFile } from '../types';

interface KnowledgeBaseViewProps {
  materials: MaterialFile[];
  isOfficer: boolean;
  onAddMaterial: (material: Omit<MaterialFile, 'id' | 'uploadDate'>) => void;
  onDeleteMaterial: (id: string) => void;
  onPreviewPdf: (material: MaterialFile) => void;
}

const DEFAULT_COURSES = [
  'Sosiologi Pembangunan',
  'Komunikasi Politik & Publik',
  'Metode Penelitian Sosial',
  'Teori Sosiologi Modern',
  'Statistik untuk Ilmu Sosial',
  'Sosiologi Perkotaan & Desa',
  'Ekologi Sosial & Lingkungan',
  'Sosiologi Kebudayaan',
  'Masalah Sosial & Kebijakan',
];

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  materials,
  isOfficer,
  onAddMaterial,
  onDeleteMaterial,
  onPreviewPdf,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');

  // Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [formCourseName, setFormCourseName] = useState(DEFAULT_COURSES[0]);
  const [formSession, setFormSession] = useState('Pertemuan 1');
  const [formTitle, setFormTitle] = useState('');
  const [formUploader, setFormUploader] = useState('Pengurus Kelas A');
  const [formFileUrl, setFormFileUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');

  // Combine unique courses from data with default courses
  const allCoursesList = Array.from(new Set([...DEFAULT_COURSES, ...materials.map((m) => m.courseName)]));

  const filteredMaterials = materials.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.courseName.toLowerCase().includes(search.toLowerCase()) ||
      m.session.toLowerCase().includes(search.toLowerCase());
    const matchCourse = selectedCourse === 'ALL' || m.courseName === selectedCourse;
    return matchSearch && matchCourse;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourseName.trim() || !formTitle.trim()) return;

    onAddMaterial({
      courseId: formCourseName.slice(0, 6).toUpperCase().replace(/\s+/g, ''),
      courseName: formCourseName,
      session: formSession,
      title: formTitle.endsWith('.pdf') ? formTitle : `${formTitle}.pdf`,
      fileUrl: formFileUrl,
      fileType: 'pdf',
      fileSize: '3.2 MB',
      uploader: formUploader,
    });

    setFormTitle('');
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Bank Materi Matkul</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Arsip PPT & Materi Perkuliahan
          </p>
          <a
            href="https://classroom.its.ac.id/my/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold border border-slate-200/80 dark:border-zinc-700 transition-all mt-3"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>myITS Classroom</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>

        {isOfficer && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Unggah PDF</span>
          </button>
        )}
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column (~30%): Vertical Course Tabs (Desktop Only) */}
        <div className="hidden md:block md:col-span-4 lg:col-span-3 space-y-2">
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-4 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-1.5 transition-colors">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Daftar Mata Kuliah
            </div>

            <button
              onClick={() => setSelectedCourse('ALL')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs transition-all flex items-center justify-between ${
                selectedCourse === 'ALL'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium'
              }`}
            >
              <span>Semua Matkul</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${selectedCourse === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'}`}>
                {materials.length}
              </span>
            </button>

            {allCoursesList.map((course) => {
              const count = materials.filter((m) => m.courseName === course).length;
              const isSelected = selectedCourse === course;
              return (
                <button
                  key={course}
                  onClick={() => setSelectedCourse(course)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium'
                  }`}
                >
                  <span className="truncate pr-2">{course}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column (~70%): Files List View & Mobile Select Filter */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          {/* Mobile Course Filter Dropdown */}
          <div className="block md:hidden w-full">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none"
            >
              <option value="ALL">Semua Mata Kuliah ({materials.length} berkas)</option>
              {allCoursesList.map((course) => {
                const count = materials.filter((m) => m.courseName === course).length;
                return (
                  <option key={course} value={course}>
                    {course} ({count} berkas)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search Bar */}
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

          {/* Files List View */}
          <div className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-2 transition-colors">
            {filteredMaterials.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/70 dark:bg-zinc-800/50 rounded-2xl">
                Tidak ada berkas PDF untuk mata kuliah ini.
              </div>
            ) : (
              filteredMaterials.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => onPreviewPdf(mat)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 cursor-pointer transition-all flex items-center justify-between gap-3 group border border-transparent hover:border-blue-100 dark:hover:border-blue-900"
                >
                  {/* Left: PDF Icon + Title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{mat.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{mat.courseName}</p>
                    </div>
                  </div>

                  {/* Middle: Session & Size Badges */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 px-3 py-1 rounded-full shadow-xs border border-slate-100 dark:border-zinc-700">
                      {mat.session}
                    </span>
                    <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 font-mono">
                      {mat.fileSize}
                    </span>
                  </div>

                  {/* Right: Action Icons (Minimalist) */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onPreviewPdf(mat)}
                      className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-800 transition-all"
                      title="Pratinjau PDF"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <a
                      href={mat.fileUrl}
                      download={mat.title}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-800 transition-all"
                      title="Unduh Berkas"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    {isOfficer && (
                      <button
                        onClick={() => onDeleteMaterial(mat.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-zinc-800 transition-all"
                        title="Hapus Berkas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upload Material Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Unggah Materi / Slide PDF Kuliah</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleUploadSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Mata Kuliah</label>
                  <select
                    value={formCourseName}
                    onChange={(e) => setFormCourseName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {allCoursesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Sesi / Pertemuan</label>
                    <select
                      value={formSession}
                      onChange={(e) => setFormSession(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pertemuan 1">Pertemuan 1</option>
                      <option value="Pertemuan 2">Pertemuan 2</option>
                      <option value="Pertemuan 3">Pertemuan 3</option>
                      <option value="Pertemuan 4">Pertemuan 4</option>
                      <option value="Pertemuan 5">Pertemuan 5</option>
                      <option value="Pertemuan 6">Pertemuan 6</option>
                      <option value="Pertemuan 7">Pertemuan 7</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Pengunggah</label>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Judul / Nama File Materi</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Pengantar Teori Pembangunan.pdf"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 text-center space-y-1">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200">File PDF Siap Diunggah</p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Tersinkronisasi ke seluruh mahasiswa Kelas A</p>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                >
                  Unggah Berkas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
